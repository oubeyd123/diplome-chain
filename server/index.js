import 'dotenv/config';
import { Contract, JsonRpcProvider, isAddress } from 'ethers';
import { createApp } from './app.js';
const address = process.env.VITE_CONTRACT_ADDRESS;
const chainId = Number(process.env.VITE_CHAIN_ID || 11155111);
const rpcs = { 11155111: 'https://ethereum-sepolia-rpc.publicnode.com', 80002: 'https://rpc-amoy.polygon.technology' };
const rpc = process.env.VITE_RPC_URL || rpcs[chainId];
const jwt = process.env.PINATA_JWT?.trim();
if (!isAddress(address || '') || !rpc) throw new Error('Configure a valid contract address, chain and RPC in .env.');
if (!jwt || jwt.split('.').length !== 3) throw new Error('PINATA_JWT must contain the complete JWT (server only).');
const provider = new JsonRpcProvider(rpc);
const registry = new Contract(address, ['function owner() view returns (address)'], provider);
const app = createApp({
  origin: process.env.APP_ORIGIN || 'http://localhost:5173',
  getOwner: async () => {
    if (Number((await provider.getNetwork()).chainId) !== chainId) throw new Error('RPC network mismatch');
    if (await provider.getCode(address) === '0x') throw new Error('Contract not deployed');
    return registry.owner();
  },
  upload: async (file) => {
    const body = new FormData();
    body.append('file', new Blob([file.buffer], { type: 'application/pdf' }), 'diploma.pdf');
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST', headers: { Authorization: `Bearer ${jwt}` }, body, signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      const error = new Error('Pinata upload failed');
      error.publicMessage = response.status === 401 || response.status === 403
        ? 'Pinata refuse l’accès : vérifiez le JWT et la permission pinFileToIPFS sur le serveur.'
        : `Pinata a refusé l’envoi (${response.status}). Réessayez plus tard.`;
      throw error;
    }
    const result = await response.json();
    if (typeof result.IpfsHash !== 'string' || !/^[a-zA-Z0-9]{10,128}$/.test(result.IpfsHash)) throw new Error('Invalid CID');
    return result.IpfsHash;
  },
});
app.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => console.log('Upload API ready on localhost:' + (process.env.PORT || 3001)));
