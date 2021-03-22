import React from 'react'
import { TInput } from './types'
import styles from './CredentialOfferCustom.module.css'

const TextInput: React.FC<{
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  value: string
  name: string
  placeholder?: string
}> = props => {
  const { onChange, value, name, placeholder } = props
  return (
    <input
      style={{
        width: '90%',
      }}
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}

interface INewClaimInput {
  input: TInput
}

export const NewClaimInput: React.FC<INewClaimInput> = ({ input }) => {
  return (
    <div>
      <div className={styles['card-field']}>
        <p>key</p>
        <TextInput
          name="Claim key"
          value={input.fieldName}
          onChange={e => console.log('claim key', e.target.value)}
        />
      </div>
      <div className={styles['card-field']}>
        <p>label</p>
        <TextInput
          name="Claim label"
          value={input.label}
          onChange={e => console.log('claim label', e.target.value)}
        />
      </div>
      <div className={styles['card-field']}>
        <p>value</p>

        <TextInput
          name="Claim value"
          value={input.value}
          onChange={e => console.log('claim value', e.target.value)}
        />
      </div>
    </div>
  )
}

export default NewClaimInput
