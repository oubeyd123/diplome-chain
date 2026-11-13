import { useRef, useState } from 'react';
import { sha256Hex } from '../utils/hash';
import { readContract } from '../utils/contract';
import { gatewayUrl } from '../utils/ipfs';

const fmtDate = (ts) => new Date(Number(ts) * 1000).toLocaleDateString('fr-FR', { dateStyle: 'long' });

const VERDICT = {
  valid: { cls: 'ok', title: 'Diplôme authentique', text: 'Ce fichier correspond exactement à un diplôme émis par l’université.' },
  revoked: { cls: 'bad', title: 'Diplôme révoqué', text: 'Ce diplôme a bien été émis, puis annulé par l’université. Il n’est plus valide.' },
  unknown: {
    cls: 'bad',
    title: 'Aucune correspondance',
    text: 'Ce fichier n’est pas enregistré. Il n’a jamais été émis par l’université, ou il a été modifié, même d’un seul octet.',
  },
};

export default function VerifyPanel() {
  const [res, setRes] = useState({ status: 'idle' });
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const requestId = useRef(0);

  async function handleFile(file) {
    if (!file) return;
    const id = ++requestId.current;
    setRes({ status: 'loading', fileName: file.name });
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('10 Mo maximum.');
      if (!file.name.toLowerCase().endsWith('.pdf')) throw new Error('Déposez un fichier PDF.');
      const hash = await sha256Hex(file);
      const d = await readContract().verifierDiplome(hash);
      const status = !d.existe ? 'unknown' : d.valide ? 'valid' : 'revoked';
      if (id !== requestId.current) return;
      setRes({ status, hash, fileName: file.name, d });
    } catch (e) {
      if (id !== requestId.current) return;
      setRes({ status: 'error', message: e.shortMessage || e.message });
    }
  }

  const v = VERDICT[res.status];

  return (
    <section className="panel">
      <div
        className={`drop${over ? ' over' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => input.current.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => handleFile(e.target.files[0])} />
        <strong>{res.status === 'loading' ? `Vérification de ${res.fileName}…` : 'Glissez le diplôme PDF ici'}</strong>
        <span>ou cliquez pour choisir un fichier. Aucun envoi : l’empreinte est calculée sur votre appareil.</span>
      </div>

      {res.status === 'error' && (
        <p className="notice bad" role="alert">
          {res.message}
        </p>
      )}

      {v && (
        <article className="result" aria-live="polite">
          <div className={`stamp ${v.cls}`}>{v.title}</div>
          <p className="verdict">{v.text}</p>

          {res.d?.existe && (
            <dl>
              <dt>Étudiant</dt>
              <dd>
                {res.d.prenomEtudiant} {res.d.nomEtudiant}
              </dd>
              <dt>Filière</dt>
              <dd>{res.d.filiere}</dd>
              <dt>Année</dt>
              <dd>{Number(res.d.annee)}</dd>
              <dt>Émis le</dt>
              <dd>{fmtDate(res.d.date)}</dd>
              <dt>Copie IPFS</dt>
              <dd>
                <a href={gatewayUrl(res.d.cid)} target="_blank" rel="noreferrer">
                  Ouvrir le diplôme original
                </a>
              </dd>
            </dl>
          )}
          <dl>
            <dt>Fichier</dt>
            <dd>{res.fileName}</dd>
            <dt>Empreinte SHA-256</dt>
            <dd className="mono">{res.hash}</dd>
          </dl>
        </article>
      )}
    </section>
  );
}
