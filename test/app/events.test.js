import { expect, it, vi } from 'vitest';
import { loadIssued, queryEvents } from '../../src/utils/events';
it('splits provider-limited ranges without gaps and starts at the deployment block', async () => {
  const queryFilter = vi.fn(async (_, from, to) => {
    if (to - from > 1) throw new Error('block range limit exceeded');
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  });
  expect(await queryEvents({ queryFilter }, 'issued', 123, 128)).toEqual([123, 124, 125, 126, 127, 128]);
  expect(queryFilter.mock.calls.every(([, from]) => from >= 123)).toBe(true);
});
it('combines issue and revoke events with diploma metadata at one block', async () => {
  const contract = {
    runner: { getBlockNumber: async () => 105 },
    filters: { DiplomeEmis: () => 'issued', DiplomeRevoque: () => 'revoked' },
    queryFilter: vi.fn(async filter => filter === 'issued' ? [{ args: { hashPdf: 'hash' }, transactionHash: 'tx' }] : [{ args: { hashPdf: 'hash' } }]),
    verifierDiplome: vi.fn(async () => ({ prenomEtudiant: 'Jane', nomEtudiant: 'Doe', filiere: 'CS', annee: 2026n, date: 1n, valide: true })),
  };
  expect(await loadIssued(contract, 100)).toEqual([{ hash: 'hash', name: 'Jane Doe', filiere: 'CS', year: 2026, date: 1, valid: false, tx: 'tx' }]);
  expect(contract.verifierDiplome).toHaveBeenCalledWith('hash', { blockTag: 105 });
  await expect(loadIssued(contract, -1)).rejects.toThrow('VITE_DEPLOY_BLOCK');
});
it('does not bisect unrelated RPC errors', async () => {
  const queryFilter = vi.fn().mockRejectedValue(new Error('unauthorized'));
  await expect(queryEvents({ queryFilter }, 'issued', 100, 1000)).rejects.toThrow('unauthorized');
  expect(queryFilter).toHaveBeenCalledTimes(1);
});
it('handles ethers errors with the range limit nested under error.message', async () => {
  const queryFilter = vi.fn(async (_, start, end) => {
    if (end > start) throw { shortMessage: 'could not coalesce error', error: { code: -32602, message: 'block range limit exceeded' } };
    return [start];
  });
  expect(await queryEvents({ queryFilter }, 'issued', 100, 102)).toEqual([100, 101, 102]);
});
it('does not retry unavailable pruned history as a block range limit', async () => {
  const error = { shortMessage: 'could not coalesce error', error: { code: 4444, message: 'pruned history unavailable: requested 0, earliest available 1000000; range limit' } };
  const queryFilter = vi.fn().mockRejectedValue(error);
  await expect(queryEvents({ queryFilter }, 'issued', 0, 999)).rejects.toBe(error);
  expect(queryFilter).toHaveBeenCalledTimes(1);
});
