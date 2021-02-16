import React, { useState, useEffect } from 'react'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import { InteractionContainer } from './interaction'
import { RpcRoutes } from '../config'

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

const generateString = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

const lowercaseFirst = (val: string) =>
  val.charAt(0).toLowerCase() + val.slice(1)

enum CredentialTypes {
  ProofOfIdCredentialDemo = 'ProofOfIdCredentialDemo',
  ProofOfDriverLicenceDemo = 'ProofOfDriverLicenceDemo',
  ProofOfTicketDemo = 'ProofOfTicketDemo',
}

const documentTypes = [
  CredentialTypes.ProofOfDriverLicenceDemo,
  CredentialTypes.ProofOfIdCredentialDemo,
]

const renderAsForType = {
  [CredentialTypes.ProofOfDriverLicenceDemo]: 'document',
  [CredentialTypes.ProofOfIdCredentialDemo]: 'document',
  [CredentialTypes.ProofOfTicketDemo]: 'ticket',
}

const documentInputs = [
  {
    name: 'givenName',
    label: 'Given Name',
    value: '',
    fieldName: 'givenName',
    placeholder: '(mandatory)',
  },
  {
    name: 'familyName',
    label: 'Family Name',
    value: '',
    fieldName: 'familyName',
    placeholder: '(mandatory)',
  },
  {
    name: 'photo',
    label: 'Photograph',
    value:
      'https://i.pinimg.com/564x/64/4d/dc/644ddca56c43e4b01af5aec27e010feb.jpg',
    fieldName: 'photo',
    placeholder: '(mandatory)',
  },
]

export const GenericCredentialOfferContainer = ({
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

  const [inputs, setInputs] = useState<
    Array<{
      name: string
      fieldName: string
      label: string
      value: string
    }>
  >(documentTypes.includes(credType) ? [...documentInputs] : [])

  const handleCreateNewField = () => {
    if (newField.length) {
      const newFieldName = lowercaseFirst(newField.replace(' ',''))
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

  const handleSubmit = async () => {
    const claims: Record<string, string> = {}
    const display = {
      properties: inputs.map(inp => {
        claims[inp.fieldName] = inp.value
        return {
          path: [`$.${inp.fieldName}`],
          label: inp.label
        }
      })
    }

    const resp: { qr: string; err: string } = await serviceAPI.sendRPC(
      RpcRoutes.genericCredentialOffer,
      {
        renderAs: renderAsForType[credType],
        name: credName,
        type: credType,
        claims,
        display
      },
    )

    return resp
  }

  return (
    <InteractionContainer
      startText="Send Credential"
      startHandler={handleSubmit}
    >
      <h2>Custom Credentials</h2>
      <h4 style={{ marginBottom: '20px' }}>
        <i>(For UI testing)</i>
      </h4>
      <div>
        <h3>Credential type</h3>
        <select
          style={{ width: '100%', marginTop: '20px', marginBottom: '20px' }}
          onChange={handleTypeChange}
        >
          {Object.values(CredentialTypes).map(type => (
            <option value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <h3>Credential name</h3>
        <TextInput
          name="credentialName"
          value={credName}
          placeholder="(mandatory)"
          onChange={e => setCredName(e.target.value)}
        />
      </div>
      <div style={{ paddingBottom: '30px' }}>
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
              {!documentInputs.map(v => v.name).includes(rest.name) && (
                <button
                  onClick={() => handleRemove(rest.name)}
                  style={{
                    height: 20,
                    width: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  x
                </button>
              )}
            </div>
            <TextInput {...rest} placeholder="label" value={label} onChange={handleInputChange} />
            <TextInput {...rest} onChange={handleInputChange} />
          </div>
        ))}
      </div>
      <div
        style={{
          paddingLeft: '50px',
          paddingRight: '50px',
        }}
      >
        <h4 style={{ color: 'gray' }}>New claim</h4>
        <TextInput
          name="newField"
          value={newField}
          onChange={e => setNewField(e.target.value)}
          placeholder="e.g. birthDate"
        />
        <TextInput
          name="newFieldLabel"
          value={newFieldLabel}
          onChange={e => setNewFieldLabel(e.target.value)}
          placeholder="e.g. Date of Birth"
        />
        <button
          style={{
            width: '100%',
            marginTop: '10px',
            height: '30px',
            backgroundColor: '#fff1e3',
          }}
          onClick={handleCreateNewField}
        >
          +
        </button>
      </div>
    </InteractionContainer>
  )
}
