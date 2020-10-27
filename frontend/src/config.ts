export enum ServiceCredentials {
  FirstCredential = 'FirstCredential',
  SecondCredential = 'SecondCredential',
  ThirdCredential = 'ThirdCredential',
}

export enum InteractionType {
  Receive = 'receive',
  Share = 'share',
  Auth = 'auth',
}

export enum RpcRoutes {
  peerResolutionInterxn = 'peerResolutionInterxn',
  authzInterxn = 'authzInterxn',
  authnInterxn = 'authnInterxn',
  createDemoChannel = 'createDemoChannel',
  waitForChannelAuth = 'waitForChannelAuth',
  remoteEncrypt = 'remoteEncrypt',
  remoteDecrypt = 'remoteDecrypt',
  getCredentialTypes = 'getCredentialTypes',
  offerCred = 'offerCred',
  getRequestableCredentialTypes = 'getRequestableCredentialTypes',
  credShareRequest = 'credShareRequest',
}

export const joloColor = 'rgb(148, 47, 81)'
export const selectColor = '#f3c61c'
