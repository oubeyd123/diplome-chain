// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { Wallet, sha256 } from 'ethers';
import { createApp } from '../../server/app.js';
describe('authenticated upload API', () => {
  const owner = Wallet.createRandom(); const other = Wallet.createRandom();
  const pdf = Buffer.from('%PDF-1.4\nTest diploma');
  let app, upload, clock;
  beforeEach(() => {
    clock = 1000; upload = vi.fn().mockResolvedValue('QmTestCID');
    app = createApp({ getOwner: async () => owner.address, upload, now: () => clock });
  });
  async function challenge(buffer = pdf) {
    const res = await request(app).post('/api/upload-challenge').send({ hash: sha256(buffer) });
    expect(res.status).toBe(200); return res.body;
  }
  async function send(c, signer = owner, buffer = pdf) {
    return request(app).post('/api/upload').set('x-upload-nonce', c.nonce)
      .set('x-upload-signature', await signer.signMessage(c.message)).attach('file', buffer, 'test.pdf');
  }
  it('accepts an owner signature for the exact file and rejects replay', async () => {
    const c = await challenge();
    expect((await send(c)).body).toEqual({ cid: 'QmTestCID' });
    expect(upload).toHaveBeenCalledTimes(1);
    expect((await send(c)).status).toBe(401);
  });
  it('rejects unauthenticated uploads before contacting Pinata', async () => {
    expect((await request(app).post('/api/upload').attach('file', pdf, 'test.pdf')).status).toBe(401);
    expect(upload).not.toHaveBeenCalled();
  });
  it('rejects another signer', async () => {
    expect((await send(await challenge(), other)).status).toBe(401); expect(upload).not.toHaveBeenCalled();
  });
  it('rejects an expired challenge', async () => {
    const c = await challenge(); clock += 120001;
    expect((await send(c)).status).toBe(401); expect(upload).not.toHaveBeenCalled();
  });
  it('rejects a substituted PDF', async () => {
    expect((await send(await challenge(), owner, Buffer.from('%PDF-other'))).status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });
  it('rejects a non-PDF even with a valid owner signature', async () => {
    const fake = Buffer.from('not a PDF');
    expect((await send(await challenge(fake), owner, fake)).status).toBe(400);
  });
  it('rejects files larger than 10 MiB', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1); big.write('%PDF-');
    expect((await send(await challenge(big), owner, big)).status).toBe(400); expect(upload).not.toHaveBeenCalled();
  });
  it('rejects cross-origin requests and invalid hashes', async () => {
    expect((await request(app).post('/api/upload-challenge').set('Origin','https://evil.example').send({ hash: sha256(pdf) })).status).toBe(403);
    expect((await request(app).post('/api/upload-challenge').send({ hash: 'no' })).status).toBe(400);
  });
  it('sanitizes upstream errors', async () => {
    upload.mockRejectedValue(new Error('SECRET_TOKEN_VALUE'));
    const res = await send(await challenge());
    expect(res.status).toBe(502); expect(res.text).not.toContain('SECRET_TOKEN_VALUE');
  });
  it('limits repeated requests', async () => {
    let res;
    for (let i = 0; i < 31; i++) res = await request(app).post('/api/upload-challenge').send({ hash: 'bad' });
    expect(res.status).toBe(429);
  });
});
