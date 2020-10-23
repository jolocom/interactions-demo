import React, { useState } from 'react'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import { InteractionButton } from './interactionButton'
import { RpcRoutes } from '../config'

export const EstablishChannelContainer = ({
  serviceAPI,
  jwtCommand,
}: {
  serviceAPI: JolocomWebServiceClient
  jwtCommand: string
}) => {
  const [identifier, setIdentifier] = useState<string>('')
  const [qr, setQr] = useState<string>('')
  const [jwt, setJwt] = useState<string>('')
  const [err, setErr] = useState<boolean>(false)

  const [encryptInput, setEncryptInput] = useState('')
  //const [decryptInput, setDecryptInput] = useState('')
  const [encryptOutput, setEncryptOutput] = useState<string>('')
  //const [decryptOutput, setdecryptOutput] = useState<string>('')
  const [encryptReady, setEncryptReady] = useState(false)

  const onClickStart = async () => {
    let chId
    window.location.search.split('&').forEach(p => {
      try {
        const [k, v] = p.split('=')
        if (k == 'id') chId = v
      } catch {}
    })
    if (!chId) {
      const chReq: any = await serviceAPI.sendRPC(RpcRoutes.createDemoChannel)
      console.log(chReq)
      chId = chReq.id
      setQr(chReq.qr)
      setJwt(chReq.jwt)
      setIdentifier(chId)
    }

    await serviceAPI.sendRPC(RpcRoutes.waitForChannelAuth, {
      chId,
    })
    setQr('')
    setJwt('')
    setEncryptReady(true)
    window.history.pushState(null, '', `${window.location.pathname}?id=${chId}`)
  }

  const onClickEncrypt = async () => {
    const res = await serviceAPI.sendRPC(RpcRoutes.remoteEncrypt, {
      chId: identifier,
      data: encryptInput,
    })
    setEncryptOutput(res)
  }
  const onClickDecrypt = async () => {
    const res = await serviceAPI.sendRPC(RpcRoutes.remoteDecrypt, {
      chId: identifier,
      data: encryptInput,
    })
    setEncryptOutput(res)
  }

  return (
    <div
      style={{
        background: '#ffefdf',
        marginTop: '70px',
        marginBottom: '70px',
        marginLeft: '10px',
        marginRight: '10px',
        padding: '30px',
        boxShadow: '0px 0px 80px 2px gray',
        borderRadius: '40px',
      }}
    >
      <h2>RPC Encrypt/Decrypt Demo</h2>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {encryptReady ? (
          <>
            <div style={{ paddingTop: '20px', width: '100%' }}>
              <h4>Input Data</h4>
              <input
                style={{
                  margin: '10px',
                  width: '100%',
                  maxWidth: '500px',
                }}
                type="text"
                name="description"
                value={encryptInput}
                onChange={e => setEncryptInput(e.target.value)}
              />
            </div>
            <InteractionButton
              onClick={onClickEncrypt}
              text={'Request Encryption'}
            />
            <InteractionButton
              onClick={onClickDecrypt}
              text={'Request Decryption'}
            />
          </>
        ) : (
          <InteractionButton onClick={onClickStart} text={'Start RPC Demo'} />
        )}

        {err ? (
          <b>Error</b>
        ) : (
          jwt && (
            <div>
              <div
                style={{
                  wordWrap: 'break-word',
                  maxWidth: '50vw',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                }}
              >
                {jwtCommand} {jwt}
              </div>
            </div>
          )
        )}

        {!err && qr && <img src={qr} />}

        {!!encryptOutput.length && (
          <>
            <h4>Output Data</h4>
            <div
              style={{
                border: '1px solid black',
                padding: '20px',
                backgroundColor: 'white',
                width: '500px',
                textAlign: 'center',
                overflowWrap: 'break-word',
                borderRadius: '10px',
              }}
            >
              <i>{encryptOutput}</i>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
