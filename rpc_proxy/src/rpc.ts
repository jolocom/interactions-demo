import { Plugin, Server, Request, ResponseToolkit } from '@hapi/hapi'
import * as Boom from '@hapi/boom'
import { JolocomSDK } from '@jolocom/sdk'
import { JolocomLib } from 'jolocom-lib'
//@ts-ignore WebSocket is not exported
import {Server as WSServer, WebSocket} from 'ws'
import * as url from 'url'

const debug = process.env.DEBUG
  ? console.log.bind(console)
  : function(){}

debug('Debugging output is on')

const PUBLIC_HOSTPORT = process.env.PUBLIC_HOSTPORT || 'localhost:9000'
const PUBLIC_HTTP_URL = `http://${PUBLIC_HOSTPORT}`
const PUBLIC_WS_URL = `ws://${PUBLIC_HOSTPORT}`

type PluginOptions = {
  sdk: JolocomSDK;
  path: string;
};


// FIXME this is not a channel, it's a session
type ChannelState = {
    // TODO rename to authRequest?
    // FIXME set proper type
    token: any
    jwt?: string
    nonce?: string
    rpcWS?: WebSocket
    ssiWS?: WebSocket
    did?: string
    paths?: {
      rpcWS: string,
      ssiWS: string
    }
    urls?: {
      rpcWS: string,
      ssiWS: string
    }
    established?: boolean
    messages: {[id: string]: any}
}

class PeerMap {
  private peerMap: {
    [identifier: string]: ChannelState
  } = {}

  public getChannel = (id: string): ChannelState => {
    const ch = this.peerMap[id]
    if (!ch) throw new Error('channel not found!')
    return ch
  }
  public getChannelJSON = (ch: ChannelState) => {
    return {
      jwt: ch.token.encode(),
      nonce: ch.token.nonce,
      paths: ch.paths
    }
  }

  public isChannelInitialised = (id: string) => this.getChannel(id).established

  // If the token is not set, the rendevouz endpoint never redirected to it.
  public doesChannelExist = (id: string) => !!this.getChannel(id).token

  // This is partial because of the messages field
  public updateChannel = (id: string, update: Partial<ChannelState>) => {
    const ch = this.getChannel(id)
    return this.peerMap[id] = {
      ...ch,
      ...update
    }
  }

  // FIXME rename to createChannelRelay? or something
  public createChannel = async (sdk: JolocomSDK) => {
    const paths = {
      ssiWS: '/rpcProxy/ssi', // FIXME compute
      rpcWS: null
    }
    const urls = {
      ssiWS: `${PUBLIC_WS_URL}${paths.ssiWS}`,
      rpcWS: null
    }

    const token = await authRequestToken(sdk, urls.ssiWS)

    paths.rpcWS = `/rpcProxy/${token.nonce}`
    urls.rpcWS = `${PUBLIC_WS_URL}${paths.rpcWS}`

    // FIXME add QR code also!
    const ch = {
      token: token,
      paths,
      urls,
      id: token.nonce,
      messages: {}
      // FIXME add info about connected peers in a more structure manner than
      // just `rpcWS` and `ssiWS`?
    }
    this.peerMap[ch.id] = ch
    return ch
  }
}

const peerMap = new PeerMap()

const authRequestToken = async (sdk: JolocomSDK, callbackURL: string) => {
  return sdk.idw.create.interactionTokens.request.auth({
    callbackURL, description: callbackURL
  }, await sdk.bemw.keyChainLib.getPassword())
}

