import React, { useState } from 'react'

import { InteractionTemplate } from '../../components/InteractionTemplate'
import { RpcRoutes } from '../../config'
import { IFlowProps } from '../../types/flow'
import { InteractionInput } from '../../components/InteractionInput'

interface IAuthenticationProps extends IFlowProps {}

export const Authentication: React.FC<IAuthenticationProps> = ({
  serviceAPI,
}) => {
  const [description, setDescription] = useState<string>('Lorem ipsum')

  const startAuth = async () => {
    const resp: {
      qr: string
      err: string
    } = await serviceAPI.sendRPC(RpcRoutes.authnInterxn, { description })
    return resp
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
    </InteractionTemplate>
  )
}
