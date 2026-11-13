import { useState } from 'react';
import Header from './components/Header';
import Rosette from './components/Rosette';
import VerifyPanel from './components/VerifyPanel';
import AdminPanel from './components/AdminPanel';
import { useWallet } from './hooks/useWallet';
import { CONTRACT_ADDRESS, CHAIN } from './config';

export default function App() {
  const wallet = useWallet();
  const [tab, setTab] = useState('verify');
  const [adminBusy, setAdminBusy] = useState(false);

  return (
    <>
      <Header wallet={wallet} />
      <main className="wrap">
        <section className="hero">
          <div>
            <h1>Déposez un diplôme. La blockchain dit s’il est authentique.</h1>
            <p className="lead">
              Chaque diplôme émis par l’université est enregistré sous forme d’empreinte numérique. Le fichier est
              analysé dans votre navigateur et n’est envoyé nulle part.
            </p>
          </div>
          <Rosette />
        </section>

        {!CONTRACT_ADDRESS && (
          <p className="notice warn" role="alert">
            Adresse du contrat absente. Copiez <code>.env.example</code> vers <code>.env</code> et renseignez
            <code> VITE_CONTRACT_ADDRESS</code>.
          </p>
        )}
        {wallet.error && (
          <p className="notice bad" role="alert">
            {wallet.error}
          </p>
        )}

        <div className="tabs" role="tablist">
          <button role="tab" disabled={adminBusy} aria-selected={tab === 'verify'} onClick={() => setTab('verify')}>
            Vérifier un diplôme
          </button>
          <button role="tab" disabled={adminBusy} aria-selected={tab === 'admin'} onClick={() => setTab('admin')}>
            Espace université
          </button>
        </div>

        {tab === 'verify' ? <VerifyPanel /> : <AdminPanel wallet={wallet} onBusy={setAdminBusy} />}
      </main>
      <footer className="wrap foot">Réseau de test : {CHAIN.name}. Les diplômes enregistrés ici n’ont pas de valeur légale.</footer>
    </>
  );
}
