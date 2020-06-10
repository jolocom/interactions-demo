const { JSONWebToken } = require('jolocom-lib/js/interactionTokens/JSONWebToken')
const typeorm = require('typeorm')
const { JolocomTypeormStorage } = require('@jolocom/sdk-storage-typeorm')
const { JolocomSDK } = require('@jolocom/sdk')
const { isEncryptionRequest, isDecryptionRequest } = require('@jolocom/sdk/js/src/lib/interactionManager/guards')
import { FilePasswordStore } from '@jolocom/sdk-password-store-filesystem'
import * as WebSocket from 'ws'
let initialJWT

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

async function start() {
  if (!process.argv[2]) {
    console.error(`Usage ${process.argv0} {JWT}`)
    process.exit(1)
  }

  const typeormConnection = await typeorm.createConnection(typeormConfig)
  const storage = new JolocomTypeormStorage(typeormConnection)
  const passwordStore = new FilePasswordStore(__dirname+'/password.txt')

  console.log('About to create JolocomSDK instance')
  const sdk = new JolocomSDK({ storage, passwordStore })

  // Running init with no arguments will:
  // - create an identity if it doesn't exist
  // - load the identity from storage
  const identityWallet = await sdk.init()
  console.log('Agent identity', identityWallet.identity)

  /**
   * RESPONDER
   */
  initialJWT = process.argv[2]
  // FIXME instead of this should go through SDK using consumeAuthToken for
  // example
  const token = JSONWebToken.decode(initialJWT)


  const wsURL = token.payload.interactionToken.callbackURL
  console.log('payload is here, need to get the ws:// url out!', token.payload, wsURL)

  const ws = new WebSocket(wsURL)

  let ready = false
  ws.on('open', function open() {
    console.log('Websocket opened to', wsURL)
    consumeAuthToken(sdk, initialJWT).then(response => {
      console.log('response', response)
      ws.send(JSON.stringify(response))
    })
  });

  ws.on('message', function incoming(message) {
    if (!ready) {
      ready = true
      console.log('READY!')
      //ws.send(JSON.stringify({}))
      return
    }
    console.log('received message:', message)
    if (!message.trim()) {
      console.log('no payload')
      return
    }
    const token = JSONWebToken.decode(message)
    console.log('decoded to token:', token.nonce);
    if (!ready) {
      console.log('discarding message because not ready')
      return
    } else {
      console.log('consuming RPC')
      consumeRPCToken(sdk, message).then(result => {
        console.log('sent result', result)
        ws.send(JSON.stringify(result))
      })
    }
  })
}

start()

// for ws.onMessage() try to consume the token and begin an interaction
async function consumeAuthToken(sdk, jwt) {
  // see sdk/sso/authenticationRequest
  const token = JSONWebToken.decode(jwt)
  const { interactionManager } = sdk.bemw
  let interaction
  try {
    interaction = await interactionManager.start(
      '', // channel,
      token
    )
  } catch (err) {
    console.error('failed to start interaction')
    throw err
  }

  let response
  try {
    response = await interaction.createAuthenticationResponse()
    // FIXME this doesn't work because new transport layer WS
    // interaction.send(response)
  } catch (err) {
    console.error('failed to createAuthenticationResponse')
    throw err
  }

  return response.encode()
}
// for ws.onMessage() try to consume the token and begin an interaction
async function consumeRPCToken(sdk, jwt) {
  // see sdk/sso/authenticationRequest
  const token = JSONWebToken.decode(jwt)
  const weGood = await sdk.tokenRecieved(jwt)
  if (!weGood) {
    throw new Error('could not process token: ' + jwt)
  }

  const { interactionManager } = sdk.bemw
  const interaction = interactionManager.getInteraction(token.nonce)
  const rpcToken = token.payload.interactionToken

  let respToken
  if (isEncryptionRequest(rpcToken)) {
    respToken = await interaction.createEncResponseToken()
  } else if (isDecryptionRequest(rpcToken)) {
    debugger
    respToken = await interaction.createDecResponseToken()
  } else {
    throw new Error('of course')
  }

  return respToken.encode()
}
