import React, { useState, useEffect } from 'react'
import './reset.css'
import './App.css'
import { CredOfferContainer, PeerResolutionContainer } from './ui/interaction'
import { EstablishChannelContainer } from './ui/establishChannel'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import { RpcRoutes } from './config'
import { GenericCredentialOfferContainer } from './ui/genericCredentialOfferContainer'
import { Authentication } from './flows/Authentication'
import { Authorization } from './flows/Authorization'
import { CredentialRequest } from './flows/CredentialRequest'
const jolocomLogo = require('./images/JO_icon.svg')

interface AppProps {
  jwtCommand: string
  serviceAPI: JolocomWebServiceClient
}

const App: React.FunctionComponent<AppProps> = ({ serviceAPI, jwtCommand }) => {
  const [availableCredTypes, setAvailableCredTypes] = useState<string[]>([])
  const [requestableCredTypes, setRequestableCredTypes] = useState<string[]>([])
  useEffect(() => {
    serviceAPI
      .sendRPC(RpcRoutes.getCredentialTypes)
      .then((credTypes: string[]) => {
        setAvailableCredTypes(credTypes)
      })
    serviceAPI
      .sendRPC(RpcRoutes.getRequestableCredentialTypes)
      .then((credTypes: string[]) => {
        setRequestableCredTypes(credTypes)
      })
  }, [serviceAPI])

  return (
    <React.Fragment>
      <header className="c-header" style={{ textAlign: 'center' }}>
        <h1>
          <img src={jolocomLogo} alt="Jolocom Logo" />
          &nbsp;Jolocom
        </h1>
        <h1>Interactions Demo</h1>
      </header>
      <main className="main">
        <article className="c-qrcode-container">
          <EstablishChannelContainer
            serviceAPI={serviceAPI}
            jwtCommand={jwtCommand}
          />

          <CredOfferContainer
            serviceAPI={serviceAPI}
            credTypes={availableCredTypes}
          />
          <Authentication serviceAPI={serviceAPI} />
          <Authorization serviceAPI={serviceAPI} />
          <CredentialRequest
            serviceAPI={serviceAPI}
            credTypes={requestableCredTypes}
          />
          <GenericCredentialOfferContainer serviceAPI={serviceAPI} />
        </article>
      </main>
    </React.Fragment>
  )
}

export default App
