import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_RECRUITER, DEMO_UNIVERSITY } from './demoAccounts';

// DEMO ONLY: localStorage and a salted SHA-256 password are NOT real security.
// Replace this adapter with Firebase Auth or Supabase before production.
const USERS = 'diplome-chain:users';
const SESSION = 'diplome-chain:session';
const AuthContext = createContext(null);
const publicUser = ({ id, email, company, role = 'recruiter' }) => ({ id, email, company, role });
function users() {
  try { const value = JSON.parse(localStorage.getItem(USERS) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function sessionUser() {
  try { const id = JSON.parse(localStorage.getItem(SESSION)); const user = users().find(u => u.id === id); return user ? publicUser(user) : null; }
  catch { return null; }
}
async function digest(password, salt) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
async function makeUser({ email, password, company, role = 'recruiter' }) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  return { id: crypto.randomUUID(), email, company, role, salt, passwordHash: await digest(password, salt) };
}
let provisioning;
async function ensureDemoAccounts() {
  // Lazy provisioning also works for existing installations, without replacing accounts/history.
  if (!provisioning) {
    provisioning = (async () => {
      for (const account of [DEMO_RECRUITER, DEMO_UNIVERSITY]) {
        if (users().some(u => u.email === account.email)) continue;
        const previous = users().find(u => u.email === account.legacyEmail && (u.role || 'recruiter') === account.role);
        const user = await makeUser(account);
        if (previous) user.id = previous.id;
        const all = users();
        if (!all.some(u => u.email === account.email)) {
          const updated = previous && all.some(u => u.id === previous.id)
            ? all.map(u => u.id === previous.id ? user : u)
            : [...all, user];
          localStorage.setItem(USERS, JSON.stringify(updated));
        }
      }
    })().finally(() => { provisioning = null; });
  }
  await provisioning;
}
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(sessionUser);
  useEffect(() => {
    const sync = () => setCurrentUser(sessionUser());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function start(user) {
    localStorage.setItem(SESSION, JSON.stringify(user.id));
    setCurrentUser(publicUser(user));
  }
  async function register({ email, password, company }) {
    email = email.trim().toLowerCase(); company = company.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !company || password.length < 8) throw new Error('Renseignez une entreprise, un email valide et un mot de passe de 8 caractères minimum.');
    await ensureDemoAccounts();
    const user = await makeUser({ email, password, company });
    const all = users();
    if (all.some(u => u.email === email)) throw new Error('Un compte existe déjà pour cet email.');
    localStorage.setItem(USERS, JSON.stringify([...all, user]));
    start(user);
  }
  async function login({ email, password, role }) {
    await ensureDemoAccounts();
    const user = users().find(u => u.email === email.trim().toLowerCase());
    if (!user || await digest(password, user.salt) !== user.passwordHash) throw new Error('Identifiant ou mot de passe incorrect.');
    if (role && (user.role || 'recruiter') !== role) throw new Error('Ce compte n’a pas accès à cet espace.');
    start(user);
  }
  function logout() { localStorage.removeItem(SESSION); setCurrentUser(null); }
  return <AuthContext.Provider value={{ register, login, logout, currentUser }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
