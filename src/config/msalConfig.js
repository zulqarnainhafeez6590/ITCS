import { PublicClientApplication } from '@azure/msal-browser'

export const msalConfig = {
  auth: {
    clientId: 'eb0159cf-6751-46fc-b831-29fe4f1347c8',
    authority: 'https://login.microsoftonline.com/758534da-3ea2-42b7-a22c-2824e941888d',
    redirectUri: window.location.origin + '/login',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

export const loginRequest = {
  scopes: ['User.Read'],
}

export const msalInstance = new PublicClientApplication(msalConfig)

