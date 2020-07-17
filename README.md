# Docker Jolocom RPC Demo

## Usage Instructions

Clone the repository locally then in one terminal:
```sh
docker-compose up
```

Wait for the servers to spin up (see terminal output)

Then visit the frontend development server at http://localhost:3000 
and open the Web Console to see debugging output

Click 'Start RPC Demo' to create a new RPC session. The frontend will provide a
`docker-compose` command to run the `rpc_agent`. It will look something like

```sh
docker-compose run rpc_agent start eyiusdbfisudfbksdjbs...sdfjkhsdjkfshk
```

### Usage with the SmartWallet

The `service_agent` needs to know its "public" facing "host:port" address to be
able to embed it in the interaction tokens, such the the SmartWallet can find
the agent.

To successfully go through the demo, change the `PUBLIC_HOSTPORT` environment
variable inside `docker-compose.yml` to a value that the mobile phone can
access, probably the LAN IP address of the computer running the `service_agent`,
assuming the test SmartWallet is on the same LAN

Also note that the SmartWallet release build require HTTP**S** connections, and cannot use
plain HTTP. To use this demo without SSL certificates please use a **staging**
build of the SmartWallet on Android.
