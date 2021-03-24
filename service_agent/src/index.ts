// @ts-ignore
import * as hapi from '@hapi/hapi'
// @ts-ignore
import * as HAPIWebSocket from 'hapi-plugin-websocket'
import { HapiJolocomWebService } from 'hapi-jolocom'
import { last } from 'ramda'

import { JolocomSDK } from '@jolocom/sdk'
// @ts-ignore
import { FilePasswordStore } from '@jolocom/sdk-password-store-filesystem'
import { JolocomTypeormStorage } from '@jolocom/sdk-storage-typeorm'
import { CredentialRenderTypes, CredentialOffer } from '@jolocom/protocol-ts'

import { claimsMetadata } from '@jolocom/protocol-ts'
import { constraintFunctions } from 'jolocom-lib/js/interactionTokens/credentialRequest'
import { CredentialOfferFlowState } from '@jolocom/sdk/js/interactionManager/types'

import { genericCredentialOfferHandler } from './genericCredentialOfferHandler'

const typeorm = require('typeorm')

const typeormConfig = {
  type: 'sqlite',
  database: __dirname + '/../db.sqlite3',
  logging: ['error', 'warn', 'schema'],
  entities: [...require('@jolocom/sdk-storage-typeorm').entityList],
  migrations: [__dirname + '/../migrations/*.ts'],
  migrationsRun: true,
  synchronize: true,
  cli: {
    migrationsDir: __dirname + '../migrations',
  },
}

enum CredTypes {
  DemoCred = 'DemoCred',
  DemoIdCard = 'DemoIdCard',
  DemoDriversLicense = 'DemoDriversLicense',
  ProofOfIdCredentialDemo = 'ProofOfIdCredentialDemo',
  ProofOfDriverLicenceDemo = 'ProofOfDriverLicenceDemo',
  ProofOfTicketDemo = 'ProofOfTicketDemo',
}

const genericMetadata = (type: CredTypes, name: string) => ({
  type: ['Credential', type],
  name,
  context: [
    {
      name: 'schema:name',
      description: 'schema:description',
    },
  ],
})

const genericOffer = (type: CredTypes, color?: string): CredentialOffer => {
  const meta = credMetadata[type]
  return {
    type, // NOTE: this actually doesn't necessarily need to match
    requestedInput: {}, // currently not used
    renderInfo: {
      renderAs: CredentialRenderTypes.document,
      background: {
        color: color ?? '#a599d8',
      },
    },
    credential: {
      schema: 'https://schema.org/EducationalOccupationalCredential',
    },
  }
}

const credMetadata = {
  [CredTypes.DemoCred]: genericMetadata(
    CredTypes.DemoCred,
    'Demonstration Credential',
  ),
  [CredTypes.DemoIdCard]: genericMetadata(
    CredTypes.DemoIdCard,
    'Demonstration ID Card Credential',
  ),
  [CredTypes.DemoDriversLicense]: genericMetadata(
    CredTypes.DemoDriversLicense,
    "Demonstration Driver's License Credential",
  ),
  [CredTypes.ProofOfIdCredentialDemo]: genericMetadata(
    CredTypes.ProofOfIdCredentialDemo,
    'ProofOfIdCredentialDemo',
  ),
  [CredTypes.ProofOfDriverLicenceDemo]: genericMetadata(
    CredTypes.ProofOfDriverLicenceDemo,
    'ProofOfDriverLicenceDemo',
  ),
  [CredTypes.ProofOfTicketDemo]: genericMetadata(
    CredTypes.ProofOfTicketDemo,
    'ProofOfTicketDemo',
  ),
}

const offeredCredentials = [
  genericOffer(CredTypes.DemoCred),
  genericOffer(CredTypes.DemoIdCard),
  genericOffer(CredTypes.DemoDriversLicense),
]

const requestableCredentials = {
  ...claimsMetadata,
  ...credMetadata,
}

export const generateRequirementsFromConfig = ({
  issuer,
  metadata,
}: {
  issuer?: string
  metadata: { type: string[] }
}) => ({
  type: metadata.type,
  constraints: issuer ? [constraintFunctions.is('issuer', issuer)] : [],
})

