import { describe, it, expect, vi } from 'vitest';
import { confirmTransaction, errorMessage } from '../../src/utils/transactions';
describe('transaction lifecycle', () => {
  it('shows signing, then pending hash, and waits for a successful receipt', async () => {
    const update = vi.fn(); const wait = vi.fn().mockResolvedValue({ status: 1, hash: 'confirmed' });
    expect(await confirmTransaction(async () => ({ hash: 'submitted', wait }), update)).toBe('confirmed');
    expect(update.mock.calls[0][0].text).toContain('MetaMask');
    expect(update.mock.calls[1][0].hash).toBe('submitted');
    expect(wait).toHaveBeenCalledWith(1);
  });
  it('propagates signature rejection', async () => {
    await expect(confirmTransaction(async () => { throw { code: 4001 }; }, vi.fn())).rejects.toEqual({ code: 4001 });
    expect(errorMessage({ code: 4001 })).toContain('refusée');
    expect(errorMessage({ code: 'ACTION_REJECTED' })).toContain('refusée');
  });
  it('reports insufficient funds', () => expect(errorMessage({ code: 'INSUFFICIENT_FUNDS' })).toContain('Solde insuffisant'));
  it('rejects a failed receipt', async () => {
    await expect(confirmTransaction(async () => ({ hash: 'tx', wait: async () => ({ status: 0 }) }), vi.fn())).rejects.toThrow('échoué');
  });
  it('accepts a successful speed-up using its actual receipt hash', async () => {
    const tx = { hash: 'old', wait: async () => { throw { code: 'TRANSACTION_REPLACED', cancelled: false, receipt: { status: 1, hash: 'new' } }; } };
    expect(await confirmTransaction(async () => tx, vi.fn())).toBe('new');
  });
  it('does not report cancellation as success', async () => {
    const tx = { hash: 'old', wait: async () => { throw { code: 'TRANSACTION_REPLACED', cancelled: true }; } };
    await expect(confirmTransaction(async () => tx, vi.fn())).rejects.toThrow('annulée');
  });
});
