// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import {
  BrowserPasskeyProvider,
  BrowserPasswordProviderOptions,
  findCommonPublicKey,
  PasskeyKeypair,
} from "@mysten/sui/keypairs/passkey";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64, toBase64 } from "@mysten/sui/utils";
import React, { useEffect, useState } from "react";
import Button from "./Button";
import { MultiSigPublicKey } from "@mysten/sui/multisig";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const passkeySavedName = "Sui Passkey Example";

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [txBytes, setTxBytes] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [passkeyInstance, setPasskeyInstance] = useState<PasskeyKeypair | null>(
    null
  );
  const [multiSigPublicKey, setMultiSigPublicKey] = useState<MultiSigPublicKey | null>(
    null
  );
  const [singleKeyPair, setSingleKeyPair] = useState<Ed25519Keypair | null>(
    null
  );
  const [walletType, setWalletType] = useState<'single' | 'multisig' | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [signLoading, setSignLoading] = useState(false);

  const [walletLoadLoading, setWalletLoadLoading] = useState(false);

  const [balance, setBalance] = useState<string | null>(null);
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  const passkeyProvider = new BrowserPasskeyProvider(passkeySavedName, {
    rpName: passkeySavedName,
    rpId: window.location.hostname,
    authenticatorSelection: {
      authenticatorAttachment: "cross-platform",
    },
  } as BrowserPasswordProviderOptions);

  useEffect(() => {
    fetchBalance();
  }, [walletAddress]);

  useEffect(() => {
    const localPublicKeyStr = localStorage.getItem("PublicKey");
    if (!localPublicKeyStr)
      return;
    try {
      setLoading(true);
      const localPublicKey = new Uint8Array(localPublicKeyStr.split(',').map(item => Number(item)));
      const keypair = new PasskeyKeypair(localPublicKey, passkeyProvider);
      setPasskeyInstance(keypair);
      setWalletAddress(keypair.getPublicKey().toSuiAddress());
    } catch (error) {
      console.error("Error loading local storage PublicKey:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateWallet = async () => {
    try {
      setLoading(true);

      const passkey = await PasskeyKeypair.getPasskeyInstance(passkeyProvider);

      const address = passkey.getPublicKey().toSuiAddress();
      setWalletAddress(address);
      setPasskeyInstance(passkey);
      setWalletType('single');
      // Clear multisig state
      setMultiSigPublicKey(null);
      setSingleKeyPair(null);
      // set local storage
      localStorage.setItem("PublicKey", passkey.getPublicKey().toRawBytes().toString());
      console.log("Single passkey wallet created with address:", address);
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async () => {
    if (!walletAddress || !passkeyInstance) return;

    setCreateLoading(true);
    const tx = new Transaction();
    tx.setSender(walletAddress);
    tx.setGasPrice(1000);
    tx.setGasBudget(2000000);
    let bytes = await tx.build({ client: client });
    const base64Bytes = toBase64(bytes);
    setTxBytes(base64Bytes);
    console.log("Transaction bytes created:", base64Bytes);
    setCreateLoading(false);
  };

  const signTransaction = async () => {
    if (!passkeyInstance || !txBytes) return;
    
    // Check if we're in multisig mode
    if (multiSigPublicKey && singleKeyPair) {
      setSignLoading(true);
      const bytes = fromBase64(txBytes);
      const passkeySig = (await passkeyInstance.signTransaction(bytes)).signature;
      const singleSig = (await singleKeyPair.signTransaction(bytes)).signature;
      const signature = multiSigPublicKey.combinePartialSignatures([singleSig, passkeySig]);
      setSignature(signature);
      setSignLoading(false);
    } else {
      // Single key signing mode
      setSignLoading(true);
      const bytes = fromBase64(txBytes);
      const signature = (await passkeyInstance.signTransaction(bytes)).signature;
      setSignature(signature);
      setSignLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!walletAddress) return;
    const balance = await client.getBalance({
      owner: walletAddress,
    });
    setBalance(balance.totalBalance);
  };

  const handleLoadWallet = async () => {
    setWalletLoadLoading(true);
    const testMessage = new TextEncoder().encode("Hello world!");
    const possiblePks = await PasskeyKeypair.signAndRecover(
      passkeyProvider,
      testMessage
    );

    const testMessage2 = new TextEncoder().encode("Hello world 2!");
    const possiblePks2 = await PasskeyKeypair.signAndRecover(
      passkeyProvider,
      testMessage2
    );

    const commonPk = findCommonPublicKey(possiblePks, possiblePks2);
    const keypair = new PasskeyKeypair(commonPk.toRawBytes(), passkeyProvider);
    setPasskeyInstance(keypair);
    setWalletAddress(keypair.getPublicKey().toSuiAddress());
    setWalletType('single');
    // Clear multisig state
    setMultiSigPublicKey(null);
    setSingleKeyPair(null);
    // set local storage
    localStorage.setItem("PublicKey", commonPk.toRawBytes().toString());
    setWalletLoadLoading(false);
  };

  const handleMultisigWallet = async () => {
    try {
      setLoading(true);
      
      // Always create a fresh passkey instance for multisig
      const currentPasskey = await PasskeyKeypair.getPasskeyInstance(passkeyProvider);
      setPasskeyInstance(currentPasskey);

      // set up default single keypair.
      const kp = Ed25519Keypair.fromSecretKey(
        new Uint8Array([
          126, 57, 195, 235, 248, 196, 105, 68, 115, 164, 8, 221, 100, 250, 137, 160, 245, 43, 220,
          168, 250, 73, 119, 95, 19, 242, 100, 105, 81, 114, 86, 105,
        ]),
      );
      setSingleKeyPair(kp);
      const pkSingle = kp.getPublicKey();
      
      const pkPasskey = currentPasskey.getPublicKey();
      
      console.log("pkSingle:", pkSingle);
      console.log("pkPasskey:", pkPasskey);
      console.log("pkSingle constructor:", pkSingle.constructor.name);
      console.log("pkPasskey constructor:", pkPasskey.constructor.name);
    
      // Try to get the raw bytes to see if that helps
      const pkSingleBytes = pkSingle.toRawBytes();
      const pkPasskeyBytes = pkPasskey.toRawBytes();
      console.log("pkSingle bytes length:", pkSingleBytes.length);
      console.log("pkPasskey bytes length:", pkPasskeyBytes.length);
    
      // construct multisig address.
      const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
        threshold: 2,
        publicKeys: [
          { publicKey: pkSingle, weight: 1 },
          { publicKey: pkPasskey, weight: 1 },
        ],
      });
      const multisigAddr = multiSigPublicKey.toSuiAddress();
      setMultiSigPublicKey(multiSigPublicKey);
      setWalletAddress(multisigAddr);
      setWalletType('multisig');
      console.log("Multisig wallet created with address:", multisigAddr);
    } catch (error) {
      console.error("Error creating multisig wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendTransaction = async () => {
    if (!walletAddress || !signature) return;

    setSendLoading(true);
    try {
      const result = await client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: signature,
        options: {
          showEffects: true,
        },
      });
      console.log(result);
      setTxDigest(result.digest);
      await fetchBalance();
    } catch (error) {
      console.error("Transaction failed:", error);
      // Handle the error but don't throw it
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Passkey Wallet Example on Sui Testnet</h1>

      <div className="button-group">
        <Button
          onClick={handleCreateWallet}
          disabled={loading}
          loading={loading}
          className="wallet-button"
        >
          Create Passkey Wallet
        </Button>

        <Button
          onClick={handleLoadWallet}
          disabled={walletLoadLoading}
          loading={walletLoadLoading}
        >
          Load Passkey Wallet
        </Button>

        <Button
          onClick={handleMultisigWallet}
          disabled={loading}
          loading={loading}
          className="wallet-button"
        >
          Create 2-of-2 Multisig (Passkey + Test Key)
        </Button>
      </div>

              <div className="security-warning">
          <h3>⚠️ Security Notice</h3>
          <p>
            <strong>Demo Application Only:</strong> This 2-of-2 multisig wallet uses a hardcoded private key for demonstration purposes. 
            Do not use it with real funds. The passkey signing flow is production ready. Overall for production use, integrate secure 
            wallets via WalletConnect or generate and manage keypairs securely.
          </p>
        </div>


      {walletAddress && (
        <div className="wallet-info">
          <h2>
            {walletType === 'multisig' ? 'Multisig Wallet Created!' : 'Passkey Wallet Created!'}
          </h2>
          
          <div className="wallet-details">
            <p><strong>Type:</strong> {walletType === 'multisig' ? 'Multisig (2-of-2)' : 'Single Passkey'}</p>
            <p><strong>Address:</strong> {walletAddress}</p>
            <p><strong>Balance:</strong> {balance ? parseInt(balance) / 1000000000 : "0"} SUI</p>
            
            {walletType === 'multisig' && (
              <div className="multisig-details">
                <p><strong>Threshold:</strong> 2 signatures required</p>
              </div>
            )}
          </div>

          <div className="faucet-link">
            <p>Need testnet tokens? Visit the official Sui faucet:</p>
            <a
              href="https://faucet.sui.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="faucet-button"
            >
              Get Testnet Tokens
            </a>
          </div>

          {txBytes && (
            <div className="transaction-info">
              <h3>Transaction Bytes:</h3>
              <p className="bytes">{txBytes}</p>
            </div>
          )}

          {signature && (
            <div className="transaction-info">
              <h3>Combined Signature:</h3>
              <p className="bytes">{signature}</p>
            </div>
          )}

          <div className="button-group">
            <Button
              onClick={createTransaction}
              disabled={createLoading}
              loading={createLoading}
              className="transaction-button"
            >
              Create Transaction
            </Button>

            <Button
              onClick={signTransaction}
              disabled={signLoading}
              loading={signLoading}
              className="sign-button"
            >
              {walletType === 'multisig' ? 'Sign with Both Keys' : 'Sign Transaction'}
            </Button>

            <Button
              onClick={sendTransaction}
              disabled={sendLoading || !txBytes}
              loading={sendLoading}
              className="send-button"
            >
              Send Transaction
            </Button>
          </div>
          
          {txDigest && (
            <div className="transaction-info">
              <h3>Transaction Digest:</h3>
              <p className="bytes">
                <a
                  href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {txDigest}
                </a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
