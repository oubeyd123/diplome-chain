import { shortAddr } from '../utils/hash';
import { CHAIN } from '../config';

export default function Header({ wallet }) {
  const { hasWallet, account, chainName, wrongChain, connect, switchChain } = wallet;

  return (
    <header className="topbar">
      <div className="wrap bar">
        <span className="brand">Registre des diplômes</span>
        <div className="wallet">
          {!hasWallet ? (
            <a className="btn ghost" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
              Installer MetaMask
            </a>
          ) : !account ? (
            <button className="btn" onClick={connect}>
              Connecter MetaMask
            </button>
          ) : wrongChain ? (
            <button className="btn warn" onClick={switchChain}>
              Passer sur {CHAIN.name}
            </button>
          ) : (
            <span className="chip" title={account}>
              <i className="dot" />
              {shortAddr(account)} · {chainName}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
