import React, { useState } from 'react'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import styles from './CredentialOfferCustom.module.css'
import { RpcRoutes } from '../../config'
import { InteractionTemplate } from '../../components/InteractionTemplate'
import { generateString, lowercaseFirst } from './utils'
import { documentInputs, documentTypes, renderAsForType } from './config'
import { CredentialTypes } from './types'
import { Space } from '../../components/Space'
import { InteractionInput } from '../../components/InteractionInput'
import { ClaimInput } from './ClaimInput'
import { InteractionBtn } from '../../components/InteractionBtn'

interface ICardProps {
  name: string
  properties: Array<Record<string, any>>
}
const Card: React.FC<ICardProps> = ({ name, properties }) => {
  return (
    <div className={styles['card-container']}>
      <h3>{name}</h3>
      {properties.length ? <b>Properties:</b> : null}
      {properties.map(p => (
        <p key={p.label}>{p.label}</p>
      ))}
    </div>
  )
}

const TextInput: React.FC<{
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  value: string
  name: string
  placeholder?: string
}> = ({ onChange, value, name, placeholder }) => (
  <input
    style={{
      marginTop: '10px',
      width: '100%',
    }}
    type="text"
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
  />
)

export const CredentialOfferCustom = ({
  serviceAPI,
}: {
  serviceAPI: JolocomWebServiceClient
}) => {
  const [credName, setCredName] = useState('')
  const [credType, setCredType] = useState(
    CredentialTypes.ProofOfIdCredentialDemo,
  )
  const [newField, setNewField] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')

  const defaultInputs = documentTypes.includes(credType) ? documentInputs : []

  const [inputs, setInputs] = useState<
    Array<{
      name: string
      fieldName: string
      label: string
      value: string
    }>
  >(defaultInputs)

  const [credentialsToBeIssued, setCredentialsToBeIssued] = useState<
    Array<Record<string, any>>
  >([])

  const handleCreateNewField = () => {
    if (newField.length) {
      const newFieldName = lowercaseFirst(newField.replace(' ', ''))
      setInputs(prev => {
        return [
          ...prev,
          {
            name: generateString(),
            value: '',
            label: newFieldLabel,
            fieldName: newFieldName,
          },
        ]
      })
      setNewField('')
      setNewFieldLabel('')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist()
    setInputs(prev => {
      const inputArray = [...prev]
      const inputIndex = inputArray.findIndex(v => v.name === e.target.name)
      const foundInput = inputArray[inputIndex]
      foundInput.value = e.target.value
      inputArray[inputIndex] = foundInput

      return inputArray
    })
  }

  const handleRemove = (name: string) => {
    setInputs(prev => {
      const oldInputs = [...prev]
      const filteredInputs = oldInputs.filter(v => v.name !== name)
      return filteredInputs
    })
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as CredentialTypes
    if (documentTypes.includes(selected)) {
      if (!inputs.find(v => v.name === 'givenName'))
        setInputs(prev => [...documentInputs, ...prev])
    } else {
      const documentNames = documentInputs.map(v => v.name)
      setInputs(prev => {
        const oldInputs = [...prev]
        const filteredInputs = oldInputs.filter(
          v => !documentNames.includes(v.name),
        )
        return filteredInputs
      })
    }
    setCredType(selected)
  }

  const handleAddIssuedCredential = () => {
    const claims: Record<string, string> = {}
    const display = {
      properties: inputs.map(inp => {
        claims[inp.fieldName] = inp.value
        return {
          path: [`$.${inp.fieldName}`],
          label: inp.label,
        }
      }),
    }
    const offerRequestDetails = {
      renderAs: renderAsForType[credType],
      name: credName,
      type: credType,
      claims,
      display,
    }
    setCredentialsToBeIssued(prevState => [...prevState, offerRequestDetails])
    // setInputs(defaultInputs)
  }

  const handleSubmit = async () => {
    const resp: { qr: string; err: string } = await serviceAPI.sendRPC(
      RpcRoutes.genericCredentialOffer,
      credentialsToBeIssued,
    )

    return resp
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
          <InteractionInput
            label="Credential name"
            value={credName}
            setValue={setCredName}
          />
          <h3>Claims</h3>
          {inputs.map(({ fieldName, label, ...rest }) => (
            <div
              style={{
                paddingTop: '20px',
                paddingLeft: '50px',
                paddingRight: '50px',
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
                <h4>{fieldName}</h4>
                {documentInputs.map(v => v.name).includes(rest.name) && (
                  <button
                    onClick={() => handleRemove(rest.name)}
                    className={styles['close-btn']}
                  >
                    x
                  </button>
                )}
              </div>
              <TextInput
                {...rest}
                placeholder="label"
                value={label}
                onChange={handleInputChange}
              />
              <TextInput {...rest} onChange={handleInputChange} />
            </div>
          ))}
          <Space />
          <div className={styles['field-section']}>
            <ClaimInput
              label="New claim"
              claimKey={newField}
              claimLabel={newFieldLabel}
              keyPlaceholder="e.g. birthDate"
              labelPlaceholder="e.g. Date of Birth"
              setClaimKey={setNewField}
              setClaimLabel={setNewFieldLabel}
            />
            <button
              className={styles['plus-btn']}
              disabled={!newField.length}
              onClick={handleCreateNewField}
            >
              +
            </button>
          </div>
          <InteractionBtn
            text="Add to issue"
            onClick={handleAddIssuedCredential}
          />
        </div>
        <div className={styles['credentials-container']}>
          <h3>Credentials that are going to be issued:</h3>
          <Space />
          {credentialsToBeIssued.map(c => (
            <>
              <Card name={c.type} properties={c.display.properties} />
              <Space />
            </>
          ))}
        </div>
      </div>
    </InteractionTemplate>
  )
}
