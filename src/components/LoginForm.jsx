import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_RECRUITER } from '../context/demoAccounts';
export default function LoginForm({ role = 'recruiter' }) {
  const auth = useAuth(); const navigate = useNavigate();
  const university = role === 'university';
  const destination = university ? '/universite' : '/recruteur/verifier';
  const [signup, setSignup] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  if (auth.currentUser && (auth.currentUser.role || 'recruiter') === role) return <Navigate to={destination} replace />;
  async function submit(e) {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try { await (signup && !university ? auth.register(values) : auth.login({ ...values, role })); navigate(destination, { replace: true }); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="panel auth-panel"><p className="eyebrow">{university ? 'Administration de l’université' : 'Espace recruteur'}</p><h1>{signup ? 'Créer un compte' : university ? 'Connexion université' : 'Connexion'}</h1>
    <p>{university ? 'Connectez-vous avec le compte administrateur. Le portefeuille propriétaire sera ensuite nécessaire pour les opérations sur le registre.' : 'Vérifiez un diplôme sans MetaMask et retrouvez vos vérifications.'}</p>
    <p className="notice warn">Compte de démonstration stocké dans ce navigateur. Ce système ne fournit aucune sécurité réelle. Utilisez un mot de passe fictif.</p>
    {!university && <p>Compte recruteur de démonstration : <strong>{DEMO_RECRUITER.email}</strong> · Mot de passe : <code>{DEMO_RECRUITER.password}</code></p>}
    <form onSubmit={submit}><fieldset disabled={busy} className="form-fields">
      {signup && !university && <label>Nom de l’entreprise<input name="company" required maxLength={160} autoComplete="organization" /></label>}
      <label>{signup ? 'Email' : 'Identifiant ou email'}<input name="email" type={signup ? 'email' : 'text'} required autoComplete="username" autoCapitalize="none" spellCheck={false} /></label>
      <label>Mot de passe<input name="password" type="password" required minLength={signup ? 8 : undefined} autoComplete={signup ? 'new-password' : 'current-password'} /></label>
      <button className="btn">{busy ? 'Veuillez patienter…' : signup ? 'Créer mon compte' : 'Se connecter'}</button>
    </fieldset></form>
    {error && <p className="notice bad" role="alert">{error}</p>}
    {!university && <button className="btn ghost" disabled={busy} onClick={() => { setSignup(!signup); setError(''); }}>{signup ? 'J’ai déjà un compte' : 'Créer un compte recruteur'}</button>}
    {university && <p>L’accès administrateur est attribué par l’établissement. Aucune inscription publique n’est disponible.</p>}
  </section>;
}
