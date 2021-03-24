import { claimsMetadata } from 'jolocom-lib'
import { Agent } from '@jolocom/sdk'
import { destroyAgent, createAgent, meetAgent } from './utils'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'
import fetch from 'node-fetch'
import { CredentialOfferFlow } from '@jolocom/sdk/js/interactionManager/credentialOfferFlow'
// @ts-ignore
global.fetch = fetch

const conn1Name = 'alice'
let alice: Agent
let serviceAPI: JolocomWebServiceClient

describe('Credential Offer Interaction', () => {
  beforeAll(async () => {
    alice = await createAgent(conn1Name, 'jun')
    await alice.createNewIdentity()
    serviceAPI = new JolocomWebServiceClient('localhost:9000', '/jolo', false)
  })

  afterAll(async () => {
    await destroyAgent(conn1Name)
  })

  it('gets credential types', async () => {
    const credTypes = await serviceAPI.sendRPC('getCredentialTypes')
    expect(credTypes.length).toBeGreaterThan(0)
  })

  it('creates a CredentialOffer based on request', async () => {
    const credOfferRequestDescription = {
      type: 'TestCred',
      schema: 'https://schema.org/example',
      name: 'Test Credential',
      claims: {
        testValue: false,
        otherVal: 'empty',
      },
      renderAs: 'Document',
      display: {
        properties: [
          {
            path: ['$.testValue'],
            label: 'Test Status',
          },
          {
            path: ['$.otherVal'],
            label: 'Another property',
          },
        ],
      },
    }
    const credOffer = await serviceAPI.sendRPC(
      'genericCredentialOffer',
      credOfferRequestDescription,
    )

    expect(credOffer.jwt).toBeDefined()
    const interxn = await alice.processJWT(credOffer.jwt)

    const flow = interxn.flow as CredentialOfferFlow
    const offers = flow.getOfferDisplay()
    //console.log('getOfferDisplay', JSON.stringify(offers, null, 2))

    expect(offers).toHaveLength(1)
    expect(offers[0].properties).toHaveLength(2)
    const props = offers[0].properties
    expect(props && props[0].label).toEqual(
      credOfferRequestDescription.display.properties[0].label,
    )

    const offerResp = await interxn.createCredentialOfferResponseToken([
      { type: flow.state.offerSummary[0].type },
    ])

    await alice.processJWT(offerResp)
    await interxn.send(offerResp)

    const issuance = flow.getIssuanceResult()
    expect(issuance).toHaveLength(1)
    expect(issuance[0].validationErrors).toMatchObject({
      invalidIssuer: false,
      invalidSubject: false,
    })

    const offerDisp = flow.getOfferDisplay()
    //console.log('getOfferDisplay', JSON.stringify(offerDisp, null, 2))

    expect(offerDisp[0].properties[0].value).toBeDefined()
    expect(offerDisp[0].properties[1].value).toEqual('empty')
  })
})
