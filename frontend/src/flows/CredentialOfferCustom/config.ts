import { CredentialTypes } from "./types"

export const documentInputs = [
  {
    name: 'givenName',
    label: 'Given Name',
    value: '',
    fieldName: 'givenName',
    placeholder: '(mandatory)',
  },
  {
    name: 'familyName',
    label: 'Family Name',
    value: '',
    fieldName: 'familyName',
    placeholder: '(mandatory)',
  },
  {
    name: 'photo',
    label: 'Photograph',
    value:
      'https://i.pinimg.com/564x/64/4d/dc/644ddca56c43e4b01af5aec27e010feb.jpg',
    fieldName: 'photo',
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