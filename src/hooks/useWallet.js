import { useCallback, useEffect, useState } from 'react';
import { CHAINS, CHAIN, CHAIN_ID, CONFIG_ERROR } from '../config';
import { loadOwner } from '../utils/contract';

export function useWallet() {
  const hasWallet = typeof window !== 'undefined' && Boolean(window.ethereum);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [owner, setOwner] = useState(null);
  const [error, setError] = useState('');
  const [ownerError, setOwnerError] = useState('');
  const [ownerLoading, setOwnerLoading] = useState(true);
  const refreshOwner = useCallback(async () => {
    setOwnerLoading(true); setOwnerError(''); setOwner(null);
    try { setOwner(await loadOwner()); }
    catch (e) { setOwnerError(e.shortMessage || e.message); }
    finally { setOwnerLoading(false); }
  }, []);

  const sync = useCallback(async () => {
    if (!window.ethereum) return;
    const [accounts, chain] = await Promise.all([
      window.ethereum.request({ method: 'eth_accounts' }),
      window.ethereum.request({ method: 'eth_chainId' }),
    ]);
    setAccount(accounts[0] || null);
    setChainId(parseInt(chain, 16));
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const safeSync = () => sync().catch((e) => setError(e.message));
    safeSync();
    window.ethereum.on('accountsChanged', safeSync);
    window.ethereum.on('chainChanged', safeSync);
    return () => {
      window.ethereum.removeListener('accountsChanged', safeSync);
      window.ethereum.removeListener('chainChanged', safeSync);
    };
  }, [sync]);

  useEffect(() => { refreshOwner(); }, [refreshOwner]);

  const connect = async () => {
    try {
      setError('');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await sync();
    } catch (e) {
      setError(e.message);
    }
  };

  const switchChain = async () => {
    try {
      if (CONFIG_ERROR) throw new Error(CONFIG_ERROR);
      setError('');
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN.hex }] });
      await sync();
    } catch (e) {
      if (e.code === 4902) {
        try {
          await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: CHAIN.hex, chainName: CHAIN.name, rpcUrls: [CHAIN.rpc], nativeCurrency: CHAIN.currency, blockExplorerUrls: [CHAIN.explorer] }] });
          await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN.hex }] });
          await sync();
        } catch (addError) { setError(addError.message); }
      } else { setError(e.message); }
    }
  };

  return {
    hasWallet,
    account,
    chainId,
    chainName: chainId ? CHAINS[chainId]?.name ?? `Réseau ${chainId}` : '',
    owner,
    ownerLoading, ownerError, refreshOwner,
    error,
    connect,
    switchChain,
    wrongChain: Boolean(account) && chainId !== CHAIN_ID,
    isOwner: Boolean(account && owner) && account.toLowerCase() === owner.toLowerCase(),
  };
}
