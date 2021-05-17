import React, { useEffect, useState } from 'react'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'

import { RpcRoutes } from 'config'
import { InteractionTemplate } from 'components/InteractionTemplate'
import { Space } from 'components/Space'
import { InteractionBtn } from 'components/InteractionBtn'
import { InteractionInput } from 'components/InteractionInput'

import { documentInputs, documentTypes, otherInputs } from './config'
import { ClaimKeys, CredentialTypes, TInput, ICredential } from './types'
import { Card } from './Card'
import styles from './CredentialOfferCustom.module.css'
import { ClaimDetails } from './ClaimDetails'
import { getPreparedCredentials } from './utils'

const NEW_CLAIM: TInput = {
  key: '',
  label: '',
  value: '',
}

const DEFAULT_NAME = 'Jolocom credential'

export const CredentialOfferCustom = ({
  serviceAPI,
}: {
  serviceAPI: JolocomWebServiceClient
}) => {
  const [credName, setCredName] = useState(DEFAULT_NAME)
  const [credType, setCredType] = useState(
    CredentialTypes.ProofOfIdCredentialDemo,
  )
  const [inputs, setInputs] = useState<Array<TInput>>([])

  const handleSetInitialInputs = (type: CredentialTypes) => {
    setInputs(s => {
      if (documentTypes.includes(type))
        return JSON.parse(JSON.stringify(documentInputs))
      else return JSON.parse(JSON.stringify(otherInputs))
    })
  }

  useEffect(() => {
    handleSetInitialInputs(credType)
  }, [])

  const [credentialsToBeIssued, setCredentialsToBeIssued] = useState<
    Array<ICredential>
  >([])

  const handleRemove = (name: string) => {
    setInputs(prev => {
      const oldInputs = [...prev]
      const filteredInputs = oldInputs.filter(v => v.key !== name)
      return filteredInputs
    })
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as CredentialTypes
    setCredType(selected)
    handleSetInitialInputs(selected)
  }

  const handleAddIssuedCredential = () => {
    const credential = {
      id: Date.now(),
      name: credName,
      type: credType,
      inputs,
    }
    setCredentialsToBeIssued(prevState => [...prevState, credential])
    handleResetOnboarding()
  }

  const handleSubmit = async () => {
    const credentials = credentialsToBeIssued.map(getPreparedCredentials)
    const resp: { qr: string; err: string } = await serviceAPI.sendRPC(
      RpcRoutes.genericCredentialOffer,
      credentials,
    )
    return resp
  }

  const handleResetOnboarding = () => {
    setCredType(CredentialTypes.ProofOfIdCredentialDemo)
    setCredName(DEFAULT_NAME)
    handleSetInitialInputs(CredentialTypes.ProofOfIdCredentialDemo)
  }

  const handleInputEdit = (key: string, claimKey: ClaimKeys, value: string) => {
    setInputs(prevState => {
      return prevState.map(i => {
        if (i.key === key) {
          i[claimKey] = value
        }
        return i
      })
    })
  }

  const handleAddNewClaim = () => {
    setInputs(prevState => [...prevState, { ...NEW_CLAIM }])
  }
  const handleEditCredential = (id: number) => {
    const editCredential = credentialsToBeIssued.find(c => c.id === id)
    if (editCredential !== undefined) {
      const { id, type, name, inputs } = editCredential
      setCredType(type)
      setCredName(name)
      setInputs(inputs)
      handleRemoveCredential(id)
    }
  }
  const handleRemoveCredential = (id: number) => {
    setCredentialsToBeIssued(prevState => prevState.filter(c => c.id !== id))
  }

  return (
    <InteractionTemplate
      startText="Send Credential"
      startHandler={handleSubmit}
    >
      <h2>Custom Credentials</h2>
      <h4>
        <i>(For UI testing)</i>
      </h4>
      <Space />
      <div className={styles['body-container']}>
        <div className={styles['onboarding-container']}>
          <div>
            <h3>Credential type</h3>
            <Space />
            <select value={credType} onChange={handleTypeChange}>
              {Object.values(CredentialTypes).map(type => (
                <option value={type}>{type}</option>
              ))}
            </select>
            <Space />
          </div>
          <Space />
          <h3>Credential friendly name</h3>
          <Space />
          <InteractionInput
            withoutLabel
            value={credName}
            setValue={setCredName}
            placeholder="e.g. Demonstration Credential"
          />
          <Space />
          <Space />
          <h3>Claims</h3>
          {inputs.map(input => (
            <div
              style={{
                paddingTop: '20px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <h4>{input.label}</h4>
                <button
                  onClick={() => handleRemove(input.key)}
                  className={styles['close-btn']}
                >
                  x
                </button>
              </div>
              <ClaimDetails input={input} onEdit={handleInputEdit} />
            </div>
          ))}
          <Space />
          <button className={styles['plus-btn']} onClick={handleAddNewClaim}>
            +
          </button>
          <InteractionBtn
            text="Add for issuance"
            onClick={handleAddIssuedCredential}
          />
        </div>
        <div className={styles['credentials-container']}>
          <h3>Credentials that are going to be issued:</h3>
          <Space />
          {credentialsToBeIssued.length === 0 ? (
            <h5 className={styles['empty-placeholder']}>
              Add credentials to see it here
            </h5>
          ) : (
            credentialsToBeIssued.map(getPreparedCredentials).map(c => (
              <div key={c.type}>
                <Card
                  id={c.id}
                  type={c.type}
                  properties={c.display.properties}
                  onRemove={handleRemoveCredential}
                  onEdit={handleEditCredential}
                  name={c.name}
                />
                <Space />
              </div>
            ))
          )}
        </div>
      </div>
    </InteractionTemplate>
  )
}
