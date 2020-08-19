import React, { useState, useEffect } from 'react'
import './reset.css'
import './App.css'
import { InteractionContainer, CredOfferContainer, AuthContainer } from './ui/interaction'
import { EstablishChannelContainer } from './ui/establishChannel'
import { InteractionType } from './config'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
const jolocomLogo = require('./images/JO_icon.svg')

interface State {
  loading: boolean
  qrCode: {
    source: string
  }
}

interface AppProps {
  jwtCommand: string
  serviceAPI: JolocomWebServiceClient
}

const App: React.FunctionComponent<AppProps> = ({ serviceAPI, jwtCommand }) => {
  const [availableCredTypes, setAvailableCredTypes] = useState<string[]>([])
  useEffect(() => {
    serviceAPI.sendRPC('getCredentialTypes').then((credTypes: string[]) => {
      setAvailableCredTypes(credTypes)
    })
  }, [serviceAPI])

  return (
    <React.Fragment>
      <header className="c-header" style={{textAlign: 'center'}}>
        <h1><img src={jolocomLogo} alt="Jolocom Logo" />&nbsp;Jolocom</h1>
        <h1>Interactions Demo</h1>
      </header>
      <main className="main">
        <article className="c-qrcode-container">
          <EstablishChannelContainer serviceAPI={serviceAPI} jwtCommand={jwtCommand} />
          <CredOfferContainer
            serviceAPI={serviceAPI}
            credTypes={availableCredTypes} />
          <AuthContainer
            serviceAPI={serviceAPI}
          />
          {/*
          <InteractionContainer interactionType={InteractionType.Receive} />
          <InteractionContainer interactionType={InteractionType.Share} />
          <InteractionContainer interactionType={InteractionType.Auth} />
          */}
        </article>
      </main>
    </React.Fragment>
  )
}

export default App
