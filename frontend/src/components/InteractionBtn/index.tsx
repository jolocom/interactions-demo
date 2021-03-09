import React from 'react'
import styles from './InteractionBtn.module.css'
const jolocomLogo = require('../../images/JO_icon.svg')

interface IInteractionBtnProps {
  text: string
  onClick: () => void
}

export const InteractionBtn: React.FC<IInteractionBtnProps> = ({
  text,
  onClick,
}) => {
  return (
    <button onClick={onClick} className={styles['btn-container']}>
      <img
        src={jolocomLogo}
        className={styles['btn-icon']}
        alt="Jolocom logo"
      />
      {text}
    </button>
  )
}
