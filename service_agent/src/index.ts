import * as hapi from '@hapi/hapi'
import * as HAPIWebSocket from 'hapi-plugin-websocket'
import { HapiJolocomWebService } from 'hapi-jolocom'

import { JolocomSDK, CredentialOffer, JSONWebToken } from "@jolocom/sdk"
import { FilePasswordStore } from "@jolocom/sdk-password-store-filesystem"
import { JolocomTypeormStorage } from "@jolocom/sdk-storage-typeorm"
import { CredentialRenderTypes, IConstraint } from 'jolocom-lib/js/interactionTokens/interactionTokens.types'
import { ISignedCredentialAttrs } from 'jolocom-lib/js/credentials/signedCredential/types'
import { Credential } from 'jolocom-lib/js/credentials/credential/credential'

import { claimsMetadata } from '@jolocom/protocol-ts'
import { constraintFunctions } from 'jolocom-lib/js/interactionTokens/credentialRequest'

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
const requestableCredentials = {
  ...claimsMetadata,
  [DemoCredTypeConstant]: demoCredMetadata,
}

export const generateRequirementsFromConfig = ({
  issuer,
  metadata
}: { issuer?: string, metadata }) => ({
  type: metadata.type,
  constraints: (issuer
    ? [constraintFunctions.is('issuer', issuer)]
    : [])
})

export const init = async () => {
  const passwordStore = new FilePasswordStore(__dirname+'/../password.txt')
  const connection = await typeorm.createConnection(typeormConfig)
  const storage = new JolocomTypeormStorage(connection)

  const jolo = new JolocomSDK({
    storage,
    passwordStore
  })

  const publicHostport = process.env.SERVICE_HOSTPORT || 'localhost:9000'
  const publicPort = publicHostport.split(':')[1]
  const listenPort = process.env.SERVICE_LISTEN_PORT || publicPort || 9000;

  const ident = await jolo.init()

  const server = new hapi.Server({
    port: listenPort,
    debug: {
      log: ["*"],
      request: ["*"]
    },
  });
  await server.register(HAPIWebSocket)

  console.log('Agent ready,', ident.didDocument)

  /**
   * Using the "HapiJolocomWebService"
   */
  const joloPlugin = new HapiJolocomWebService(jolo, {
    tls: !!process.env.SERVICE_TLS || false,
    publicHostport,

    extraRouteConfig: {
      // BIG WARNING
      cors: { origin: ['*'] }, // FIXME lift up to config.ts or something and add
      // BIG WARNING
    },

    rpcMap: {
      /**
       * Authentication Interactions
       */
      peerResolutionInterxn: async (args, { createInteractionCallbackURL, wrapJWT }) => {
        const callbackURL = createInteractionCallbackURL(async (jwt: string) => {
          const interxn = await jolo.processJWT(jwt)
          console.log('peer resolution request request handled for', interxn.counterparty)
        })
        return wrapJWT(
          await jolo.resolutionRequestToken({
            callbackURL
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
      },

      /**
       * Channel Interactions
       * Channels are authenticated lon
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
       * Credential interactions
       */
      getCredentialTypes: async () => {
        return offeredCredentials.map(o => o.type)
      },
      offerCred: async (req: { types: string[], invalid?: string[] }, { createInteractionCallbackURL, wrapJWT }) => {
        const filteredOfferedCreds = req.types.reduce((acc, t) => {
          const cred = offeredCredentials.find(o => o.type == t)
          if (cred) return [...acc, cred]
          else return acc
        }, [])

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

      getRequestableCredentialTypes: async () => {
        return Object.keys(requestableCredentials)
      },
      credShareRequest: async (
        req: { types: string[], invalid?: string[] },
        { createInteractionCallbackURL, wrapJWT }
      ) => {
        const credTypes = req.types.filter(t => !!requestableCredentials[t])

        if (credTypes.length === 0) throw new Error('no credential types matching provided "types" parameter')

        const callbackURL = createInteractionCallbackURL(async (jwt: string) => {
          const interxn = await jolo.processJWT(jwt)
          console.log('credShareRequest called back for', interxn.id)
        })

        const credentialRequirements = credTypes.map((credentialType) => {
          return generateRequirementsFromConfig({
            metadata: requestableCredentials[credentialType]
          })
        })
        return wrapJWT(
          await jolo.credRequestToken({
            callbackURL,
            credentialRequirements
          })
        )
      },
    }
  });


  await server.register({
    plugin: joloPlugin,
    routes: {
      prefix: '/jolo'
    }
  })

  await server.start();
  server.log(["info"], "Hapi server listening on port " + listenPort)
};

init();
