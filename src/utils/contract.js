import { BrowserProvider, Contract, JsonRpcProvider, isAddress } from 'ethers';
import { ABI } from '../abi';
import { CONTRACT_ADDRESS, CHAIN_ID, RPC_URL, CONFIG_ERROR } from '../config';
let reader;
export function readContract() {
  if (CONFIG_ERROR) throw new Error(CONFIG_ERROR);
  if (!isAddress(CONTRACT_ADDRESS || '')) throw new Error('Adresse du contrat absente ou invalide.');
  reader ||= new Contract(CONTRACT_ADDRESS, ABI, new JsonRpcProvider(RPC_URL, CHAIN_ID));
  return reader;
}
export async function loadOwner() {
  const contract = readContract();
  const provider = contract.runner;
  if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID) throw new Error('Le RPC ne correspond pas au réseau configuré.');
  if (await provider.getCode(CONTRACT_ADDRESS) === '0x') throw new Error('Aucun contrat à cette adresse sur le réseau choisi. Vérifiez le déploiement.');
  return contract.owner();
}
export async function writeContract() {
  if (!window.ethereum) throw new Error('MetaMask est nécessaire.');
  const provider = new BrowserProvider(window.ethereum);
  if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID) throw new Error('Changez de réseau dans MetaMask.');
  const signer = await provider.getSigner();
  const owner = await loadOwner();
  if ((await signer.getAddress()).toLowerCase() !== owner.toLowerCase()) throw new Error('Connectez le portefeuille propriétaire du contrat.');
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
}
