import { serviceUrl, serviceHostport } from '../config'

const serviceWsUrl = `ws://${serviceHostport}`

interface QrCodeServerResponse {
  authTokenQR: string
  authTokenJWT: string
  identifier: string
}

export interface QrCodeClientResponse extends QrCodeServerResponse {
  socket: WebSocket
}

interface Status {
  socket: WebSocket
  identifier: string
}

const sockMap: {[id: string]: any} = {}
/*  : {[identifier: string]: {
  socket: WebSocket,
  identifier: string,
  msgN: number,
  ws: string
} = {}
*/

let rpcWS: WebSocket

// TODO most of this code needs to move into an npm package @jolocom/sdk-web-connector
export const getQrCode = async (
  socketName: string,
  identifier?: string | null
): Promise<QrCodeClientResponse> => {
  let chanResp, chanJSON: any
  if (identifier) {
    try {
      chanResp = await fetch(`${serviceUrl}/${socketName}/${identifier}`)
      chanJSON = await chanResp.json()
      if (chanResp.status !== 200) {
        chanResp = null
        throw new Error(chanJSON.message)
      }
    } catch (err) {
      console.error('failed to load channel ' + identifier, err)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  if (!chanResp) {
    chanResp = await fetch(`${serviceUrl}/${socketName}`, { method: 'POST' })
    chanJSON = await chanResp.json()
  }

  console.log('this is', `${serviceWsUrl}/${socketName}`, chanJSON)
  console.log('connecting to RPC Proxy at', `${chanJSON.paths.rpcWS}`, chanJSON)

  rpcWS = new WebSocket(`${serviceWsUrl}${chanJSON.paths.rpcWS}`)
  rpcWS.onmessage = (evt) => {
    const msg = JSON.parse(evt.data)
    console.log('received from SSI Agent over rpcWS', msg)

    // @ts-ignore
    session.messages[msg.id].resolve(msg.response)
    // FIXME TODO
  }
  
  const session = sockMap[chanJSON.nonce] = {
    socket: rpcWS,
    msgN: 0,
    messages: {},
    promise: new Promise<QrCodeClientResponse>(resolve => {
      rpcWS.onopen = (evt) => {
        resolve({
          authTokenQR: '',
          authTokenJWT: chanJSON.jwt,
          identifier: chanJSON.nonce,
          socket: rpcWS
        })
      }
    })
  }

  return session.promise
}

export const sendRPC = (identifier: string, rpc: string, request: any = ''): Promise<string> => {
  return new Promise(resolve => {
    const session = sockMap[identifier.toString()]
    const ws = session.socket
    const msgID = session.msgN++
    const msg = session.messages[msgID] = {
      id: msgID,
      resolve: resolve,
      rpc,
      request
    }
    console.log('sending RPC call', msg)
    ws.send(JSON.stringify({
      id: msg.id,
      rpc,
      request
    }))
  })
}

export const getEncryptedData = (identifier: string, data: string): Promise<string> => {
  return sendRPC(identifier, 'asymEncrypt', data)
}
export const getDecryptedData = (identifier: string, data: string): Promise<string> => {
  return sendRPC(identifier, 'asymDecrypt', data)
}

export const awaitStatus = (identifier: string) => {
  return sockMap[identifier].promise.then(() => {
    return sendRPC(identifier, 'start') // TODO indicate success
  })
}
