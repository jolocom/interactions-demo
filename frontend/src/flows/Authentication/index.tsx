import React, { useState } from 'react'
import styles from './Authentication.module.css'

import { InteractionTemplate } from '../../components/InteractionTemplate'
import { RpcRoutes } from '../../config'
import { IFlowProps } from '../../types/flow'

interface IAuthenticationProps extends IFlowProps {}

const Authentication: React.FC<IAuthenticationProps> = ({ serviceAPI }) => {
  const [description, setDescription] = useState<string>('Lorem ipsum')

  const startAuth = async () => {
    const resp: {
      qr: string
      err: string
    } = await serviceAPI.sendRPC(RpcRoutes.authnInterxn, { description })
    console.log({ resp })

    return resp
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value)
  }

  return (
    <InteractionTemplate
      startText="Start Authentication Interaction"
      startHandler={startAuth}
    >
      <h2>Authentication</h2>
      <div className={styles['input-container']}>
        <h4>Description</h4>
        <input
          className={styles['input']}
          type="text"
          name="description"
          value={description}
          onChange={handleChange}
        />
      </div>
    </InteractionTemplate>
  )
}

export default Authentication
