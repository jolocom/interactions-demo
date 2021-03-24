import React, { InputHTMLAttributes } from 'react'
import { Space } from '../Space'
import styles from './Input.module.css'

interface IInteractionInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  withoutLabel?: boolean
}

export const InteractionInput: React.FC<IInteractionInputProps> = ({
  label,
  value,
  setValue,
  withoutLabel = false,
  ...rest
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  return (
    <>
      {!withoutLabel && (
        <>
          <Space />
          <h4>{label}</h4>
        </>
      )}
      <input
        className={styles['input']}
        type="text"
        name={label}
        value={value}
        onChange={handleChange}
        {...rest}
      />
    </>
  )
}
