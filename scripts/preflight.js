import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { Contract, JsonRpcProvider, isAddress } from 'ethers';
const address = process.env.VITE_CONTRACT_ADDRESS;
const id = Number(process.env.VITE_CHAIN_ID || 11155111);
const rpcs = { 11155111: 'https://ethereum-sepolia-rpc.publicnode.com', 80002: 'https://rpc-amoy.polygon.technology' };
const rpc = process.env.VITE_RPC_URL || rpcs[id];
let provider;
try {
  if (!isAddress(address || '') || !rpcs[id]) throw new Error('Invalid contract address or unsupported chain.');
  provider = new JsonRpcProvider(rpc);
  if (Number((await provider.getNetwork()).chainId) !== id) throw new Error('RPC chain mismatch.');
  const code = await provider.getCode(address);
  if (code === '0x') throw new Error('No contract deployed at the configured address.');
  const owner = await new Contract(address, ['function owner() view returns (address)'], provider).owner();
  console.log(JSON.stringify({ chainId: id, contract: address, owner }, null, 2));
  const artifactDir = resolve('artifacts/contracts/DiplomaRegistry.sol');
  const dbg = JSON.parse(await readFile(resolve(artifactDir,'DiplomaRegistry.dbg.json'),'utf8'));
  const build = JSON.parse(await readFile(resolve(artifactDir,dbg.buildInfo),'utf8'));
  const compiled = build.output.contracts['contracts/DiplomaRegistry.sol'].DiplomaRegistry.evm.deployedBytecode;
  const mask = (hex) => {
    let value = hex.replace(/^0x/, '').toLowerCase();
    for (const refs of Object.values(compiled.immutableReferences)) for (const {start,length} of refs)
      value = value.slice(0,start*2) + '0'.repeat(length*2) + value.slice((start+length)*2);
    return value;
  };
  if (mask(code) !== mask(compiled.object)) throw new Error('Deployed bytecode differs from this audited source/settings. Redeploy or investigate before the demonstration.');
  console.log('PASS: deployed runtime bytecode matches this source (immutable owner masked).');
  const jwt = process.env.PINATA_JWT?.trim();
  if (!jwt || jwt.split('.').length !== 3) throw new Error('Set the complete server-only PINATA_JWT.');
  const auth = await fetch('https://api.pinata.cloud/data/testAuthentication', {
    headers: { Authorization: `Bearer ${jwt}` }, signal: AbortSignal.timeout(20000),
  });
  if (!auth.ok) throw new Error(`Pinata authentication failed (${auth.status}).`);
  console.log('PASS: Pinata credentials accepted. Upload permission and full wallet flow still require a live demo.');
} catch (error) {
  console.error('FAIL:', error.shortMessage || error.message);
  process.exitCode = 1;
} finally { provider?.destroy(); }
