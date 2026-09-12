export type StoredCredential = {
  id: string;
  publicKey: Uint8Array;
  counter: number;
};

let currentRegistrationChallenge: string | null = null;
let currentAuthenticationChallenge: string | null = null;
let storedCredential: StoredCredential | null = null;

export function setRegistrationChallenge(challenge: string) {
  currentRegistrationChallenge = challenge;
}

export function getRegistrationChallenge() {
  return currentRegistrationChallenge;
}

export function clearRegistrationChallenge() {
  currentRegistrationChallenge = null;
}

export function saveCredential(credential: StoredCredential) {
  storedCredential = credential;
}

export function getCredential() {
  return storedCredential;
}

export function setAuthenticationChallenge(challenge: string) {
  currentAuthenticationChallenge = challenge;
}

export function getAuthenticationChallenge() {
  return currentAuthenticationChallenge;
}

export function clearAuthenticationChallenge() {
  currentAuthenticationChallenge = null;
}
