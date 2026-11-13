export function errorMessage(error) {
  if (error.code === 'ACTION_REJECTED' || error.code === 4001) return 'Demande refusée dans MetaMask.';
  if (error.code === 'INSUFFICIENT_FUNDS') return 'Solde insuffisant pour les frais du réseau.';
  return error.reason || error.shortMessage || error.message || 'Une erreur est survenue.';
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
