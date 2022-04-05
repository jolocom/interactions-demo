import React, { useState } from 'react'

import { InteractionTemplate } from 'components/InteractionTemplate'
import { InteractionInput } from 'components/InteractionInput'
import { RpcRoutes } from 'config'
import { IFlowProps } from 'types/flow'

interface IAuthenticationProps extends IFlowProps {}

export const Authentication: React.FC<IAuthenticationProps> = ({
  serviceAPI,
}) => {
  const [description, setDescription] = useState<string>('Lorem ipsum')
  const [msg, setMsg] = useState<string | undefined>()

  const startAuth = async () => {
    const resp: {
      qr: string
      err: string
      id: string | undefined
    } = await serviceAPI.sendRPC(RpcRoutes.authnInterxn, { description })
    console.log('resp', resp)
    if (resp.id) {
      receiveUpdate(resp)
    }
    return resp
  }

  const receiveUpdate = async (resp: any) => {
    const processedRes = await resp.originalMsg.followUps[1].processed
    const responderDid = processedRes.participants.responder.didDocument.id
    setMsg(responderDid)
    console.log('processedRes', processedRes)
  }

  return (
    <InteractionTemplate
      startText="Start Authentication Interaction"
      startHandler={startAuth}
    >
      <h2>Authentication</h2>
      <InteractionInput
        label="Description"
        value={description}
        setValue={setDescription}
      />
      <p>
        {msg && (
          <>
            <br />
            <b>Result: </b>
            The user successfully authenticate using his DID:
            <b> {msg}</b>
          </>
        )}
      </p>
    </InteractionTemplate>
  )
}
