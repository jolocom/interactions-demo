import React, { useEffect, useState } from 'react'
import { InteractionCredentialSelect } from 'components/InteractionCredentialSelect'
import { InteractionTemplate } from 'components/InteractionTemplate'
import { Space } from 'components/Space'
import { RpcRoutes } from 'config'
import { IFlowProps } from 'types/flow'

interface ICredentialShareProps extends IFlowProps {
  credTypes: string[]
}

export const CredentialRequest: React.FC<ICredentialShareProps> = ({
  serviceAPI,
  credTypes,
}) => {
  const [requestedCredentials, setRequested] = useState<Array<string>>([])
  const requestableCredTypes = credTypes

  const handleSelect = (array: string[], item: string) => {
    return !array.includes(item)
      ? [...array, item]
      : array.filter(val => val !== item)
  }

  useEffect(() => {
    if (
      requestedCredentials.length === 0 &&
      credTypes &&
      credTypes.length > 0
    ) {
      setRequested(credTypes.slice(0, 1))
    }
  }, [requestedCredentials.length, credTypes])

  const startCredRequest = async () => {
    const resp: { qr: string; err: string } = await serviceAPI.sendRPC(
      RpcRoutes.credShareRequest,
      {
        types: Array.from(new Set(requestedCredentials)),
      },
    )
    console.log(resp)
    return resp
  }

  return (
    <InteractionTemplate
      startText="Start Credential Request Interaction"
      startHandler={startCredRequest}
    >
      <h2>Credential Request</h2>
      <InteractionCredentialSelect
        title="Available Credentials"
        options={requestableCredTypes}
        onSelect={type =>
          setRequested(handleSelect(requestedCredentials, type))
        }
        selectedItems={requestedCredentials}
      />
      <Space />
    </InteractionTemplate>
  )
}
