import { JSONWebToken } from 'jolocom-lib/js/interactionTokens/JSONWebToken'
import { Channel } from '@jolocom/sdk/js/channels'

//FIXME: the types are from @jolocom/web-service-base. Should be exported
interface JWTDesc {
  id: string
  jwt: string
  qr: string
}

interface RPCHandlerCtx {
  createChannel: ({
    description: string,
  }: {
    description: any
  }) => Promise<Channel>
  createInteractionCallbackURL: (
    cb: (payload: string) => Promise<JSONWebToken<any> | void>,
  ) => string
  wrapJWT: (jwt: string | JSONWebToken<any>) => Promise<JWTDesc>
}

export type RPCRequest = (request: any, ctx: RPCHandlerCtx) => Promise<any>
