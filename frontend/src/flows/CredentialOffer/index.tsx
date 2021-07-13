import React, { useEffect, useState } from 'react'

import { InteractionCredentialSelect } from 'components/InteractionCredentialSelect'
import { InteractionTemplate } from 'components/InteractionTemplate'
import { RpcRoutes } from 'config'
import { IFlowProps } from 'types/flow'

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
  const [msg, setMsg] = useState<string | undefined>()
  const [err, setErr] = useState<string | undefined>()

  const handleSelect = (array: string[], item: string) => {
    return !array.includes(item)
      ? [...array, item]
      : array.filter(val => val !== item)
  }

  useEffect(() => {
    if (issuedCredentials.length === 0 && credTypes && credTypes.length > 0) {
      setIssued(credTypes.slice(0, 1))
    }
  }, [issuedCredentials.length, credTypes])

  const startCredOffer = async () => {
    const resp: {
      qr: string
      err: string
      id: string
    } = await serviceAPI.sendRPC(RpcRoutes.offerCred, {
      types: Array.from(new Set(issuedCredentials)),
      invalid: Array.from(new Set(invalidCredentials)),
    })
    console.log(resp)
    if (resp.id) {
      receiveUpdate(resp)
    }

    return resp
  }

  const receiveUpdate = async (resp: any) => {
    const processedRes = await resp.originalMsg.followUps[1].processed

    const successfulCredentials = processedRes.credentials
      .filter((c: any) => c.claim.id !== 'INVALID')
      .map((c: any) => c.name)
      .join(', ')
    const failedCredentials = processedRes.credentials
      .filter((c: any) => c.claim.id === 'INVALID')
      .map((c: any) => c.name)
      .join(', ')

    setMsg(`${successfulCredentials}`)
    if (failedCredentials.length > 0) setErr(`${failedCredentials}`)

    receiveFinal(resp)
  }

  const receiveFinal = async (resp: any) => {
    const processed = await resp.originalMsg.followUps[2].processed
    console.log('The final update has been recived from server', processed)
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
      <p>
        {msg && (
          <>
            <b>Result: </b>
            The user successfully got the Credentials:
            <b> {msg}</b>
          </>
        )}
      </p>
      <p>
        {err && (
          <>
            <b>Error: </b>
            The user failed to get the Credentials:
            <b> {err}</b>
          </>
        )}
      </p>
    </InteractionTemplate>
  )
}
