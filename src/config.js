export const CHAINS = {
  11155111: {
    id: 11155111,
    hex: '0xaa36a7',
    name: 'Sepolia',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
    currency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  },
  80002: {
    id: 80002,
    hex: '0x13882',
    name: 'Polygon Amoy',
    rpc: 'https://rpc-amoy.polygon.technology',
    explorer: 'https://amoy.polygonscan.com',
    currency: { name: 'POL', symbol: 'POL', decimals: 18 },
  },
};

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 11155111);
export const CHAIN = CHAINS[CHAIN_ID] || { name: `Réseau non pris en charge (${CHAIN_ID})` };
export const CONFIG_ERROR = !CHAINS[CHAIN_ID] ? 'Réseau non pris en charge : utilisez Sepolia ou Polygon Amoy.' : '';
export const RPC_URL = import.meta.env.VITE_RPC_URL || CHAIN.rpc;
