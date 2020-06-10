export enum ServiceCredentials {
  FirstCredential = 'FirstCredential',
  SecondCredential = 'SecondCredential',
  ThirdCredential = 'ThirdCredential',
}

export enum ShareCredentials {
  Email = 'email',
}

export enum InteractionType {
  Receive = 'receive',
  Share = 'share',
  Auth = 'auth',
}

export const joloColor = 'rgb(148, 47, 81)'
export const selectColor = '#f3c61c'

export const serviceHostport = process.env.SERVICE_HOSTPORT || 'localhost:9000'
export const serviceUrl = `http://${serviceHostport}`
