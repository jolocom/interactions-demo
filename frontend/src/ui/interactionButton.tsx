import React from 'react'
import { InteractionType } from '../config'
const jolocomLogo = require('../images/JO_icon.svg')

interface Props {
  text: string
  onClick: () => void
}

export const InteractionButton = (props: Props) => {
  const { text, onClick } = props
  return (
    <button onClick={onClick} className="c-qr-button">
      <img
        src={jolocomLogo}
        style={{ width: '100%' }}
        className="c-qr-button__image"
        alt="Jolocom logo"
      />
      {text}
    </button>
  )
}
