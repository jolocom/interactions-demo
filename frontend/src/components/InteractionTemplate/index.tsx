import React, { useState } from 'react'
import styles from './InteractionTemplate.module.css'
import { InteractionBtn } from '../InteractionBtn'

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
  const [jwt, setJwt] = useState<string>()
  const [err, setErr] = useState<string | undefined>()

  const startBtnHandler = async () => {
    const resp = await startHandler()
    setQr(resp.qr)
    setJwt(resp.jwt)
    setErr(resp.err)
  }

  return (
    <div className={styles['container']}>
      {children}
      <div className={styles['btn-container']}>
        <InteractionBtn onClick={startBtnHandler} text={startText} />
        {err && <b>Error</b>}
        {jwt && <p className={styles['jwt']}>{jwt}</p>}

        {!err && qr && (
          <img src={qr} className={styles['qr-code']} alt="QR Code" />
        )}
      </div>
    </div>
  )
}
