const typeorm = require('typeorm')
const { JolocomTypeormStorage } = require('@jolocom/sdk-storage-typeorm')
import { JolocomSDK, JSONWebToken } from '@jolocom/sdk'
const { isEncryptionRequest, isDecryptionRequest } = require('@jolocom/sdk/js/src/lib/interactionManager/guards')
import { FilePasswordStore } from '@jolocom/sdk-password-store-filesystem'
import * as WebSocket from 'ws'
import { FlowType, EstablishChannelFlowState } from '@jolocom/sdk/js/src/lib/interactionManager/types'
import { ChannelTransportAPI, ChannelTransportType, ChannelTransport } from '@jolocom/sdk/js/src/lib/channels'

// @ts-ignore
global.fetch = require('node-fetch')

const typeormConfig = {
  type: 'sqlite',
  database: __dirname + '/db.sqlite3',
  logging: ['error', 'warn', 'schema'],
  entities: [ ...require('@jolocom/sdk-storage-typeorm').entityList ],
  migrations: [__dirname + '/migrations/*.ts'],
  migrationsRun: true,
  synchronize: true,
  cli: {
    migrationsDir: __dirname + '/migrations',
  },
}

const WebSocketsTransportFactory = (transport: ChannelTransport) => {
  console.log('creating websocket', transport)
  let _q: string[] = []
  let _qPromiseResolve, _qPromise: Promise<void>
    const _qPromiseRefresh = () => {
      if (_qPromise) return
      _qPromise = new Promise<void>(resolve => {
        _qPromiseResolve = resolve
      }).finally(() => _qPromise = _qPromiseResolve = null)
    }
  _qPromiseRefresh()
  const _qPush = (val) => {
    _q.push(val)
    if (_qPromise) _qPromiseResolve()
  }
  const _qNext = async () => {
    if (_q.length == 0) await _qPromise
    const ret = _q.shift()
    _qPromiseRefresh()
    return ret
  }

  const readyPromise = new Promise<void>(resolve => {
    const ws = new WebSocket(transport.config)
    ws.on('open', function open() {
      console.log('Websocket opened to', transport.config)
      transportAPI.send = (m:string) => ws.send(JSON.stringify(m))
      transportAPI.receive = _qNext
      resolve()
    });

    ws.on('message', function incoming(message) {
      console.log('received websocket message:', message)
      const data = message.trim()
      if (data) _qPush(data)
    })
  })

  // @ts-ignore
  const transportAPI: ChannelTransportAPI = {
    ready: readyPromise,
  }

  return transportAPI
}

async function start() {
  const initialJWT = process.argv[2]
  if (!initialJWT) {
    console.error(`Usage ${process.argv0} {JWT}`)
    process.exit(1)
  }

  const typeormConnection = await typeorm.createConnection(typeormConfig)
  const storage = new JolocomTypeormStorage(typeormConnection)
  const passwordStore = new FilePasswordStore(__dirname+'/password.txt')

  console.log('About to create JolocomSDK instance')
  const sdk = new JolocomSDK({ storage, passwordStore })

  sdk.channels.registerTransportHandler(ChannelTransportType.WebSockets, WebSocketsTransportFactory)
  sdk.setDefaultDidMethod('jun')

  // Running init with no arguments will:
  // - create an identity if it doesn't exist
  // - load the identity from storage
  const identityWallet = await sdk.init()


  // @ts-ignore FIXME in sdk
  console.log('Agent identity', identityWallet.identity)

  /**
   * RESPONDER
   */
  const interxn = await sdk.processJWT(initialJWT)

  if (interxn.flow.type == FlowType.Resolution) {
    const resp = await interxn.createResolutionResponse()
    await interxn.send(resp)
    process.exit(0)
  }

  if (interxn.flow.type !== FlowType.EstablishChannel)
    throw new Error('interaction type "' + interxn.flow.type + '" is not an "EstablishChannel!"')

  const flowState = interxn.flow.state as EstablishChannelFlowState
  const transports = flowState.transports
  let transportIdx = transports.findIndex((t, i) => t.type === ChannelTransportType.WebSockets)
  if (transportIdx < 0) {
    throw new Error('no "' + ChannelTransportType.WebSockets + '" transport found!')
  }

  const resp = await interxn.createEstablishChannelResponse(transportIdx)
  await interxn.processInteractionToken(resp)

  const ch = await sdk.channels.create(interxn)
  ch.send(resp.encode())
  ch.start(async (interxn) => {
    let resp
    // TODO: make this configurable
    //       for now hardcoded
    switch (interxn.flow.type) {
      case FlowType.Authentication:
        resp = await interxn.createAuthenticationResponse()
        break
      case FlowType.Encrypt:
        resp = await interxn.createEncResponseToken()
        break
      case FlowType.Decrypt:
        resp = await interxn.createDecResponseToken()
        break
    }

    if (resp) {
      ch.send(resp.encode())
    }
  })
}

start()
