import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import VerifyBox from '../components/VerifyBox';
const labels = { valid: 'Authentique', revoked: 'Révoqué', unknown: 'Aucune correspondance' };
function readHistory(key) { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function RecruiterSession({ user, logout }) {
  const key = `diplome-chain:history:${user.id}`;
  const [history, setHistory] = useState(() => readHistory(key)); const [error, setError] = useState('');
  function remember(entry) {
    const next = [{ ...entry, id: crypto.randomUUID() }, ...readHistory(key)].slice(0, 100);
    setHistory(next);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { setError('Historique visible pour cette session uniquement : stockage du navigateur indisponible.'); }
  }
  return <><div className="page-heading"><div><p className="eyebrow">{user.company}</p><h1>Vérifier un diplôme</h1><p>{user.email} · Aucun portefeuille requis.</p></div><button className="btn ghost" onClick={logout}>Se déconnecter</button></div>
    <VerifyBox onVerified={remember} />
    <section className="panel"><h2>Historique de mes vérifications</h2><p>Les 100 dernières vérifications de ce compte, sur ce navigateur.</p>
      {error && <p role="alert">{error}</p>}
      {!history.length ? <p>Aucune vérification pour le moment.</p> : <ul className="history-list">{history.map(entry => <li key={entry.id}><strong>{entry.fileName}</strong><span>{labels[entry.result]}</span><time dateTime={entry.time}>{new Date(entry.time).toLocaleString('fr-FR')}</time></li>)}</ul>}
    </section></>;
}
export default function RecruiterVerify() { const { currentUser, logout } = useAuth(); return <RecruiterSession key={currentUser.id} user={currentUser} logout={logout} />; }
