import React, { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'

import styles from './InteractionTemplate.module.css'
import { InteractionBtn } from '../InteractionBtn'
import { InteractionQR } from '../InteractionQR'
import { InteractionInput } from 'components/InteractionInput'

interface IInteractionTemplateProps {
  startHandler: () => Promise<{ qr?: string; jwt?: string; err?: string }>
  startText: string
  children: React.ReactNode
}
async function getDeepLinkQr(jwt: string, redirecturl?: string) {
  const deeplink = `https://jolocom.app.link/interact?token=${jwt}${
    !!redirecturl ? `&redirectUrl=${encodeURIComponent(redirecturl)}` : ''
  }`
  return await QRCode.toDataURL(deeplink)
}
export const InteractionTemplate: React.FC<IInteractionTemplateProps> = ({
  startHandler,
  startText,
  children,
}) => {
  const [qr, setQr] = useState<string | undefined>()
  const [deeplinkQR, setDeeplinkQR] = useState<string | undefined>()
  const [jwt, setJwt] = useState<string>()
  const [err, setErr] = useState<string | undefined>()
  const [redirecturl, setRedirecturl] = useState<string>('')

  const startBtnHandler = async () => {
    const resp = await startHandler()
    setQr(resp.qr)
    setJwt(resp.jwt)
    setErr(resp.err)
  }
  useEffect(() => {
    if (jwt) {
      getDeepLinkQr(jwt, redirecturl).then(setDeeplinkQR)
    }
  }, [jwt, redirecturl])

  return (
    <div className={styles['container']}>
      {children}
      <div className={styles['btn-container']}>
        <InteractionBtn onClick={startBtnHandler} text={startText} />
        {err && <b>Error</b>}
        <InteractionQR jwt={jwt} />
        {jwt ? (
          <div className={styles['qrs-container']}>
            <div className={styles['qr-container']}>
              <p className={styles['qr-header']}>Contains token</p>
              {!err && qr && (
                <>
                  <img src={qr} className={styles['qr-code']} alt="QR Code" />
                </>
              )}
            </div>
            <div className={styles['qr-container']}>
              <p className={styles['qr-header']}>
                Contains deeplink with token
              </p>
              <p>Redirect url</p>
              <div className={styles['redirect-form']}>
                <InteractionInput
                  withoutLabel
                  label="Redirect url"
                  value={redirecturl}
                  setValue={setRedirecturl}
                />
              </div>
              <img
                src={deeplinkQR}
                className={styles['qr-code']}
                alt="QR Code DeedLink"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
