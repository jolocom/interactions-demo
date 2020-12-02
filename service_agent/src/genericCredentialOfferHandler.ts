import { Agent } from '@jolocom/sdk'
import { CredentialOfferFlowState } from '@jolocom/sdk/js/interactionManager/types'
import { CredentialOffer } from 'jolocom-lib/js/interactionTokens/types'
import { RPCRequest } from './types'

type Claims = Record<string, string>

interface OfferRequestParameters {
  name: string
  type: string
  claims: Claims
  renderAs: string
}

const generateMetadata = (type: string, name: string, claims: Claims) => {
  return {
    type: ['Credential', type],
    name,
    context: [
      {
        name: 'schema:name',
        ...Object.keys(claims).reduce((acc, key) => {
          acc[key] = `schema:${key}`
          return acc
        }, {}),
      },
    ],
  }
}

const generateCredentialOffer = (
  type: string,
  renderAs: string,
): CredentialOffer => ({
  type,
  requestedInput: {},
  renderInfo: {
    // @ts-ignore
    renderAs,
  },
})

export const genericCredentialOfferHandler = (
  agent: Agent,
): RPCRequest => async (
  req: OfferRequestParameters,
  { createInteractionCallbackURL, wrapJWT },
) => {
  const { name, type, claims, renderAs } = req

  const callbackURL = createInteractionCallbackURL(async (jwt: string) => {
    const interaction = await agent.processJWT(jwt)

    const state = interaction.getSummary().state as CredentialOfferFlowState
    const credentials = await interaction.issueSelectedCredentials(
      state.selectedTypes.reduce((acc, type) => {
        return {
          ...acc,
          [type]: () => ({
            claim: claims,
            metadata: generateMetadata(type, name, claims),
          }),
        }
      }, {}),
    )

    return interaction.createCredentialReceiveToken(credentials)
  })

  return wrapJWT(
    await agent.credOfferToken({
      callbackURL,
      offeredCredentials: [generateCredentialOffer(type, renderAs)],
    }),
  )
}
