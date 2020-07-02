const typeorm = require('typeorm')
const { JolocomTypeormStorage } = require('@jolocom/sdk-storage-typeorm')
import { JolocomSDK, JSONWebToken } from '@jolocom/sdk'
import { FilePasswordStore } from '@jolocom/sdk-password-store-filesystem'

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

  const initialJWT = process.argv[2]
  const interaction = await sdk.processJWT(initialJWT)
  await interaction.respond()
}

start()
