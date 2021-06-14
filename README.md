# Docker Jolocom Interactions Demo
This is a demo of all interactions supported by the
[JolocomSDK](https://github.com/jolocom/jolocom-sdk). There is a React based
frontend, and a Hapi based backend integrated with the JolocomSDK. It is meant
to be used with the [Jolocom
SmartWallet](https://github.com/jolocom/smartwallet-app)

A hosted version of this demo is available at https://interxns.jolocom.io

## Development Instructions

The docker-compose.yml provided is not suitable for development purposes,
but rather for deployment. For development please run the components manually as
described below

### Service Agent (Backend)
This requires an LTS version of Node: 10 or 12 or 14

The `service_agent` needs to know its "public" facing "host:port" address to be
able to embed it in the interaction tokens, such that the SmartWallet can find
the agent.

To successfully go through the demo while running locally, change the
`SERVICE_HOSTPORT` environment variable that is used in the `yarn start` command
below, to a value that the mobile phone can access, probably the LAN IP address
of the computer that is running the `service_agent`, assuming the test
SmartWallet is on the same LAN

```sh
cd service_agent
yarn install
SERVICE_HOSTPORT="192.168.1.42:9000" yarn start
```

### React App (Frontend)
In another terminal:

```sh
cd frontend
yarn install
yarn start
```
Visit the frontend development server at http://localhost:3000
and open the Web Console to see debugging output

### Usage with the SmartWallet

The SmartWallet release builds require HTTP**S** connections, and cannot use
plain HTTP. To use this demo without SSL certificates (which is the case if
running in development) please use a **staging** build of the SmartWallet on
Android, available for download here:
https://jolocom.io/wp-content/uploads/smartwallet/smartwallet-staging-1.11.1.apk

## Production Deployment instructions
This demo is not suitable for any sort of "production" deployment, besides use
as a demo.

The repo comes with a [docker-compose.yml](./docker-compose.yml) that is
suitable for deployment accompanied by https://github.com/jolocom/docker-nginx-proxy
which automatically adds HTTPS support by issuing SSL certificates through
letsencrypt.org

The configuration for the domain is taken from environment variables in
`docker-compose.yml`
```
    LETSENCRYPT_HOST: 'interxns.jolocom.io'
    LETSENCRYPT_EMAIL: 'dev@jolocom.io'
    SERVICE_HOSTPORT: 'interxns.jolocom.io'
    VIRTUAL_HOST: 'interxns.jolocom.io'
```
