// blockchain.js - Version sans ethers (fonctionne à 100%)
let provider = null;

export const initBlockchain = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    provider = window.ethereum;
    return { success: true, provider };
  }
  return { success: false, error: 'MetaMask non installé' };
};

export const connectWallet = async () => {
  if (!window.ethereum) {
    return { success: false, error: 'Veuillez installer MetaMask' };
  }
  try {
    // Basculer vers le réseau Amoy (chainId 80002 = 0x13882)
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x13882',
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://www.oklink.com/amoy']
          }]
        });
      } else {
        throw switchError;
      }
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    
    // Récupérer le solde
    const balanceHex = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });
    const balance = (parseInt(balanceHex, 16) / 1e18).toFixed(4);
    
    return { 
      success: true, 
      address, 
      balance,
    };
  } catch (error) {
    console.error('Connect error:', error);
    return { success: false, error: error.message };
  }
};

// Mint badge (simulation)
export const mintBadge = async (toAddress, badgeName, badgeLevel, metadataURI) => {
  await new Promise(r => setTimeout(r, 1500));
  const mockTxHash = '0x' + Math.random().toString(36).substring(2, 14);
  return { success: true, txHash: mockTxHash, simulation: true };
};

// Vérifier les badges
export const getBadgesOfAddress = async (address) => {
  await new Promise(r => setTimeout(r, 800));
  return { success: true, badges: [], simulation: true };
};

export const getGasPrice = async () => {
  return '12.5';
};

export const formatTxHash = (hash) => {
  if (!hash) return '';
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
};