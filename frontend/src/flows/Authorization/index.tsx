import React, { useState } from 'react'
import { InteractionInput } from 'components/InteractionInput'
import { InteractionTemplate } from 'components/InteractionTemplate'
import { IFlowProps } from 'types/flow'
import { RpcRoutes } from 'config'

interface IAuthorizationProps extends IFlowProps {}

const IMAGE_URL_PLACEHOLDER =
  'http://www.pngmart.com/files/10/Vespa-Scooter-PNG-Pic.png'

export const Authorization: React.FC<IAuthorizationProps> = ({
  serviceAPI,
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
    console.log({ resp })

    return resp
  }

  return (
    <InteractionTemplate
      startText="Start Authorization Interaction"
      startHandler={startAuthz}
    >
      <h2>Authorization</h2>
      <h4>
        <i>(Not supported on SmartWallet 1.x)</i>
      </h4>
      <InteractionInput
        label="Description"
        value={description}
        setValue={setDescription}
      />
      <InteractionInput label="Action" value={action} setValue={setAction} />
      <InteractionInput label="Image URL" value={image} setValue={setImage} />
    </InteractionTemplate>
  )
}
