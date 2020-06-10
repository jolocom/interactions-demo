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

### Related Code Bases

sdk: https://github.com/jolocom/sdk/tree/feat/enc_dec_rpc

rpc_proxy: https://github.com/jolocom/hapi-jolocom-backend/tree/rpc

rpc_agent: https://github.com/mnzaki/jolocom-agentry rpc_agent2

frontend: https://github.com/mnzaki/generic-frontend/tree/rpc-demo
