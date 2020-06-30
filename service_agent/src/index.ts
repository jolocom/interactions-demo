import * as hapi from '@hapi/hapi'
import * as HAPIWebSocket from 'hapi-plugin-websocket'
import { JolocomRPCProxyPlugin } from 'hapi-jolocom/dist/rpc'
import { JolocomAuthPlugin } from 'hapi-jolocom/dist/auth'

import { JolocomSDK } from "@jolocom/sdk"
import { FilePasswordStore } from "@jolocom/sdk-password-store-filesystem"
import { JolocomTypeormStorage } from "@jolocom/sdk-storage-typeorm"

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

export const init = async () => {
  const passwordStore = new FilePasswordStore(__dirname+'/../password.txt')
  const connection = await typeorm.createConnection(typeormConfig)
  const storage = new JolocomTypeormStorage(connection)

  const sdk = new JolocomSDK({
    storage,
    passwordStore
  })

  const port = process.env.PUBLIC_PORT || 9000;
  await sdk.init()

  const server = new hapi.Server({
    port,
    debug: {
      request: ["*"]
    },
    // listener: nodeListener
  });

  // server.bind(sdk)

  await server.register(HAPIWebSocket)

  const rpcMap = {
    asymEncrypt: async (request, { ch }) => {
      const ssiMsg = await sdk.rpcEncRequest({
        toEncrypt: Buffer.from(request),
        target: `${ch.did}#keys-1`,
        callbackURL: ''
      })
      const resp = await ch.sendSSIMessage(ssiMsg)
      return resp.payload.interactionToken.result
    },
    asymDecrypt: async (request, { ch }) => {
      const ssiMsg = await sdk.rpcDecRequest({
        toDecrypt: Buffer.from(request, 'base64'),
        callbackURL: ''
      })
      const resp = await ch.sendSSIMessage(ssiMsg)
      return resp.payload.interactionToken.result
    },
  }

  await server.register({
    plugin: new JolocomRPCProxyPlugin(sdk, rpcMap),
    routes: {
      prefix: '/rpcProxy',
    }
  });

  await server.register({
    plugin: new JolocomAuthPlugin(sdk),
    routes: {
      prefix: '/auth'
    }
  })

  await server.start();
  console.log("running")
};

init();
