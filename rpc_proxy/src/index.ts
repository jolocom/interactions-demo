import * as hapi from '@hapi/hapi'
import * as HAPIWebSocket from 'hapi-plugin-websocket'
import { JolocomSDK } from "@jolocom/sdk"
import { FilePasswordStore } from "@jolocom/sdk-password-store-filesystem"
import { JolocomTypeormStorage } from "@jolocom/sdk-storage-typeorm"
import { rpcProxyPlugin } from './rpc'
import { createServer } from 'http'
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

  // const nodeListener = createServer()

  const server = new hapi.Server({
    port,
    debug: {
      request: ["*"]
    },
    // listener: nodeListener
  });

  // server.bind(sdk)

  await server.register(HAPIWebSocket)

  await server.register({
    plugin: rpcProxyPlugin,
    options: {
      sdk
    },
    routes: {
      prefix: '/rpcProxy',
    }
  });

  await server.start();
  console.log("running")
};

init();