export const rpcProxyPlugin: Plugin<PluginOptions> = {
  name: "rpcProxy",
  version: "0.0.1",
  requirements: {
    node: "10",
  },
  register: async (server: Server, { sdk,  }: PluginOptions) => {
    /**
     * Route handler for SSI capable agents.
     *
     * Agents are expected to exclusively use WS
     *
     * On initial connection, Agents are expected to send an Authentication
     * reponse JWT to establish the channel.
     */
    server.route({
      method: 'POST', path: '/ssi',
      config: {
        // payloads are expected to be JWT, and maybe FIXME auto parse
        // payload: { output: 'data', parse: true },
        plugins: {
          websocket: {
            only: true,
            connect: ({ ctx, ws }) => {
              // TODO track the ws early on, to keep the peerMap up-to-date
              // TODO reset any timeouts that were set to clear the open channel from memory
            },
            disconnect: ({ ctx }) => {
              // TODO set a timeout to clear the open channel from memory
            }
          }
        }
      },
      handler: async (
        request: Request,
        h: ResponseToolkit
      ) => {
        let { initially, ws, ctx } = request.websocket()
        debug("incoming message from SSI agent", initially, ctx, request.payload)

        const data = request.payload
        if (!data) {
          debug('no payload')
          return ''
        }

        let ch = ctx.ch
        if (!ch) {
          // If the connection context doesn't already have an associated
          // channel then this client has not yet successfully authenticated
          //
          // We expect to receive an Authentication Response
          const authResp = JolocomLib.parse.interactionToken.fromJWT(data)
          ch = peerMap.getChannel(authResp.nonce)
          const authReq = ch.token

          //console.log('about to validate', authResp, authReq)
          // FIXME TODO does this throw if invalid?
          // FIXME Boom error handling
          // @ts-ignore
          //await sdk.idw.validateJWT(authResp, authReq)

          ctx.ch = peerMap.updateChannel(ch.token.nonce, {
            ssiWS: ws,
            did: authResp.signer.did,
            established: true
          })
          debug(`New SSI Agent connected to channel ${ctx.ch.token.nonce}. Channel established.`)
          const startMsg = ctx.ch.messages[0]
          startMsg.resolve(startMsg)
          // FIXME this should just pass the token through the interaction
          // manager maybe? then return whatever is returned
          return ''
        }

        // Past this point we know that this is an RPC response

        console.log('received a message', data)
        const weGood = await sdk.tokenRecieved(data)
        console.log('token processed successfully:', weGood)
        const rpcResp = JolocomLib.parse.interactionToken.fromJWT(data)
        const rpcInteraction = sdk.bemw.interactionManager.getInteraction(rpcResp.nonce)
        const interactionTokens = rpcInteraction.getMessages() 

        // find msg by id somehow
        const msg = ch.messages[interactionTokens[0].nonce]

        // resolve this message
        msg.resolve({
          id: msg.id,
          request: msg,
          response: interactionTokens[1].payload.interactionToken.result
        })

        return ''
      },
    })


    /**
     * Route handler for non-SSI capable frontends
     *
     * Frontend clients must POST to '/' to create a new channel/session
     * They will then get a channel JSON object which contains a ws:// URL to
     * connect to this newly created channel
     *
     * The ws:// URL generated is by appending the token nonce
     */
    server.route({
      method: "POST", path: `/{nonce?}`,
      config: {
                                 // BIG WARNING
        cors: { origin: ['*'] }, // FIXME lift up to config.ts or something and add
                                 // BIG WARNING
        payload: { output: "data", parse: true, allow: "application/json" },
        plugins: {
          websocket: {
            connect: async ({ ctx, ws, req }) => {
              // TODO track the ws early on, to keep the peerMap up-to-date
              // TODO reset any timeouts that were set to clear the open channel from memory
              //
              // If the connection context doesn't already have an associated
              // channel then we simply create a new one for this frontend client
            },
            disconnect: ({ ctx }) => {
              debug('client disconnect; context', ctx)
              // TODO set a timeout to clear the open channel from memory
            }
          }
        },
      },
      handler: async (
        request: Request,
        h: ResponseToolkit
      ) => { /**/
        const { initially, mode, ctx, ws } = request.websocket()
        const params = request.params || {}
        let ch
        debug('handle front for chan', params.nonce, 'mode', mode, 'ctx', ctx)

        if (mode === 'websocket') {
          debug('websocket request, initially', initially, 'chan', ctx.ch)

          if (!params.nonce) {
            return Boom.badRequest('missing session nonce')
          }

          try {
            ch = peerMap.getChannel(params.nonce)
            if (!ch.rpcWS) {
              // if this is an initial request, we find the channel and update it with our current open
              // websocket which is the 'authenticated' frontend socket
              // 'authenticated' because of usage of the nonce of course
              ch.rpcWS = ws
            }
          } catch (err) {
            return Boom.badRequest(err.toString())
          }
        } else {
          if (params.nonce) {
            // request not supported currently
            // TODO should we support POST requests to the channel?
            return Boom.badRequest('not supported')
          }
          debug('awaiting createChannel')
          ch = await peerMap.createChannel(sdk)
          const chJSON = peerMap.getChannelJSON(ch)
          debug('channel json', chJSON)
          return chJSON
        } 

        // All incoming messages on the frontend WebSocket are expected to be
        // RPC calls in a simple JSON format
        // These calls must be proxied to the connected SSI Agent, in the form
        // of JWT interaction tokens.
        const msg = request.payload // hapi auto parsed
        if (!msg) {
          debug('no msg :(')
          return
        }

        if (msg.rpc == 'start') {
          ch.messages[0] = msg
        } else {
          if (!ch.ssiWS) {
            return Boom.badRequest('no SSI agent connected yet')
          }
          let ssiRPC

          // Past this point we know that this is a request on an established
          // channel accessible through ch, and there's a connected SSI Agent

          try {
            if (msg.rpc == 'asymEncrypt') {
              ssiRPC = await sdk.rpcEncRequest({
                toEncrypt: Buffer.from(msg.request),
                target: `${ch.did}#keys-1`,
                callbackURL: ''
              })
            } else if (msg.rpc == 'asymDecrypt') {
              ssiRPC = await sdk.rpcDecRequest({
                toDecrypt: Buffer.from(msg.request),
                callbackURL: ''
              })
            } else {
              throw new Error('unrecognised msg: ' + msg)
            }
          } catch (err) {
            debug('failed to create RPC token', err)
            throw err
          }

          let rpcToken
          try {
            rpcToken = JolocomLib.parse.interactionToken.fromJWT(ssiRPC)
          } catch (err) {
            debug('failed to reparse RPC token', ssiRPC)
            throw err
          }

          ch.messages[rpcToken.nonce] = msg

          console.log('sending RPC token', ssiRPC)
          ch.ssiWS.send(JSON.stringify(ssiRPC))
        }

        return new Promise(resolve => {
          // we postpone this request's resolution until the SSI agent
          // responds
          msg.resolve = resolve
        }).then(response => JSON.stringify(response))

      /**/ }
    })
  }
}
