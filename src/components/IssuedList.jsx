import { useEffect, useState } from 'react';
import { readContract } from '../utils/contract';
import { errorMessage } from '../utils/transactions';
import { loadIssued } from '../utils/events';
import { CHAIN } from '../config';
export default function IssuedList({ revision, onRevoke, busy }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [block, setBlock] = useState(null); const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false; setLoading(true); setError(''); setBlock(null);
    (async () => {
      try {
        const result = await loadIssued(readContract(), Number(import.meta.env.VITE_DEPLOY_BLOCK || 0), b => { if (!cancelled) setBlock(b); }, () => cancelled);
        if (!cancelled) setRows(result);
      } catch (e) { if (!cancelled) setError(errorMessage(e)); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [revision, retry]);
  return <section className="panel issued-list"><div className="page-heading"><h2>Diplômes émis</h2><button className="btn ghost" disabled={loading || busy} onClick={() => setRetry(v => v + 1)}>Actualiser</button></div>
    {loading ? <p role="status">Lecture des événements… {block !== null && `Bloc ${block}`}</p> : error ? <p className="notice bad" role="alert">{error} Vérifiez le RPC et VITE_DEPLOY_BLOCK, puis actualisez.</p> : !rows.length ? <p>Aucun diplôme émis depuis le bloc de déploiement configuré.</p> : <ul className="diploma-list">{rows.map(d => <li key={d.hash}>
      <h3>{d.name}</h3><dl><dt>Filière</dt><dd>{d.filiere}</dd><dt>Année</dt><dd>{d.year}</dd><dt>émis le</dt><dd>{new Date(d.date * 1000).toLocaleDateString('fr-FR')}</dd><dt>Statut</dt><dd>{d.valid ? 'Authentique' : 'Révoqué'}</dd><dt>Empreinte</dt><dd className="mono">{d.hash}</dd></dl>
      <div className="row"><a href={`${CHAIN.explorer}/tx/${d.tx}`} target="_blank" rel="noreferrer">Transaction d’émission</a>{d.valid && <button className="btn danger" disabled={busy} onClick={() => onRevoke(d.hash)}>Révoquer le diplôme de {d.name}</button>}</div>
    </li>)}</ul>}
  </section>;
}
