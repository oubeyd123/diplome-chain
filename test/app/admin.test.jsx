import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AdminPanel from '../../src/components/AdminPanel';
vi.mock('../../src/utils/contract', () => ({ writeContract: vi.fn() }));
afterEach(cleanup);
const wallet = { hasWallet: true, account: '0x1111111111111111111111111111111111111111', isOwner: false, wrongChain: false, refreshOwner: vi.fn() };
describe('university gates', () => {
  it('shows loading rather than alleging a wrong owner', () => {
    render(<AdminPanel wallet={{ ...wallet, ownerLoading: true }} />);
    expect(screen.getByRole('heading').textContent).toContain('en cours');
    expect(screen.queryByText(/Ce portefeuille/)).toBeNull();
  });
  it('shows contract error and retry without an empty owner address', () => {
    render(<AdminPanel wallet={{ ...wallet, ownerError: 'Aucun contrat' }} />);
    expect(screen.getByRole('alert').textContent).toBe('Aucun contrat');
    expect(screen.getByRole('button', {name: 'Réessayer'})).toBeTruthy();
    expect(screen.queryByText(/Ce portefeuille/)).toBeNull();
  });
  it('shows wallet mismatch only after owner is known', () => {
    render(<AdminPanel wallet={{ ...wallet, owner: '0x2222222222222222222222222222222222222222' }} />);
    expect(screen.getByRole('heading').textContent).toContain('Ce portefeuille');
  });
  it('requests the correct network first', () => {
    render(<AdminPanel wallet={{ ...wallet, wrongChain: true }} />);
    expect(screen.getByRole('button', {name: 'Changer de réseau'})).toBeTruthy();
  });
});
