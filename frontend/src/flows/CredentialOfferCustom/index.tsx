import React, { useEffect, useState } from 'react'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'

import { RpcRoutes } from 'config'
import { InteractionTemplate } from 'components/InteractionTemplate'
import { Space } from 'components/Space'
import { InteractionBtn } from 'components/InteractionBtn'
import { InteractionInput } from 'components/InteractionInput'

import { documentInputs, documentTypes } from './config'
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

export const CredentialOfferCustom = ({
  serviceAPI,
}: {
  serviceAPI: JolocomWebServiceClient
}) => {
  const [credName, setCredName] = useState('')
  const [credType, setCredType] = useState(
    CredentialTypes.ProofOfIdCredentialDemo,
  )
  const defaultInputs = documentTypes.includes(credType) ? documentInputs : []

  const [inputs, setInputs] = useState<Array<TInput>>(defaultInputs)

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
  }

  useEffect(() => {
    if (documentTypes.includes(credType)) {
      if (!inputs.find(v => v.key === 'givenName'))
        setInputs(prev => [...documentInputs, ...prev])
    } else {
      const documentNames = documentInputs.map(v => v.key)
      setInputs(prev => {
        const oldInputs = [...prev]
        const filteredInputs = oldInputs.filter(
          v => !documentNames.includes(v.key),
        )
        return filteredInputs
      })
    }
  }, [credType])

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
    setInputs(defaultInputs)
    setCredName('')
    setCredType(CredentialTypes.ProofOfIdCredentialDemo)
  }

  const handleRemoveCredentials = (id: number) => {
    setCredentialsToBeIssued(prevState => prevState.filter(c => c.id !== id))
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
    setInputs(prevState => [...prevState, NEW_CLAIM])
  }

  const handleEditCredential = (id: number) => {
    const editCredentials = credentialsToBeIssued.find(c => c.id === id)
    console.log({ editCredentials })
  }

  console.log({ credentialsToBeIssued })

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
            <select onChange={handleTypeChange}>
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
                  onRemove={handleRemoveCredentials}
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
