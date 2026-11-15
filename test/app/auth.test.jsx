import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, act, cleanup, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { webcrypto } from 'node:crypto';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { DEMO_RECRUITER, DEMO_UNIVERSITY } from '../../src/context/demoAccounts';
let auth;
function Probe() { auth = useAuth(); return <span>{auth.currentUser?.email || 'anonymous'}</span>; }
beforeEach(() => { localStorage.clear(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('rejects recruiter credentials for the university login and never grants admin through signup', async () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => auth.login({ ...DEMO_RECRUITER, role: 'recruiter' }));
  await expect(auth.login({ ...DEMO_RECRUITER, role: 'university' })).rejects.toThrow('accès');
  expect(auth.currentUser.role).toBe('recruiter');
  await act(async () => auth.register({ email: 'new@demo.test', password: 'demo-password', company: 'New Co', role: 'university' }));
  expect(auth.currentUser.role).toBe('recruiter');
  act(() => auth.logout());
  await act(async () => auth.login({ ...DEMO_UNIVERSITY, role: 'university' }));
  expect(auth.currentUser.role).toBe('university');
  const adminRecord = JSON.parse(localStorage.getItem('diplome-chain:users')).find(u => u.email === DEMO_UNIVERSITY.email);
  expect(adminRecord).not.toHaveProperty('password');
  expect(adminRecord.passwordHash).toMatch(/^[a-f0-9]{64}$/);
});
it('guards the university page by role and removes access on logout', async () => {
  const view = render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => auth.login(DEMO_RECRUITER));
  view.rerender(<AuthProvider><Probe /><MemoryRouter initialEntries={['/universite']}><Routes>
    <Route element={<ProtectedRoute role="university" />}><Route path="/universite" element={<p>Admin content</p>} /></Route>
    <Route path="/universite/connexion" element={<p>University login</p>} />
  </Routes></MemoryRouter></AuthProvider>);
  expect(screen.getByText('University login')).toBeTruthy();
  expect(screen.queryByText('Admin content')).toBeNull();
  view.unmount();
  const adminView = render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => auth.login(DEMO_UNIVERSITY));
  adminView.rerender(<AuthProvider><Probe /><MemoryRouter initialEntries={['/universite']}><Routes>
    <Route element={<ProtectedRoute role="university" />}><Route path="/universite" element={<p>Admin content</p>} /></Route>
    <Route path="/universite/connexion" element={<p>University login</p>} />
  </Routes></MemoryRouter></AuthProvider>);
  expect(screen.getByText('Admin content')).toBeTruthy();
  act(() => auth.logout());
  expect(screen.queryByText('Admin content')).toBeNull();
  expect(screen.getByText('University login')).toBeTruthy();
});
it('preserves legacy accounts and treats old sessions as recruiters', async () => {
  const legacy = { id: 'existing-id', email: 'old@demo.test', company: 'Existing company' };
  localStorage.setItem('diplome-chain:users', JSON.stringify([legacy]));
  localStorage.setItem('diplome-chain:session', JSON.stringify(legacy.id));
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(auth.currentUser.role).toBe('recruiter');
  await act(async () => auth.login(DEMO_RECRUITER));
  expect(JSON.parse(localStorage.getItem('diplome-chain:users')).find(u => u.id === legacy.id)).toEqual(legacy);
});
it('redirects unauthenticated recruiters to login', () => {
  render(<AuthProvider><MemoryRouter initialEntries={['/recruteur/verifier']}><Routes>
    <Route path="/recruteur/connexion" element={<p>Login required</p>} />
    <Route element={<ProtectedRoute />}><Route path="/recruteur/verifier" element={<p>Private verification</p>} /></Route>
  </Routes></MemoryRouter></AuthProvider>);
  expect(screen.getByText('Login required')).toBeTruthy();
  expect(screen.queryByText('Private verification')).toBeNull();
});
it('salts passwords per account, rejects bad credentials, restores sessions and logs out', async () => {
  let view = render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => auth.register({ email: ' Alice@demo.test ', password: 'demo-password', company: 'Alice Co' }));
  expect(auth.currentUser.email).toBe('alice@demo.test');
  const id = auth.currentUser.id;
  view.unmount(); view = render(<AuthProvider><Probe /></AuthProvider>);
  expect(auth.currentUser.id).toBe(id);
  act(() => auth.logout());
  expect(auth.currentUser).toBeNull();
  await expect(auth.login({ email: 'alice@demo.test', password: 'wrong' })).rejects.toThrow('incorrect');
  await act(async () => auth.login({ email: 'alice@demo.test', password: 'demo-password' }));
  expect(auth.currentUser.id).toBe(id);
  act(() => auth.logout());
  await act(async () => auth.register({ email: 'bob@demo.test', password: 'demo-password', company: 'Bob Co' }));
  const stored = JSON.parse(localStorage.getItem('diplome-chain:users')).filter(u => ['alice@demo.test', 'bob@demo.test'].includes(u.email));
  expect(stored[0].salt).not.toBe(stored[1].salt);
  expect(stored[0].passwordHash).not.toBe(stored[1].passwordHash);
  expect(localStorage.getItem('diplome-chain:users')).not.toContain('demo-password');
  expect(auth.currentUser).not.toHaveProperty('passwordHash');
  await expect(auth.register({ email: 'ALICE@demo.test', password: 'demo-password', company: 'Duplicate' })).rejects.toThrow('existe');
});
it('provides a default recruiter without overwriting existing users or storing plaintext passwords', async () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => auth.login(DEMO_RECRUITER));
  const id = auth.currentUser.id;
  expect(auth.currentUser.company).toBe('Entreprise Démo');
  expect(auth.currentUser.role).toBe('recruiter');
  const record = JSON.parse(localStorage.getItem('diplome-chain:users')).find(u => u.id === id);
  expect(record).not.toHaveProperty('password');
  expect(record.passwordHash).toMatch(/^[a-f0-9]{64}$/);
  act(() => auth.logout());
  await act(async () => auth.login(DEMO_RECRUITER));
  expect(auth.currentUser.id).toBe(id);
  await expect(auth.register({ ...DEMO_RECRUITER, company: 'Other company' })).rejects.toThrow('email valide');
});
it('migrates the previous demo credentials while preserving recruiter history and account IDs', async () => {
  const previous = [
    { id: 'saved-recruiter', email: 'recruteur@demo.test', role: 'recruiter', company: 'Entreprise Démo', salt: 'old-salt', passwordHash: 'old-hash' },
    { id: 'saved-admin', email: 'universite@demo.test', role: 'university', company: 'Université de Sousse', salt: 'old-admin-salt', passwordHash: 'old-hash' },
  ];
  localStorage.setItem('diplome-chain:users', JSON.stringify(previous));
  localStorage.setItem('diplome-chain:history:saved-recruiter', JSON.stringify([{ fileName: 'existing.pdf' }]));
  render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => auth.login({ email: 'rec', password: 'rec', role: 'recruiter' }));
  expect(auth.currentUser.id).toBe('saved-recruiter');
  expect(JSON.parse(localStorage.getItem('diplome-chain:history:saved-recruiter'))).toEqual([{ fileName: 'existing.pdf' }]);
  act(() => auth.logout());
  await act(async () => auth.login({ email: 'admin', password: 'admin', role: 'university' }));
  expect(auth.currentUser.id).toBe('saved-admin');
  await expect(auth.login({ email: 'rec', password: 'wrong' })).rejects.toThrow('incorrect');
});
