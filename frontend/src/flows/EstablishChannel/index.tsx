import React, { useState } from 'react'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'

import { RpcRoutes } from 'config'
import { InteractionBtn } from 'components/InteractionBtn'
import { InteractionQR } from 'components/InteractionQR'
import { InteractionInput } from 'components/InteractionInput'

import styles from './EstablishChannel.module.css'

export const EstablishChannel = ({
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
    <div className={styles['container']}>
      <h2>RPC Encrypt/Decrypt Demo</h2>
      <div className={styles['body-container']}>
        {encryptReady ? (
          <>
            <InteractionInput
              label="Input Data"
              value={encryptInput}
              setValue={setEncryptInput}
              name="description"
              type="text"
            />
            <InteractionBtn
              onClick={onClickEncrypt}
              text={'Request Encryption'}
            />
            <InteractionBtn
              onClick={onClickDecrypt}
              text={'Request Decryption'}
            />
          </>
        ) : (
          <InteractionBtn onClick={onClickStart} text={'Start RPC Demo'} />
        )}

        {err && <b>Error</b>}

        <InteractionQR jwt={jwt ? `${jwtCommand} ${jwt}` : undefined} />

        {!err && qr && <img src={qr} />}

        {!!encryptOutput.length && (
          <>
            <h4>Output Data</h4>
            <div className={styles['output-container']}>
              <i>{encryptOutput}</i>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
