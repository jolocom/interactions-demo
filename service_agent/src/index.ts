import * as hapi from '@hapi/hapi'
import * as HAPIWebSocket from 'hapi-plugin-websocket'
import { HapiJolocomWebService } from 'hapi-jolocom'

import { JolocomSDK, CredentialOffer, JSONWebToken } from "@jolocom/sdk"
import { FilePasswordStore } from "@jolocom/sdk-password-store-filesystem"
import { JolocomTypeormStorage } from "@jolocom/sdk-storage-typeorm"
import { CredentialRenderTypes } from 'jolocom-lib/js/interactionTokens/interactionTokens.types'
import { ISignedCredentialAttrs } from 'jolocom-lib/js/credentials/signedCredential/types'
import { Credential } from 'jolocom-lib/js/credentials/credential/credential'

const typeorm = require("typeorm")

const typeormConfig = {
  type: 'sqlite',
  database: __dirname + '/../db.sqlite3',
  logging: ['error', 'warn', 'schema'],
  entities: [ ...require('@jolocom/sdk-storage-typeorm').entityList ],
  migrations: [__dirname + '/../migrations/*.ts'],
  migrationsRun: true,
  synchronize: true,
  cli: {
    migrationsDir: __dirname + '../migrations',
  }
}

const DemoCredTypeConstant = 'DemoCred'

const demoCredMetadata = {
  type: ['Credential', DemoCredTypeConstant],
  name: 'Demonstration Credential',
  context: [
    {
      name: 'schema:name',
      description: 'schema:description'
    }
  ]
}

const demoCredOffer: CredentialOffer = {
  type: DemoCredTypeConstant, // NOTE: this actually doesn't necessarily need to match
  requestedInput: {}, // currently not used
  renderInfo: {
    renderAs: CredentialRenderTypes.document,
    background: {
      color: '#420'
    }
  }
}
const offeredCredentials =  [demoCredOffer]

export const init = async () => {
  const passwordStore = new FilePasswordStore(__dirname+'/../password.txt')
  const connection = await typeorm.createConnection(typeormConfig)
  const storage = new JolocomTypeormStorage(connection)

  const jolo = new JolocomSDK({
    storage,
    passwordStore
  })

  const port = process.env.PUBLIC_PORT || 9000;
  const ident = await jolo.init()
  console.log('Agent ready', ident)

  const server = new hapi.Server({
    port,
    debug: {
      request: ["*"]
    },
  });


  await server.register(HAPIWebSocket)

  /**
   * Using the "HapiJolocomWebService"
   */
  const joloPlugin = new HapiJolocomWebService(jolo, {
    tls: !!process.env.SERVICE_TLS || false,
    publicHostport: process.env.SERVICE_HOSTPORT || 'localhost:9000',

    extraRouteConfig: {
      // BIG WARNING
      cors: { origin: ['*'] }, // FIXME lift up to config.ts or something and add
      // BIG WARNING
    },

    rpcMap: {

      /**
       * Channeled Interactions
       */
      createDemoChannel: async (args, { createChannel, wrapJWT }) => {
        const ch = await createChannel({ description: 'A Jolocom Demo' })
        return wrapJWT(ch.initialInteraction.getMessages()[0])
      },
      waitForChannelAuth: async ({ chId }: { chId: string }) => {
        const ch = await jolo.channels.get(chId)
        await ch.authPromise
        return ch.getSummary()
      },
      remoteEncrypt: async (request: { chId, data }) => {
        const ch = await jolo.channels.get(request.chId)
        const otherDid = ch.counterparty && ch.counterparty.did
        if (!otherDid) throw new Error('no counterparty!')

        const ssiMsg = await jolo.rpcEncRequest({
          toEncrypt: Buffer.from(request.data),
          target: otherDid,
          callbackURL: ''
        })
        const resp = await ch.sendQuery(ssiMsg)
        return resp.payload.interactionToken.result
      },

      remoteDecrypt: async (request: { chId, data }) => {
        const ch = await jolo.channels.get(request.chId)

        const ssiMsg = await jolo.rpcDecRequest({
          toDecrypt: Buffer.from(request.data, 'base64'),
          callbackURL: ''
        })
        const resp = await ch.sendQuery(ssiMsg)
        return Buffer.from(resp.payload.interactionToken.result, 'base64').toString()
      },


      /**
       * "Classic" interactions
       */
      getCredentialTypes: async () => {
        return offeredCredentials.map(o => o.type)
      },
      offerCred: async (req: { types: string[], invalid?: string[] }, { createInteractionCallbackURL, wrapJWT }) => {
        const filteredOfferedCreds = req.types.map(t => offeredCredentials.find(o => o.type == t))
        if (filteredOfferedCreds.length === 0) throw new Error('no offers matching provided "types" parameter')
        const invalidTypes = req.invalid

        const callbackURL = createInteractionCallbackURL(async (jwt: string) => {
          const interxn = await jolo.processJWT(jwt)
          console.log('offerCred called back for', interxn.id)

          const credentials = await interxn.issueSelectedCredentials({
            [DemoCredTypeConstant]: async (requestedInput?: any) => {
              let subject
              if (invalidTypes.includes(DemoCredTypeConstant)) subject = 'INVALID'
              return {
                claim: {
                  message: 'Demo Credential for ' + interxn.participants.responder.did,
                },
                metadata: demoCredMetadata,
              }
            }
          })
          console.log('credentials issued', credentials)
          return interxn.createCredentialReceiveToken(credentials)
        })

        return wrapJWT(
          await jolo.credOfferToken({
            callbackURL,
            offeredCredentials: filteredOfferedCreds
          })
        )
      },

      authnInterxn: async (req: { description: string }, { createInteractionCallbackURL, wrapJWT }) => {
        const callbackURL = createInteractionCallbackURL(async (jwt: string) => {
          const interxn = await jolo.processJWT(jwt)
          console.log('auth request handled for', interxn.counterparty)
        })
        return wrapJWT(
          await jolo.authRequestToken({
            description: req.description,
            callbackURL
          })
        )
      }
    }
  });


  await server.register({
    plugin: joloPlugin,
    routes: {
      prefix: '/jolo'
    }
  })

  await server.start();
  console.log("running")
};

init();
