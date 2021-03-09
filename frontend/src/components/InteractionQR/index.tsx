import React from 'react'
import styles from './InteractionQR.module.css'

interface IInteractionQRProps {
  jwt?: string
}

export const InteractionQR: React.FC<IInteractionQRProps> = ({ jwt }) => {
  if (jwt === undefined) return null
  return <p className={styles['jwt']}>{jwt}</p>
}
