# passkey-example

This is an example app that uses Passkey SDK to show how to create a wallet and send transactions on Sui using React.

## Run locally

```bash
pnpm i
pnpm dev
```

## SDK

### Create a new wallet

```ts
const passkey = await PasskeyKeypair.getPasskeyInstance(
new BrowserPasskeyProvider('Sui Passkey Example',{
    rpName: 'Sui Passkey Example',
    rpId: window.location.hostname,
} as BrowserPasswordProviderOptions)
);

const address = passkey.getPublicKey().toSuiAddress();
```

### Sign a transaction

```ts
const sig = await passkey.signTransaction(txBytes);
```     

### Sign a personal message

```ts
const testMessage = new TextEncoder().encode('Hello world!');
const { signature } = await passkey.signPersonalMessage(testMessage);
```

## Notes on wallet storage

One of the inconveniences of passkey is that the public key created from passkey is only returned when a passkey is created, but not when it's used to sign. In addition, one origin (e.g. a website, a chrome extension, a mobile app) is allowed to have more than one passkey. Since the public key is used to derive one address, this means the wallet has to remember the public key somehow and not prompt the user to create a new passkey. Otherwise, the user may end up with multiple passkey wallets and be confused about which one to use to sign with for the given address. 

Fortunately, one can recover either 2 possible public keys from 1 Secp256r1 signatures, or 1 unique public key from 2 Secp256r1 signatures. This means that if the user is asked to sign two messages, the developer can recover an unique public key and its Sui address. Alternatively, the user can be prompted to sign one message, and the wallet will look onchain assets with both possible addresses and only derive the wallet as the one with assets. 

Given the above properties above, a passkey wallet developer needs to make some design choices. 

1. It is recommended to cache the `PasskeyKeypair` instance that contains the public key in the wallet. When a user tries to sign a transaction, it will just call signTransaction on the same instance. 

2. If the user is logged out or uses a different browser or device, or the `PasskeyKeypair` instance is no longer present for any reason, the user should be prompted to "Log in to existing passkey wallet", instead of "Create a new passkey wallet".

3. For the "Log in to existing passkey wallet" flow, the user should be asked to sign two personal messages, e.g. "Log in to passkey message 1" and "Log in to passkey message 2". The wallet should now be able to recover the public key and load the existing wallet address.

4. Alternatively, the developer can choose to ask the user to only sign one personal message, and look onchain for the one with assets. This may be preferred since the user is only prompted to sign one message. 

5. It is recommended that the user should only be allowed to create a passkey wallet once per origin. If the user ended up with multiple passkeys for the same origin, the passkey UI would show a list of all passkeys of the same origin and the user can choose which one to use. This can be a confusing experience since they do not remember which passkey is the way that the wallet was created for. 