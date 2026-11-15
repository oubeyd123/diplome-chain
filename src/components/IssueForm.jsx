import { useEffect, useRef, useState } from 'react';
import { sha256Hex } from '../utils/hash';
import { uploadToIPFS, gatewayUrl } from '../utils/ipfs';
import { writeContract } from '../utils/contract';
import { genererDiplomePdf } from '../utils/pdf';
import { confirmTransaction, errorMessage } from '../utils/transactions';
import { CHAIN } from '../config';

const EMPTY = { nom: '', prenom: '', filiere: '', annee: new Date().getFullYear() };

export default function IssueForm({ onBusy = () => {}, onIssued = () => {} }) {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState('');
  const [cid, setCid] = useState('');
  const [busy, setBusy] = useState('');
  const operation = useRef(false);
  const [log, setLog] = useState(null);

  const [fileUrl, setFileUrl] = useState(null);
  useEffect(() => {
    if (!file) { setFileUrl(null); return; }
    const url = URL.createObjectURL(file); setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const formOk = form.nom.trim() && form.prenom.trim() && form.filiere.trim() && Number.isInteger(Number(form.annee)) && Number(form.annee) >= 1900 && Number(form.annee) <= 2100 && new TextEncoder().encode(form.nom.trim()).length <= 128 && new TextEncoder().encode(form.prenom.trim()).length <= 128 && new TextEncoder().encode(form.filiere.trim()).length <= 256;

  async function pick(f) {
    if (!f || busy) return;
    await run('hash', async () => {
      setFile(null); setHash(''); setCid('');
      if (f.size > 10 * 1024 * 1024 || !f.name.toLowerCase().endsWith('.pdf') || await f.slice(0, 5).text() !== '%PDF-') throw new Error('Choisissez un PDF valide de 10 Mo maximum.');
      const digest = await sha256Hex(f);
      setHash(digest); setFile(f);
    });
  }

  async function run(label, fn) {
    if (operation.current) return;
    operation.current = true;
    onBusy(true);
    setBusy(label);
    setLog(null);
    try {
      await fn();
    } catch (e) {
      setLog({ type: 'bad', text: errorMessage(e) });
    } finally {
      operation.current = false;
      onBusy(false);
      setBusy('');
    }
  }

  const upload = () =>
    run('ipfs', async () => {
      const c = await uploadToIPFS(file);
      setCid(c);
      setLog({ type: 'ok', text: 'Fichier envoyé sur IPFS.', link: gatewayUrl(c), linkLabel: 'Ouvrir sur IPFS' });
    });

  const emit = () =>
    run('chain', async () => {
      const confirmedHash = await confirmTransaction(async () => {
      const c = await writeContract();
      const tx = await c.emettreDiplome(hash, form.nom.trim(), form.prenom.trim(), form.filiere.trim(), Number(form.annee), cid);
      return tx;
      }, (status) => setLog({ ...status, link: status.hash ? `${CHAIN.explorer}/tx/${status.hash}` : undefined, linkLabel: 'Voir la transaction' }));
      onIssued();
      setLog({ type: 'ok', text: 'Diplôme enregistré sur la blockchain.', link: `${CHAIN.explorer}/tx/${confirmedHash}`, linkLabel: 'Voir la transaction' });
    });

  function reset() {
    setForm(EMPTY);
    setFile(null);
    setHash('');
    setCid('');
    setLog(null);
  }

  const step = (done) => `step${done ? ' done' : ''}`;

  return (
    <section className="panel">
      <fieldset disabled={Boolean(busy)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <p>Utilisez uniquement des données fictives : le PDF IPFS et les informations inscrites sur la blockchain sont publics. L’envoi IPFS demande une signature MetaMask sans frais.</p>
      <ol className="steps">
        <li className={step(formOk)}>
          <h2>Étudiant</h2>
          <div className="grid">
            <label>
              Nom
              <input value={form.nom} onChange={set('nom')} autoComplete="off" />
            </label>
            <label>
              Prénom
              <input value={form.prenom} onChange={set('prenom')} autoComplete="off" />
            </label>
            <label>
              Filière
              <input value={form.filiere} onChange={set('filiere')} placeholder="Licence en Informatique" />
            </label>
            <label>
              Année
              <input type="number" value={form.annee} onChange={set('annee')} />
            </label>
          </div>
        </li>

        <li className={step(file)}>
          <h2>Fichier PDF</h2>
          <div className="row">
            <label className="btn ghost">
              Importer un PDF
              <input className="visually-hidden" aria-label="Importer un PDF à émettre" type="file" accept="application/pdf,.pdf" onChange={(e) => pick(e.target.files[0])} />
            </label>
            <button className="btn ghost" disabled={!formOk} onClick={() => pick(genererDiplomePdf(form))}>
              Générer depuis le formulaire
            </button>
          </div>
          {file && (
            <dl>
              <dt>Fichier</dt>
              <dd>
                {file.name} (<a href={fileUrl} download={file.name}>télécharger</a>)
              </dd>
              <dt>Empreinte SHA-256</dt>
              <dd className="mono">{hash}</dd>
            </dl>
          )}
        </li>

        <li className={step(cid)}>
          <h2>Stockage IPFS</h2>
          <button className="btn" disabled={!file || busy} onClick={upload}>
            {busy === 'ipfs' ? 'Envoi en cours…' : 'Envoyer sur IPFS'}
          </button>
          {cid && (
            <dl>
              <dt>CID</dt>
              <dd className="mono">{cid}</dd>
            </dl>
          )}
        </li>

        <li className={step(false)}>
          <h2>Enregistrement</h2>
          <button className="btn" disabled={!cid || !formOk || busy} onClick={emit}>
            {busy === 'chain' ? 'Confirmation en cours…' : 'Émettre le diplôme'}
          </button>
          <button className="btn ghost" onClick={reset}>
            Nouveau diplôme
          </button>
        </li>
      </ol>

      </fieldset>
      {log && (
        <p className={`notice ${log.type}`} role="status">
          {log.text}{' '}
          {log.link && (
            <a href={log.link} target="_blank" rel="noreferrer">
              {log.linkLabel}
            </a>
          )}
        </p>
      )}

    </section>
  );
}
