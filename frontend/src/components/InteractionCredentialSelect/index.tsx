import React from 'react'
import styles from './InteractionCredentialSelect.module.css'

interface ISelectProps {
  title: string
  options: any[]
  onSelect: (item: any) => void
  selectedItems: any[]
}

export const InteractionCredentialSelect: React.FC<ISelectProps> = ({
  title,
  options,
  onSelect,
  selectedItems,
}) => {
  return (
    <div className={styles['container']}>
      <h4>{title}</h4>
      {options.map(item => {
        return (
          <button
            key={item}
            className={styles['item']}
            style={{
              backgroundColor: selectedItems.includes(item)
                ? '#f3c61c'
                : 'white',
            }}
            onClick={() => onSelect(item)}
          >
            <i>{item}</i>
          </button>
        )
      })}
    </div>
  )
}
