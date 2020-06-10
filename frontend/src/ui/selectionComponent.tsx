import React from 'react'
import { selectColor } from '../config'

interface Props {
  title: string
  options: any[]
  onSelect: (item: any) => void
  selectedItems: any[]
}

export const SelectionComponent = (props: Props) => {
  const { title, options, onSelect, selectedItems } = props
  return (
    <div style={{ paddingTop: '20px' }}>
      <h4>{title}</h4>
      {options.map(item => {
        return (
          <button
            style={{
              borderRadius: '10px',
              margin: '10px',
              padding: '10px',
              backgroundColor: selectedItems.includes(item)
                ? selectColor
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