export const init = async () => {
  const passwordStore = new FilePasswordStore(__dirname + '/../password.txt')
  const connection = await typeorm.createConnection(typeormConfig)
  const storage = new JolocomTypeormStorage(connection)

  const sdk = new JolocomSDK({
    storage,
  })

  const publicHostport = process.env.SERVICE_HOSTPORT || 'localhost:9000'
  const publicPort = publicHostport.split(':')[1]
  const listenPort = process.env.SERVICE_LISTEN_PORT || publicPort || 9000

  const server = new hapi.Server({
    port: listenPort,
    debug: {
      log: ['*'],
      request: ['*'],
    },
  })
  await server.register(HAPIWebSocket)

  server.log(
    ['info'],
    `Jolocom SDK with default DIDMethod did:${
      sdk.didMethods.getDefault().prefix
    }`,
  )
  server.log(['info'], `Initializing Agent...`)
  const jolo = await sdk.initAgent({ passwordStore: passwordStore })

  server.log(['info'], `Agent ready with DID ${jolo.idw.did}`)

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
      peerResolutionInterxn: async (
        args,
        { createInteractionCallbackURL, wrapJWT },
      ) => {
        const callbackURL = createInteractionCallbackURL(
          async (jwt: string) => {
            const interxn = await jolo.processJWT(jwt)
            console.log(
              'peer resolution request request handled for',
              interxn.counterparty,
            )
          },
        )
        return wrapJWT(
          await jolo.resolutionRequestToken({
            callbackURL,
          }),
        )
      },

      authzInterxn: async (
        req: { description: string; action: string; imageURL: string },
        { createInteractionCallbackURL, wrapJWT },
      ) => {
        const callbackURL = createInteractionCallbackURL(
          async (jwt: string) => {
            const interxn = await jolo.processJWT(jwt)
            console.log('authz request handled for', interxn.counterparty)
          },
        )
        return wrapJWT(
          await jolo.authorizationRequestToken({
            description: req.description,
            action: req.action,
            imageURL: req.imageURL,
            callbackURL,
          }),
        )
      },

      authnInterxn: async (
        req: { description: string },
        { createInteractionCallbackURL, wrapJWT },
      ) => {
        const callbackURL = createInteractionCallbackURL(
          async (jwt: string) => {
            const interxn = await jolo.processJWT(jwt)
            console.log('auth request handled for', interxn.participants)
          },
        )
        return wrapJWT(
          await jolo.authRequestToken({
            description: req.description,
            callbackURL,
          }),
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
      remoteEncrypt: async (request: { chId: string; data: string }) => {
        const ch = await jolo.channels.get(request.chId)
        const otherDid = ch.counterparty && ch.counterparty.did
        if (!otherDid) throw new Error('no counterparty!')

        const ssiMsg = await jolo.rpcEncRequest({
          toEncrypt: Buffer.from(request.data),
          target: otherDid,
          callbackURL: '',
        })
        const resp = await ch.startThread(ssiMsg)
        return resp.payload.interactionToken.result
      },

      remoteDecrypt: async (request: { chId: string; data: string }) => {
        const ch = await jolo.channels.get(request.chId)

        const ssiMsg = await jolo.rpcDecRequest({
          toDecrypt: Buffer.from(request.data, 'base64'),
          callbackURL: '',
        })
        const resp = await ch.startThread(ssiMsg)
        return Buffer.from(
          resp.payload.interactionToken.result,
          'base64',
        ).toString()
      },

      /**
       * Credential interactions
       */
      getCredentialTypes: async () => {
        return offeredCredentials.map((o) => o.type)
      },
      offerCred: async (
        req: { types: string[]; invalid?: string[] },
        { createInteractionCallbackURL, wrapJWT },
      ) => {
        const filteredOfferedCreds = req.types.reduce((acc, t) => {
          const cred = offeredCredentials.find((o) => o.type == t)
          if (cred) return [...acc, cred]
          else return acc
        }, [] as typeof offeredCredentials)

        if (filteredOfferedCreds.length === 0)
          throw new Error('no offers matching provided "types" parameter')
        const invalidTypes = req.invalid || []

        const callbackURL = createInteractionCallbackURL(
          async (jwt: string) => {
            const interxn = await jolo.processJWT(jwt)
            console.log('offerCred called back for', interxn.id)

            const state = interxn.getSummary().state as CredentialOfferFlowState
            const credentials = await interxn.issueSelectedCredentials(
              state.selectedTypes.reduce((acc, val) => {
                return {
                  ...acc,
                  [val]: (requestedInput?: any) => {
                    const subjectObj: { subject?: string } = {}
                    if (invalidTypes.includes(val))
                      subjectObj.subject = 'INVALID'
                    else subjectObj.subject = interxn.participants.responder.did

                    const offer = {
                      ...subjectObj,
                      claim: {
                        message:
                          'Demo Credential for ' +
                          interxn.participants.responder!.did,
                      },
                      metadata: credMetadata[val],
                    }
                    console.log({ offer })
                    return offer
                  },
                }
              }, {}),
            )
            console.log(
              'credentials issued',
              credentials.map((c) => last(c.type)),
            )
            return interxn.createCredentialReceiveToken(credentials)
          },
        )

        return wrapJWT(
          await jolo.credOfferToken({
            callbackURL,
            offeredCredentials: filteredOfferedCreds,
          }),
        )
      },

      getRequestableCredentialTypes: async () => {
        return Object.keys(requestableCredentials)
      },
      credShareRequest: async (
        req: { types: string[]; invalid?: string[] },
        { createInteractionCallbackURL, wrapJWT },
      ) => {
        const credTypes = req.types.filter((t) => !!requestableCredentials[t])

        if (credTypes.length === 0)
          throw new Error(
            'no credential types matching provided "types" parameter',
          )

        const callbackURL = createInteractionCallbackURL(
          async (jwt: string) => {
            const interxn = await jolo.processJWT(jwt)
            console.log('credShareRequest called back for', interxn.id)
          },
        )

        const credentialRequirements = credTypes.map((credentialType) => {
          return generateRequirementsFromConfig({
            metadata: requestableCredentials[credentialType],
          })
        })
        return wrapJWT(
          await jolo.credRequestToken({
            callbackURL,
            credentialRequirements,
          }),
        )
      },

      genericCredentialOffer: genericCredentialOfferHandler(jolo),
    },
  })

  await server.register({
    plugin: joloPlugin,
    routes: {
      prefix: '/jolo',
    },
  })

  await server.start()
  server.log(['info'], 'Hapi server listening on port ' + listenPort)
}

init()
