// src/hooks/useBlockchain.js
import { useState, useEffect } from 'react';
import { initBlockchain, connectWallet, mintBadge, getGasPrice } from '../blockchain';

export const useBlockchain = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [gasPrice, setGasPrice] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { success } = await initBlockchain();
      if (success && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
        }
      }
      const price = await getGasPrice();
      setGasPrice(parseFloat(price).toFixed(2));
    };
    init();

    // Écouter les changements de compte
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setWalletAddress('');
        }
      });
    }
  }, []);

  const connect = async () => {
    setLoading(true);
    const result = await connectWallet();
    if (result.success) {
      setIsConnected(true);
      setWalletAddress(result.address);
      setBalance(result.balance);
    }
    setLoading(false);
    return result;
  };

  const mint = async (toAddress, badgeName, badgeLevel, metadataURI) => {
    setLoading(true);
    const result = await mintBadge(toAddress, badgeName, badgeLevel, metadataURI);
    setLoading(false);
    return result;
  };

  return { isConnected, walletAddress, balance, gasPrice, loading, connect, mint };
};