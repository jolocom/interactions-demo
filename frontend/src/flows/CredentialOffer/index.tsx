import React, { useEffect, useState } from 'react'
import { InteractionCredentialSelect } from '../../components/InteractionCredentialSelect'
import { InteractionTemplate } from '../../components/InteractionTemplate'
import { RpcRoutes } from '../../config'
import { IFlowProps } from '../../types/flow'

interface ICredentialOfferProps extends IFlowProps {
  credTypes: string[]
}

export const CredentialOffer: React.FC<ICredentialOfferProps> = ({
  serviceAPI,
  credTypes,
}) => {
  const [issuedCredentials, setIssued] = useState<Array<string>>([])
  const [invalidCredentials, setInvalid] = useState<Array<string>>([])
  const availableIssueCredentials = credTypes

  const handleSelect = (array: string[], item: string) => {
    return !array.includes(item)
      ? [...array, item]
      : array.filter(val => val !== item)
  }

  useEffect(() => {
    if (issuedCredentials.length === 0 && credTypes && credTypes.length > 0) {
      setIssued(credTypes.slice(0, 1))
    }
  })

  const startCredOffer = async () => {
    const resp: { qr: string; err: string } = await serviceAPI.sendRPC(
      RpcRoutes.offerCred,
      {
        types: Array.from(new Set(issuedCredentials)),
        invalid: Array.from(new Set(invalidCredentials)),
      },
    )
    console.log(resp)
    return resp
  }

  return (
    <InteractionTemplate
      startText="Start Credential Offer"
      startHandler={startCredOffer}
    >
      <h2>Credential Offer</h2>
      <InteractionCredentialSelect
        title={'Available Credentials'}
        options={availableIssueCredentials}
        onSelect={type => setIssued(handleSelect(issuedCredentials, type))}
        selectedItems={issuedCredentials}
      />
      <InteractionCredentialSelect
        title={'Break Credentials'}
        options={issuedCredentials}
        onSelect={type => setInvalid(handleSelect(invalidCredentials, type))}
        selectedItems={invalidCredentials}
      />
    </InteractionTemplate>
  )
}
