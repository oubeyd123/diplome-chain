export function errorMessage(error) {
  if (error.code === 'ACTION_REJECTED' || error.code === 4001) return 'Demande refusée dans MetaMask.';
  if (error.code === 'INSUFFICIENT_FUNDS') return 'Solde insuffisant pour les frais du réseau.';
  const reason = error.reason || error.error?.message || error.info?.error?.message || error.shortMessage || error.message || 'Une erreur est survenue.';
  if (/pruned history|earliest available|historical state.*not available/i.test(reason)) {
    return 'Le RPC ne conserve pas cet historique. Renseignez le bloc de déploiement du contrat dans VITE_DEPLOY_BLOCK, ou utilisez un RPC disposant de cet historique.';
  }
  const messages = {
    "Reserve a l'universite": 'Cette action est réservée au portefeuille de l’université.',
    'Diplome deja emis': 'Ce diplôme a déjà été émis.',
    'Hash invalide': 'L’empreinte du diplôme est invalide.',
    'Nom invalide': 'Le nom est obligatoire et doit contenir au plus 128 octets.',
    'Prenom invalide': 'Le prénom est obligatoire et doit contenir au plus 128 octets.',
    'Filiere invalide': 'La filière est obligatoire et doit contenir au plus 256 octets.',
    'Annee invalide': 'L’année doit être comprise entre 1900 et 2100.',
    'CID invalide': 'La référence IPFS est invalide (1 à 128 octets).',
    'Diplome inconnu': 'Aucun diplôme ne correspond à cette empreinte.',
    'Deja revoque': 'Ce diplôme est déjà révoqué.',
  };
  return Object.entries(messages).find(([key]) => reason.includes(key))?.[1] || reason;
}
export async function confirmTransaction(send, update) {
  update({ type: 'warn', text: 'Confirmez la transaction dans MetaMask…' });
  const tx = await send();
  update({ type: 'warn', text: 'Transaction envoyée. En attente de confirmation…', hash: tx.hash });
  let receipt;
  try { receipt = await tx.wait(1); }
  catch (error) {
    if (error.code !== 'TRANSACTION_REPLACED') throw error;
    if (error.cancelled) throw new Error('Transaction annulée ou remplacée par une autre opération.');
    receipt = error.receipt;
  }
  if (!receipt || Number(receipt.status) !== 1) throw new Error('La transaction a échoué sur le réseau.');
  return receipt.hash;
}
