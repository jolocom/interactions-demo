import React, { useState } from 'react'
import QRCode from 'qrcode'

import styles from './InteractionTemplate.module.css'
import { InteractionBtn } from '../InteractionBtn'
import { InteractionQR } from '../InteractionQR'

interface IInteractionTemplateProps {
  startHandler: () => Promise<{ qr?: string; jwt?: string; err?: string }>
  startText: string
  children: React.ReactNode
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

  const startBtnHandler = async () => {
    const resp = await startHandler()
    setQr(resp.qr)
    setJwt(resp.jwt)
    setErr(resp.err)
  }

  const toggleDeepLink = async () => {
    if (deeplinkQR) {
      setDeeplinkQR(undefined)
    } else {
      const deeplinkQR = await QRCode.toDataURL(
        `https://jolocom.app.link/interact?token=${jwt}`,
      )
      setDeeplinkQR(deeplinkQR)
    }
  }

  return (
    <div className={styles['container']}>
      {children}
      <div className={styles['btn-container']}>
        <InteractionBtn onClick={startBtnHandler} text={startText} />
        {err && <b>Error</b>}
        <InteractionQR jwt={jwt} />
        {!err && qr && (
          <>
            <img src={qr} className={styles['qr-code']} alt="QR Code" />
          </>
        )}
        {jwt && (
          <>
            <InteractionBtn
              onClick={toggleDeepLink}
              text={deeplinkQR ? 'Hide deep link qr' : 'Generate deep link'}
            />
            {deeplinkQR && (
              <img
                src={deeplinkQR}
                className={styles['qr-code']}
                alt="QR Code DeedLink"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
