// Fetch small ranges and bisect when a provider rejects a log range.
export async function queryEvents(contract, filter, from, to, onProgress = () => {}, cancelled = () => false) {
  const logs = [];
  async function range(start, end) {
    if (cancelled()) return;
    try { logs.push(...await contract.queryFilter(filter, start, end)); }
    catch (error) {
      const details = `${error.message || ''} ${error.error?.message || ''} ${error.info?.error?.message || ''}`;
      // Pruned history cannot be recovered by shrinking the block range.
      if (/pruned history|earliest available|historical state.*not available/i.test(details)) throw error;
      if (start === end || !/limit|range|too many|response size|more than|exceed|block distance|query returned/i.test(details)) throw error;
      const mid = Math.floor((start + end) / 2);
      await range(start, mid); await range(mid + 1, end);
    }
  }
  for (let start = from; start <= to && !cancelled(); start += 1000) {
    const end = Math.min(start + 999, to); await range(start, end); onProgress(end);
  }
  return logs;
}
export async function loadIssued(contract, from, onProgress, cancelled = () => false) {
  if (!Number.isSafeInteger(from) || from < 0) throw new Error('VITE_DEPLOY_BLOCK doit être un numéro de bloc positif ou nul.');
  const to = await contract.runner.getBlockNumber();
  if (from > to) throw new Error('Le bloc de déploiement est supérieur au dernier bloc du réseau.');
  const issued = await queryEvents(contract, contract.filters.DiplomeEmis(), from, to, onProgress, cancelled);
  const revoked = await queryEvents(contract, contract.filters.DiplomeRevoque(), from, to, onProgress, cancelled);
  const revokedHashes = new Set(revoked.map(e => e.args.hashPdf));
  const unique = [...new Map(issued.map(e => [e.args.hashPdf, e])).values()].reverse();
  const rows = [];
  // Sequential metadata reads avoid flooding RPCs with one request per diploma.
  for (const event of unique) {
    if (cancelled()) return [];
    const d = await contract.verifierDiplome(event.args.hashPdf, { blockTag: to });
    rows.push({ hash: event.args.hashPdf, name: `${d.prenomEtudiant} ${d.nomEtudiant}`, filiere: d.filiere, year: Number(d.annee), date: Number(d.date), valid: d.valide && !revokedHashes.has(event.args.hashPdf), tx: event.transactionHash });
  }
  return rows;
}
