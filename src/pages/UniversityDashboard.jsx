import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../context/AuthContext';
import { shortAddr } from '../utils/hash';
import { CHAIN } from '../config';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import IssueForm from '../components/IssueForm';
import VerifyBox from '../components/VerifyBox';
import RevokeBox from '../components/RevokeBox';
import IssuedList from '../components/IssuedList';
function Gate({ title, children }) { return <section className="panel gate"><h2>{title}</h2>{children}</section>; }
export function UniversityContent({ wallet, onBusy = () => {} }) {
  const { hasWallet, account, owner, isOwner, wrongChain, connect, switchChain, ownerLoading, ownerError, refreshOwner } = wallet;
  const [tab, setTab] = useState('issue'); const [busy, setBusy] = useState(false); const [revision, setRevision] = useState(0); const [revokeHash, setRevokeHash] = useState('');
  function activity(value) { setBusy(value); onBusy(value); }
  if (!hasWallet) return <Gate title="MetaMask est nécessaire"><p>L’espace université signe les transactions avec MetaMask. Installez l’extension, puis rechargez la page.</p></Gate>;
  if (!account) return <Gate title="Connectez le portefeuille de l’université"><button className="btn" onClick={connect}>Connecter MetaMask</button></Gate>;
  if (wrongChain) return <Gate title={`Passez sur le réseau ${CHAIN.name}`}><button className="btn" onClick={switchChain}>Changer de réseau</button></Gate>;
  if (ownerLoading) return <Gate title="Lecture du propriétaire en cours…" />;
  if (ownerError || !owner) return <Gate title="Impossible de vérifier le contrat"><p role="alert">{ownerError || 'Adresse du contrat absente.'}</p><button className="btn" onClick={refreshOwner}>Réessayer</button></Gate>;
  if (!isOwner) return <Gate title="Ce portefeuille n’est pas celui de l’université"><p>Seul le propriétaire du contrat ({shortAddr(owner)}) peut émettre ou révoquer des diplômes. Connecté avec {shortAddr(account)}.</p></Gate>;
  return <>
    <p className="mono wallet-details">{account} · {wallet.chainName || CHAIN.name}</p>
    <div className="tabs" role="tablist" aria-label="Actions de l’université" onKeyDown={e => {
      if (!busy && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        e.preventDefault(); const next = e.key === 'Home' ? 'issue' : e.key === 'End' ? 'manage' : tab === 'issue' ? 'manage' : 'issue';
        setTab(next); document.getElementById(`${next}-tab`)?.focus();
      }
    }}>
      <button id="issue-tab" role="tab" aria-controls="issue-panel" tabIndex={tab === 'issue' ? 0 : -1} aria-selected={tab === 'issue'} disabled={busy} onClick={() => setTab('issue')}>Émettre un diplôme</button>
      <button id="manage-tab" role="tab" aria-controls="manage-panel" tabIndex={tab === 'manage' ? 0 : -1} aria-selected={tab === 'manage'} disabled={busy} onClick={() => setTab('manage')}>Vérifier / Révoquer</button>
    </div>
    <div id="issue-panel" role="tabpanel" aria-labelledby="issue-tab" hidden={tab !== 'issue'}><IssueForm onBusy={activity} onIssued={() => setRevision(v => v + 1)} /></div>
    <div id="manage-panel" role="tabpanel" aria-labelledby="manage-tab" hidden={tab !== 'manage'}><VerifyBox /><RevokeBox key={revokeHash} initialHash={revokeHash} onBusy={activity} onRevoked={() => setRevision(v => v + 1)} /></div>
    <IssuedList revision={revision} busy={busy} onRevoke={hash => { setRevokeHash(hash); setTab('manage'); requestAnimationFrame(() => document.querySelector('#manage-panel input.mono')?.focus()); }} />
  </>;
}
export default function UniversityDashboard() {
  const wallet = useWallet();
  const { currentUser, logout } = useAuth();
  return <><Navbar wallet={wallet} /><main id="main" tabIndex={-1} className="wrap page"><div className="page-heading"><div><p className="eyebrow">Administration du registre</p><h1>Espace université</h1><p>{currentUser?.email}</p></div><button className="btn ghost" onClick={logout}>Se déconnecter</button></div>
    {wallet.error && <p className="notice bad" role="alert">{wallet.error}</p>}
    <UniversityContent key={`${wallet.account}:${wallet.chainId}`} wallet={wallet} />
  </main><Footer /></>;
}
