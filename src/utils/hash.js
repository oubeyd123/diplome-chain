// SHA-256 computed locally in the browser: the file never leaves the machine.
// Returns "0x" + 64 hex chars, which is exactly a Solidity bytes32.
export async function sha256Hex(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return '0x' + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const isHash = (v) => /^0x[0-9a-fA-F]{64}$/.test(v);
export const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
