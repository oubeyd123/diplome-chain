// @vitest-environment node
import { it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { sha256Hex } from '../../src/utils/hash';
import { genererDiplomePdf } from '../../src/utils/pdf';
it('generates a PDF, hashes its exact bytes and detects a one-byte change', async () => {
  const file = genererDiplomePdf({ nom: 'Doe', prenom: 'Jane', filiere: 'Computer Science', annee: 2026 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  expect(new TextDecoder().decode(bytes.slice(0,5))).toBe('%PDF-');
  const hash = await sha256Hex(file);
  expect(hash).toBe('0x' + createHash('sha256').update(bytes).digest('hex'));
  bytes[bytes.length - 1] ^= 1;
  expect(await sha256Hex(new Blob([bytes]))).not.toBe(hash);
});
