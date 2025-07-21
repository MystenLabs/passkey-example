# Sui Passkey Wallet Example

A React application demonstrating how to create and manage Sui wallets using WebAuthn passkeys, including multisignature wallet functionality.

## Features

- **Single Passkey Wallet**: Create and manage a Sui wallet using only a WebAuthn passkey
- **Multisignature Wallet**: Demo of a 2-of-2 multisig wallet combining a passkey with a test keypair
- **Transaction Management**: Build, sign, and send transactions on Sui testnet

## ⚠️ Security Notice

**This is a demonstration application only.** The multisignature wallet implementation uses a hardcoded private key for simplicity. This is insecure and should never be used in production. Consider sign with the private key using WalletConnect. 

The passkey signing is production ready. 

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

This is an example application. For production use, ensure you implement proper security measures and follow best practices for key management.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
