import React, { useState } from 'react'
import { RpcRoutes } from '../config'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import { InteractionTemplate } from '../components/InteractionTemplate'

export const AuthenticationContainer = ({
  serviceAPI,
}: {
  serviceAPI: JolocomWebServiceClient
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
      <div style={{ paddingTop: '20px' }}>
        <h4>Description</h4>
        <input
          style={{
            margin: '10px',
            width: '100%',
          }}
          type="text"
          name="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
    </InteractionTemplate>
  )
}
