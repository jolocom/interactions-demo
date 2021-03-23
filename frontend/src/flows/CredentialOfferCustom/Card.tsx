import { Space } from 'components/Space'
import React from 'react'
import styles from './CredentialOfferCustom.module.css'

interface ICardProps {
  id: number
  type: string
  name: string
  properties: Array<Record<string, any>>
  onRemove: (id: number) => void
  onEdit: (id: number) => void
}
export const Card: React.FC<ICardProps> = ({
  id,
  type,
  name,
  properties,
  onRemove,
  onEdit,
}) => {
  return (
    <div className={styles['card-container']}>
      <div className={styles['card-field']}>
        <b>Type:</b>
        <p>{type}</p>
      </div>
      <div className={styles['card-field']}>
        <b>Name:</b>
        <p>{name || 'Not specified'}</p>
      </div>

      {properties.map(p => (
        <div key={p.key} className={styles['card-field']}>
          <p key={p.label}>{p.label}:</p>
          <p key={p.value}>{p.value.slice(0, 20)}</p>
        </div>
      ))}
      <Space />
      <div className={styles['btns-container']}>
        <button onClick={() => onRemove(id)}>Remove</button>
        <button onClick={() => onEdit(id)}>Edit</button>
      </div>
    </div>
  )
}
