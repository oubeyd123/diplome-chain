import { NavLink } from 'react-router-dom';
import { shortAddr } from '../utils/hash';
export default function Navbar({ wallet }) {
  return <header className="topbar"><div className="wrap bar">
    <NavLink className="brand" to="/">◈ DiplômeChain</NavLink>
    <nav aria-label="Navigation principale">
      <NavLink end to="/">Accueil</NavLink>
      <NavLink to="/recruteur/verifier">Vérifier un diplôme</NavLink>
      <NavLink to="/universite">Université</NavLink>
    </nav>
    {wallet && <span className="chip">{wallet.account ? `${shortAddr(wallet.account)} · ${wallet.chainName}` : 'Portefeuille déconnecté'}</span>}
  </div></header>;
}
