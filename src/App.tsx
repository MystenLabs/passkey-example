// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react'
import { BrowserPasskeyProvider, BrowserPasswordProviderOptions, PasskeyKeypair } from '@mysten/sui/keypairs/passkey';
import { getFaucetHost, requestSuiFromFaucetV0 } from '@mysten/sui/faucet';
import { toBase64, fromBase64 } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [txBytes, setTxBytes] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [passkeyInstance, setPasskeyInstance] = useState<PasskeyKeypair | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const client = new SuiClient({ url: getFullnodeUrl('devnet') });

  useEffect(() => {
    fetchBalance();
  }, [walletAddress]);
  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      
      const passkey = await PasskeyKeypair.getPasskeyInstance(
        new BrowserPasskeyProvider('Sui Passkey Example',{
          rpName: 'Sui Passkey Example',
          rpId: window.location.hostname,
        } as BrowserPasswordProviderOptions)
      );

      const address = passkey.getPublicKey().toSuiAddress();
      setWalletAddress(address);
      setPasskeyInstance(passkey);
      console.log('Wallet created with address:', address);
      
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async () => {
    if (!walletAddress || !passkeyInstance) return;

    const tx = new Transaction();
    tx.setSender(walletAddress);
    tx.setGasPrice(1000);
    tx.setGasBudget(2000000);
    let bytes = await tx.build({client: client});
    const base64Bytes = toBase64(bytes);
    setTxBytes(base64Bytes);
    console.log('Transaction bytes created:', base64Bytes);
  };

  const signTransaction = async () => {
    if (!passkeyInstance || !txBytes) return;
    const bytes = fromBase64(txBytes);
    const sig = await passkeyInstance.signTransaction(bytes);
    setSignature(sig.signature);
  };

  const fetchBalance = async () => {
    if (!walletAddress) return;
    const balance = await client.getBalance({
      owner: walletAddress
    });
    setBalance(balance.totalBalance);
  };

  const requestFaucet = async () => {
    if (!walletAddress) return;

    await requestSuiFromFaucetV0({
      host: getFaucetHost('devnet'),
      recipient: walletAddress,
    });
    console.log('Faucet request sent');
    await fetchBalance();
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
    setSendLoading(false);
    setTxDigest(result.digest);
    await fetchBalance();
  };

  return (
    <div className="App">
      <h1>Passkey Wallet Example on Sui Devnet</h1>
      <button 
        onClick={handleCreateWallet}
        disabled={loading}
        className="wallet-button"
      >
        {loading ? 'Creating...' : 'Create Passkey Wallet'}
      </button>

      {walletAddress && (
        <div className="wallet-info">
          <h2>Wallet Created!</h2>
          <p>Address: {walletAddress}</p>
          <p>Balance: {balance ? parseInt(balance) / 1000000000 : '0'} SUI</p>
          <button
            onClick={requestFaucet}
            className="faucet-button"
          > Request Devnet Tokens
          </button>

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
            <button
              onClick={createTransaction}
              className="transaction-button"
            >
              Create Transaction
            </button>

            <button
              onClick={signTransaction}
              className="sign-button"
            >
              Sign Transaction
            </button>

            <button
              onClick={sendTransaction}
              disabled={sendLoading || !txBytes}
              className="send-button"
            >
              {sendLoading ? 'Sending...' : 'Send Transaction'}
            </button>
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
        </div>
      )}
    </div>
  );
};

export default App; 