import { useRef, useState } from 'react';
import { isHash, sha256Hex } from '../utils/hash';
import { writeContract } from '../utils/contract';
import { confirmTransaction, errorMessage } from '../utils/transactions';
import { CHAIN } from '../config';
export default function RevokeBox({ initialHash = '', onRevoked = () => {}, onBusy = () => {} }) {
  const [hash, setHash] = useState(initialHash); const [busy, setBusy] = useState(false); const [log, setLog] = useState(null); const running = useRef(false);
  async function run(fn) {
    if (running.current) return; running.current = true; setBusy(true); onBusy(true); setLog(null);
    try { await fn(); } catch (e) { setLog({ type: 'bad', text: errorMessage(e) }); }
    finally { running.current = false; setBusy(false); onBusy(false); }
  }
  function pick(file) { if (file) run(async () => {
    if (file.size > 10 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Choisissez un PDF de 10 Mo maximum.');
    setHash(await sha256Hex(file));
  }); }
  function revoke() { run(async () => {
    const txHash = await confirmTransaction(async () => (await writeContract()).revoquerDiplome(hash.trim()), setLog);
    setLog({ type: 'ok', text: 'Diplôme révoqué.', hash: txHash }); onRevoked();
  }); }
  return <section className="panel"><h2>Révoquer un diplôme</h2><p>Collez son empreinte ou choisissez le PDF. La révocation est définitive.</p>
    <fieldset className="form-fields" disabled={busy}>
      <label>Empreinte SHA-256<input className="mono" value={hash} onChange={e => setHash(e.target.value)} placeholder="0x…" /></label>
      <label>Ou choisir le PDF<input type="file" accept="application/pdf,.pdf" onChange={e => pick(e.target.files[0])} /></label>
      <button className="btn danger" disabled={!isHash(hash.trim()) || busy} onClick={revoke}>{busy ? 'Opération en cours…' : 'Révoquer'}</button>
    </fieldset>
    {log && <p className={`notice ${log.type}`} role="status">{log.text} {log.hash && <a href={`${CHAIN.explorer}/tx/${log.hash}`} target="_blank" rel="noreferrer">Voir la transaction</a>}</p>}
  </section>;
}
