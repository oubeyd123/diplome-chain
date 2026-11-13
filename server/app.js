import express from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, createHash } from 'node:crypto';
import { verifyMessage } from 'ethers';

export function createApp({ getOwner, upload, origin = 'http://localhost:5173', now = Date.now }) {
  const app = express();
  const challenges = new Map();
  app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: 'Origine interdite.' });
    next();
  }, rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }), express.json({ limit: '4kb' }));
  app.post('/api/upload-challenge', async (req, res, next) => {
    try {
      const hash = req.body?.hash;
      if (!/^0x[0-9a-fA-F]{64}$/.test(hash || '')) return res.status(400).json({ error: 'Empreinte invalide.' });
      for (const [key, value] of challenges) if (value.expires <= now()) challenges.delete(key);
      if (challenges.size >= 1000) return res.status(429).json({ error: 'Réessayez plus tard.' });
      const owner = await getOwner();
      const nonce = randomBytes(32).toString('hex');
      const expires = now() + 120_000;
      const message = `${origin}\nAutoriser un envoi PDF sur IPFS (aucune transaction).\nProprietaire: ${owner}\nSHA-256: ${hash}\nNonce: ${nonce}\nExpiration: ${expires}`;
      challenges.set(nonce, { owner, hash: hash.toLowerCase(), message, expires });
      res.json({ nonce, message });
    } catch (e) { next(e); }
  });
  const parseFile = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 1 } }).single('file');
  app.post('/api/upload', async (req, res, next) => {
    try {
      const nonce = req.headers['x-upload-nonce'];
      const challenge = challenges.get(nonce);
      if (!challenge || challenge.expires <= now()) return res.status(401).json({ error: 'Autorisation expirée : relancez l’envoi.' });
      let signer;
      try { signer = verifyMessage(challenge.message, req.headers['x-upload-signature'] || ''); } catch { /* invalid signature */ }
      if (signer?.toLowerCase() !== challenge.owner.toLowerCase()) return res.status(401).json({ error: 'Signature du propriétaire requise.' });
      challenges.delete(nonce);
      parseFile(req, res, async (error) => {
        if (error) return next(error);
        try {
          const file = req.file;
          if (!file || file.buffer.subarray(0, 5).toString() !== '%PDF-') return res.status(400).json({ error: 'Fichier PDF requis.' });
          const hash = '0x' + createHash('sha256').update(file.buffer).digest('hex');
          if (hash !== challenge.hash) return res.status(400).json({ error: 'Le fichier ne correspond pas à la signature.' });
          res.json({ cid: await upload(file) });
        } catch (e) { next(e); }
      });
    } catch (e) { next(e); }
  });
  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) return res.status(400).json({ error: 'PDF trop volumineux (10 Mo maximum) ou formulaire invalide.' });
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') return res.status(400).json({ error: 'Requête invalide.' });
    res.status(502).json({ error: error.publicMessage || 'Service indisponible : vérifiez le contrat, le réseau et la configuration du serveur.' });
  });
  return app;
}
