export enum CredentialTypes {
  ProofOfIdCredentialDemo = 'ProofOfIdCredentialDemo',
  ProofOfDriverLicenceDemo = 'ProofOfDriverLicenceDemo',
  ProofOfTicketDemo = 'ProofOfTicketDemo',
}

export type TInput = {
  key: string
  label: string
  value: string
}
export type ClaimKeys = keyof TInput

// TODO: this is a terrible name
export interface ICredential {
  id: number
  type: CredentialTypes
  name: string
  inputs: TInput[]
}
