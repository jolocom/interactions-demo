import React from 'react'
import { ClaimKeys, TInput } from './types'
import styles from './CredentialOfferCustom.module.css'

const TextInput: React.FC<{
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  value: string
  placeholder?: string
}> = props => {
  const { onChange, value, placeholder } = props
  return (
    <input
      style={{
        width: '90%',
      }}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}

interface INewClaimInput {
  input: TInput
  onEdit: (key: string, claimKey: ClaimKeys, value: string) => void
}

export const ClaimDetails: React.FC<INewClaimInput> = ({ input, onEdit }) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
    claimKey: ClaimKeys,
  ) => {
    onEdit(key, claimKey, e.target.value)
  }

  return (
    <div>
      <div className={styles['card-field']}>
        <p>key</p>
        <TextInput
          value={input.key}
          onChange={e => handleChange(e, input.key, 'key')}
        />
      </div>
      <div className={styles['card-field']}>
        <p>label</p>
        <TextInput
          value={input.label}
          onChange={e => handleChange(e, input.key, 'label')}
        />
      </div>
      <div className={styles['card-field']}>
        <p>value</p>

        <TextInput
          value={input.value}
          onChange={e => handleChange(e, input.key, 'value')}
        />
      </div>
    </div>
  )
}
