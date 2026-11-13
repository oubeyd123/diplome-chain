import { BrowserProvider } from 'ethers';
import { sha256Hex } from './hash';
export const gatewayUrl = (cid) => `https://ipfs.io/ipfs/${encodeURIComponent(cid)}`;
async function jsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Échec du service d’envoi (${response.status}).`);
  return data;
}
export async function uploadToIPFS(file) {
  const hash = await sha256Hex(file);
  const challenge = await jsonResponse(await fetch('/api/upload-challenge', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }),
  }));
  const signer = await new BrowserProvider(window.ethereum).getSigner();
  const signature = await signer.signMessage(challenge.message);
  const body = new FormData();
  body.append('file', file, file.name);
  const result = await jsonResponse(await fetch('/api/upload', {
    method: 'POST', headers: { 'x-upload-nonce': challenge.nonce, 'x-upload-signature': signature }, body,
  }));
  return result.cid;
}
