import { Agent } from '@jolocom/sdk'
import { CredentialOfferFlowState } from '@jolocom/sdk/js/interactionManager/types'
import { CredentialOffer } from 'jolocom-lib/js/interactionTokens/types'
import { RPCRequest } from './types'
import { encode } from 'node-base64-image'
import { CredentialDefinition } from '@jolocom/protocol-ts'

type Claims = Record<string, string>

interface OfferRequestParameters {
  name: string
  type: string
  schema: string
  claims: Claims
  renderAs: string
  display: CredentialDefinition['display']
}

const generateMetadata = (type: string, name: string, claims: Claims) => {
  return {
    type: ['VerifiableCredential', type],
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

const generateCredentialOffer = ({
  name,
  type,
  schema,
  claims,
  renderAs,
  display,
}: OfferRequestParameters): CredentialOffer => ({
  type,
  renderInfo: {
    // @ts-ignore
    renderAs,
  },
  credential: {
    name, //: `${type} Credential`,
    schema,
    display,
  },
})

const getBase64FromUrl = async (url: string) => {
  const options = {
    string: true,
    headers: {
      'User-Agent': 'my-app',
    },
  }
  const encoded = (await encode(url, options)) as string
  return `data:image/jpg;base64,${encoded}`
}

export const genericCredentialOfferHandler = (
  agent: Agent,
): RPCRequest => async (
  req: OfferRequestParameters[],
  { createInteractionCallbackURL, wrapJWT },
) => {
  return wrapJWT(
    await agent.credOfferToken({
      callbackURL: createInteractionCallbackURL(handleCredentialOfferResponse),
      offeredCredentials: req.map((r) => generateCredentialOffer(r)),
    }),
  )

  async function handleCredentialOfferResponse(jwt: string) {
    const interaction = await agent.processJWT(jwt)

    const state = interaction.getSummary().state as CredentialOfferFlowState

    const credentials = await interaction.issueSelectedCredentials(
      state.selectedTypes.reduce((acc, type) => {
        const reqDetails = req.find((r) => r.type === type)
        return {
          ...acc,
          [type]: async () => {
            // NOTE: encoding the photo property if it's available
            if (reqDetails.claims['photo']) {
              reqDetails.claims['photo'] = await getBase64FromUrl(
                reqDetails.claims['photo'],
              )
            }
            return {
              claim: reqDetails.claims,
              metadata: generateMetadata(
                reqDetails.type,
                reqDetails.name,
                reqDetails.claims,
              ),
            }
          },
        }
      }, {}),
    )

    return interaction.createCredentialReceiveToken(credentials)
  }
}
