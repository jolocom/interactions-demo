import io from 'socket.io-client'
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

export const getQrCode = async (
  socketName: string,
): Promise<QrCodeClientResponse> => {
  const chanResp = await fetch(`${serviceUrl}/${socketName}`, { method: 'POST' })
  const chanJSON = await chanResp.json()
  console.log('this is', `${serviceWsUrl}/${socketName}`, chanJSON)
  console.log('connecting to RPC Proxy at', `${chanJSON.paths.rpcWS}`, chanJSON)

  let resolveReady: { (): void; (value?: unknown): void } | null
  const readyPromise = new Promise(resolve => {
    resolveReady = resolve
  })

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
    messages: {}
  }

  return new Promise<QrCodeClientResponse>(resolve => {
    rpcWS.onopen = (evt) => {
      //@ts-ignore
      session.promise = sendRPC(chanJSON.nonce, 'start') // TODO indicate success

      resolve({
        authTokenQR: '',
        authTokenJWT: chanJSON.jwt,
        identifier: chanJSON.nonce,
        socket: rpcWS
      })
    }
  });
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
  return sockMap[identifier].promise
    
}
