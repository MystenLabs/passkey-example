// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
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

const passkeySavedName = "Sui Passkey Example";
const authenticatorAttachment = "platform";

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [txBytes, setTxBytes] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [passkeyInstance, setPasskeyInstance] = useState<PasskeyKeypair | null>(
    null
  );
  const [sendLoading, setSendLoading] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [signLoading, setSignLoading] = useState(false);

  const [walletLoadLoading, setWalletLoadLoading] = useState(false);

  const [balance, setBalance] = useState<string | null>(null);
  const client = new SuiClient({ url: getFullnodeUrl("devnet") });

  const passkeyProvider = new BrowserPasskeyProvider(passkeySavedName, {
    rpName: passkeySavedName,
    rpId: window.location.hostname,
    authenticatorSelection: {
      authenticatorAttachment,
    },
  } as BrowserPasswordProviderOptions);

  useEffect(() => {
    fetchBalance();
  }, [walletAddress]);

  const handleCreateWallet = async () => {
    try {
      setLoading(true);

      const passkey = await PasskeyKeypair.getPasskeyInstance(passkeyProvider);

      const address = passkey.getPublicKey().toSuiAddress();
      setWalletAddress(address);
      setPasskeyInstance(passkey);
      console.log("Wallet created with address:", address);
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
    setSignLoading(true);
    const bytes = fromBase64(txBytes);
    const sig = await passkeyInstance.signTransaction(bytes);
    setSignature(sig.signature);
    setSignLoading(false);
  };

  const fetchBalance = async () => {
    if (!walletAddress) return;
    const balance = await client.getBalance({
      owner: walletAddress,
    });
    setBalance(balance.totalBalance);
  };

  const requestFaucet = async () => {
    if (!walletAddress) return;

    setFaucetLoading(true);
    await requestSuiFromFaucetV0({
      host: getFaucetHost("devnet"),
      recipient: walletAddress,
    });
    console.log("Faucet request sent");
    setFaucetLoading(false);
    await fetchBalance();
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
    setWalletLoadLoading(false);
  };

  const sendTransaction = async () => {
    if (!walletAddress || !signature) return;

    setSendLoading(true);
    const result = await client.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: signature,
      options: {
        showEffects: true,
      },
    });
    console.log(result);
    setTxDigest(result.digest);
    setSendLoading(false);
    await fetchBalance();
  };

  return (
    <div className="App">
      <h1>Passkey Wallet Example on Sui Devnet</h1>

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
      </div>

      {walletAddress && (
        <div className="wallet-info">
          <h2>Wallet Created!</h2>
          <p>Address: {walletAddress}</p>
          <p>Balance: {balance ? parseInt(balance) / 1000000000 : "0"} SUI</p>

          <Button
            onClick={requestFaucet}
            disabled={faucetLoading}
            loading={faucetLoading}
            className="faucet-button"
          >
            Request Devnet Tokens
          </Button>

          {txBytes && (
            <div className="transaction-info">
              <h3>Transaction Bytes:</h3>
              <p className="bytes">{txBytes}</p>
            </div>
          )}

          {signature && (
            <div className="transaction-info">
              <h3>Signature:</h3>
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
              Sign Transaction
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
                  href={`https://suiscan.xyz/devnet/tx/${txDigest}`}
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
