import React, { useState, useEffect } from 'react'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import { SelectionComponent } from './selectionComponent'
import { InteractionType, RpcRoutes } from '../config'
import { InteractionTemplate } from '../components/InteractionTemplate'

interface Props {
  interactionType: InteractionType
}

export const PeerResolutionContainer = ({
  serviceAPI,
}: {
  serviceAPI: JolocomWebServiceClient
}) => {
  //const [description, setDescription] = useState<string>('Unlock your scooter')
  const startAuth = async () => {
    const resp: { qr: string; err: string } = await serviceAPI.sendRPC(
      RpcRoutes.peerResolutionInterxn,
    )
    console.log(resp)
    return resp
  }

  return (
    <InteractionTemplate
      startText="Start Peer Resolution Interaction"
      startHandler={startAuth}
    >
      <h2>Peer Resolution Interaction</h2>
      <div style={{ paddingTop: '20px' }}>
        {/*<h4>Description</h4>
        <input
          style={{
            margin: '10px',
            width: '100%',
          }}
          type="text"
          name="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />*/}
      </div>
    </InteractionTemplate>
  )
}

export const CredOfferContainer = ({
  serviceAPI,
  credTypes,
}: {
  serviceAPI: JolocomWebServiceClient
  credTypes: string[]
}) => {
  const [issuedCredentials, setIssued] = useState<Array<string>>([])
  const [invalidCredentials, setInvalid] = useState<Array<string>>([])
  const availableIssueCredentials = credTypes

  const handleSelect = (array: string[], item: string) => {
    return !array.includes(item)
      ? [...array, item]
      : array.filter(val => val !== item)
  }

  useEffect(() => {
    if (issuedCredentials.length === 0 && credTypes && credTypes.length > 0) {
      setIssued(credTypes.slice(0, 1))
    }
  })

  const startCredOffer = async () => {
    const resp: { qr: string; err: string } = await serviceAPI.sendRPC(
      RpcRoutes.offerCred,
      {
        types: Array.from(new Set(issuedCredentials)),
        invalid: Array.from(new Set(invalidCredentials)),
      },
    )
    console.log(resp)
    return resp
  }

  return (
    <InteractionTemplate
      startText="Start Credential Offer"
      startHandler={startCredOffer}
    >
      <h2>Credential Offer</h2>
      <SelectionComponent
        title={'Available Credentials'}
        options={availableIssueCredentials}
        onSelect={type => setIssued(handleSelect(issuedCredentials, type))}
        selectedItems={issuedCredentials}
      />
      <SelectionComponent
        title={'Break Credentials'}
        options={issuedCredentials}
        onSelect={type => setInvalid(handleSelect(invalidCredentials, type))}
        selectedItems={invalidCredentials}
      />
    </InteractionTemplate>
  )
}

export const CredShareContainer = ({
  serviceAPI,
  credTypes,
}: {
  serviceAPI: JolocomWebServiceClient
  credTypes: string[]
}) => {
  const [requestedCredentials, setRequested] = useState<Array<string>>([])
  const requestableCredTypes = credTypes

  const handleSelect = (array: string[], item: string) => {
    return !array.includes(item)
      ? [...array, item]
      : array.filter(val => val !== item)
  }

  useEffect(() => {
    if (
      requestedCredentials.length === 0 &&
      credTypes &&
      credTypes.length > 0
    ) {
      setRequested(credTypes.slice(0, 1))
    }
  })

  const startCredRequest = async () => {
    const resp: { qr: string; err: string } = await serviceAPI.sendRPC(
      RpcRoutes.credShareRequest,
      {
        types: Array.from(new Set(requestedCredentials)),
      },
    )
    console.log(resp)
    return resp
  }

  return (
    <InteractionTemplate
      startText="Start Credential Request Interaction"
      startHandler={startCredRequest}
    >
      <h2>Credential Request</h2>
      <SelectionComponent
        title={'Available Credentials'}
        options={requestableCredTypes}
        onSelect={type =>
          setRequested(handleSelect(requestedCredentials, type))
        }
        selectedItems={requestedCredentials}
      />
      <div style={{ paddingTop: '20px' }}></div>
    </InteractionTemplate>
  )
}
