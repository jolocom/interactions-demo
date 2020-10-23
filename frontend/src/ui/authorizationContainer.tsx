import React, { useState } from 'react'
import { RpcRoutes } from '../config'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import { InteractionButton } from './interactionButton'
import { InteractionContainer } from './interaction'

const IMAGE_URL_PLACEHOLDER =
  'http://www.pngmart.com/files/10/Vespa-Scooter-PNG-Pic.png'

export const AuthorizationContainer = ({
  serviceAPI,
}: {
  serviceAPI: JolocomWebServiceClient
}) => {
  const [description, setDescription] = useState<string>('Lorem ipsum')
  const [action, setAction] = useState<string>('unlock')
  const [image, setImage] = useState<string>(IMAGE_URL_PLACEHOLDER)
  const startAuthz = async () => {
    const resp: {
      qr: string
      err: string
    } = await serviceAPI.sendRPC(RpcRoutes.authzInterxn, {
      description,
      action,
      imageURL: image,
    })
    return resp
  }

  return (
    <InteractionContainer
      startText="Start Authorization Interaction"
      startHandler={startAuthz}
    >
      <h2>Authorization</h2>
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
      <div style={{ paddingTop: '20px' }}>
        <h4>Action</h4>
        <input
          style={{
            margin: '10px',
            width: '100%',
          }}
          type="text"
          name="action"
          value={action}
          onChange={e => setAction(e.target.value)}
        />
      </div>
      <div style={{ paddingTop: '20px' }}>
        <h4>Image URL</h4>
        <input
          style={{
            margin: '10px',
            width: '100%',
          }}
          type="text"
          name="image"
          value={image}
          onChange={e => setImage(e.target.value)}
        />
      </div>
    </InteractionContainer>
  )
}
