import React from 'react'
import { InteractionInput } from '../../components/InteractionInput'

interface IClaimInputProps {
  label: string
  claimKey: string
  keyPlaceholder: string
  setClaimKey: React.Dispatch<React.SetStateAction<string>>
  claimLabel: string
  labelPlaceholder: string
  setClaimLabel: React.Dispatch<React.SetStateAction<string>>
}

export const ClaimInput: React.FC<IClaimInputProps> = ({
  label,
  keyPlaceholder,
  claimKey,
  setClaimKey,
  labelPlaceholder,
  claimLabel,
  setClaimLabel,
}) => {
  return (
    <>
      <h4 style={{ color: 'gray' }}>{label}</h4>
      <InteractionInput
        withoutLabel
        value={claimKey}
        setValue={setClaimKey}
        placeholder={keyPlaceholder}
      />
      <InteractionInput
        withoutLabel
        value={claimLabel}
        setValue={setClaimLabel}
        placeholder={labelPlaceholder}
      />
    </>
  )
}
