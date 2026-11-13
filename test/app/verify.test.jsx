import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import VerifyPanel from '../../src/components/VerifyPanel';
const { verify } = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('../../src/utils/contract', () => ({ readContract: () => ({ verifierDiplome: verify }) }));
vi.mock('../../src/utils/hash', () => ({ sha256Hex: async () => '0x' + 'a'.repeat(64) }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function choose(container, name = 'diploma.pdf') {
  fireEvent.change(container.querySelector('input'), { target: { files: [new File(['%PDF-test'],name)] } });
}
describe('public diploma verification', () => {
  for (const [existe, valide, verdict] of [[false,false,'Aucune correspondance'],[true,true,'Diplôme authentique'],[true,false,'Diplôme révoqué']]) {
    it(`renders ${verdict} without a wallet`, async () => {
      verify.mockResolvedValue({ existe, valide, nomEtudiant: 'Doe', prenomEtudiant: 'Jane', filiere: 'CS', annee: 2026n, date: 1n, cid: 'QmTest' });
      const { container } = render(<VerifyPanel />); choose(container);
      await waitFor(() => expect(screen.getByText(verdict)).toBeTruthy());
    });
  }
  it('reports RPC failure rather than calling the diploma invalid', async () => {
    verify.mockRejectedValue(new Error('RPC unavailable'));
    const { container } = render(<VerifyPanel />); choose(container);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('RPC unavailable'));
    expect(screen.queryByText('Aucune correspondance')).toBeNull();
  });
  it('ignores an obsolete request after another file is chosen', async () => {
    let resolveFirst;
    verify.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; })).mockResolvedValueOnce({ existe: false });
    const { container } = render(<VerifyPanel />); choose(container,'first.pdf');
    await waitFor(() => expect(verify).toHaveBeenCalledTimes(1));
    choose(container,'second.pdf');
    await waitFor(() => expect(screen.getByText('Aucune correspondance')).toBeTruthy());
    resolveFirst({ existe: true, valide: true });
    await waitFor(() => expect(screen.getByText('second.pdf')).toBeTruthy());
    expect(screen.queryByText('Diplôme authentique')).toBeNull();
  });
});
