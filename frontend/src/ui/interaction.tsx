import React, { useState, useEffect } from 'react'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import { InteractionButton } from './interactionButton'
import { SelectionComponent } from './selectionComponent'
import {
  InteractionType,
  ShareCredentials,
} from '../config'

interface Props {
  interactionType: InteractionType
}

export const AuthContainer = (
{
  serviceAPI,
}: {
  serviceAPI: JolocomWebServiceClient,
}) => {
  //const [description, setDescription] = useState<string>('Unlock your scooter')
  const startAuth = async () => {
    const resp: { qr: string, err: string } = await serviceAPI.sendRPC('peerResolutionInterxn')
    console.log(resp)
    return resp
  }

  return (
    <InteractionContainer
      startText="Start Authentication Interaction"
      startHandler={startAuth}
    >
      <div style={{ paddingTop: '20px' }}>
        {/*<h4>Description</h4>
        <input
          style={{
            margin: '10px',
            width: '100%',
          }}
          type="text"
          name="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />*/}
      </div>
    </InteractionContainer>
  )
}

export const CredOfferContainer = (
{
  serviceAPI,
  credTypes
}: {
  serviceAPI: JolocomWebServiceClient,
  credTypes: string[]
}) => {
  // TODO use Set instead of array
  const [issuedCredentials, setIssued] = useState<Array<string>>([])
  const [invalidCredentials, setInvalid] = useState<Array<string>>([])
  const [requestedCredentials, setRequested] = useState<Array<string>>([
    ShareCredentials.Email,
  ])
  const availableIssueCredentials = credTypes
  const availableShareCredentials = [
    ...Object.values(ShareCredentials),
    ...availableIssueCredentials,
  ]

  const handleSelect = (array: string[], item: string) => {
    return !array.includes(item)
      ? [...array, item]
      : array.filter(val => val !== item)
  }

  useEffect(() => {
    if (issuedCredentials.length === 0 && credTypes && credTypes.length > 0) {
      setIssued(credTypes.slice(0,1))
    }
  })

  const startCredOffer = async () => {
    const resp: { qr: string, err: string } = await serviceAPI.sendRPC('offerCred', {
      types: Array.from(new Set(issuedCredentials)),
      invalid: Array.from(new Set(invalidCredentials)),
    })
    console.log(resp)
    return resp
  }
    //setJwt(resp.jwt)
    //setIdentifier(resp.id)

    /*
    const { qrCode, socket, identifier } = await getQrCode(interactionType, {
      ...(interactionType === InteractionType.Receive && {
        types: Array.from(new Set(issuedCredentials)),
        invalid: Array.from(new Set(invalidCredentials)),
      }),
      ...(interactionType === InteractionType.Share && {
        types: Array.from(new Set(requestedCredentials)),
      }),
      ...(interactionType === InteractionType.Auth && {
        desc: description,
      }),
    })

    setQr(qrCode)
    awaitStatus(identifier)
      .then((obj: any) => {
        if (obj.status === 'success') setQr('')
      })
      .catch(e => setErr(e))
    */

  return (
    <InteractionContainer
      startText="Start Credential Offer"
      startHandler={startCredOffer}
    >
      <h2>Credential Offer</h2>
      <SelectionComponent
        title={'Available Credentials'}
        options={availableIssueCredentials}
        onSelect={type => setIssued(handleSelect(issuedCredentials, type))}
        selectedItems={issuedCredentials}
      />
      <SelectionComponent
        title={'Break Credentials'}
        options={issuedCredentials}
        onSelect={type =>
          setInvalid(handleSelect(invalidCredentials, type))
        }
        selectedItems={invalidCredentials}
      />
    </InteractionContainer>
  )
}

export const InteractionContainer = ({
  startHandler,
  startText,
  children
} : {
  startHandler: () => Promise<{ qr?: string, jwt?: string, err?: string }>,
  startText: string,
  children: React.ReactNode
}) => {
  const [qr, setQr] = useState<string | undefined>()
  const [jwt, setJwt] = useState<string>()
  const [err, setErr] = useState<string | undefined>()

  const startBtnHandler = async () => {
    const resp = await startHandler()
    setQr(resp.qr)
    setJwt(resp.jwt)
    setErr(resp.err)
  }

  return (
    <div
      style={{
        background: '#ffefdf',
        marginTop: '70px',
        marginBottom: '70px',
        marginLeft: '10px',
        marginRight: '10px',
        padding: '30px',
        boxShadow: '0px 0px 80px 2px gray',
        borderRadius: '40px',
      }}
    >
      {children}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <InteractionButton
          onClick={startBtnHandler}
          text={startText}
        />

        {err ? (
          <b>Error</b>
        ) : (
          jwt && (<div>
            <div style={{
              wordWrap: 'break-word', maxWidth: '50vw',
              whiteSpace: 'pre-wrap', fontFamily: 'monospace'
              }}>
              {jwt}
            </div>
          </div>)
        )}

        {!err && qr && (
          <img src={qr} className="c-qrcode" alt="QR Code" />
        )}
      </div>
    </div>
  )
}
