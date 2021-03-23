import { CredentialTypes } from "./types"

export const documentInputs = [
  {
    label: 'Given Name',
    value: 'Karl',
    key: 'givenName',
    placeholder: '(mandatory)',
  },
  {
    label: 'Family Name',
    value: 'Müller',
    key: 'familyName',
    placeholder: '(mandatory)',
  },
  {
    label: 'Photograph',
    value:
      'https://i.pinimg.com/564x/64/4d/dc/644ddca56c43e4b01af5aec27e010feb.jpg',
    key: 'photo',
    placeholder: '(mandatory)',
  },
]

export const documentTypes = [
  CredentialTypes.ProofOfDriverLicenceDemo,
  CredentialTypes.ProofOfIdCredentialDemo,
]

export const renderAsForType = {
  [CredentialTypes.ProofOfDriverLicenceDemo]: 'document',
  [CredentialTypes.ProofOfIdCredentialDemo]: 'document',
  [CredentialTypes.ProofOfTicketDemo]: 'ticket',
}