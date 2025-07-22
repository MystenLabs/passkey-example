# Sui Passkey Wallet Example

This React application demonstrates how to create and manage Sui wallets using WebAuthn passkeys. It also includes an example of multisignature wallet functionality.

## Features

- **Single Passkey Wallet**: Create and manage a Sui wallet using only a WebAuthn passkey.
- **Multisignature Wallet**: Demonstrates a 2-of-2 multisig wallet that combines a passkey with a test keypair.
- **Transaction Management**: Build, sign, and send transactions on Sui testnet.

## ⚠️ Security Notice

**This is a demonstration application only.** The multisignature wallet example uses a hardcoded private key for simplicity. **Do not use this approach in production.** To support production use, sign with private keys through secure means such as WalletConnect.

Passkey-based signing in this example is production ready.

## Run locally

```bash
pnpm dev

```

## Documentation

For detailed information about the Sui SDK and passkey functionality:

- [Sui TypeScript SDK Documentation](https://sdk.mystenlabs.com/typescript)
- [Passkey Cryptography Guide](https://sdk.mystenlabs.com/typescript/cryptography/passkey)
- [Multisignature Wallets](https://sdk.mystenlabs.com/typescript/cryptography/multisig)

## Contributing

This is an example project. If you're building for production, make sure to implement secure key management and follow best practices.

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.