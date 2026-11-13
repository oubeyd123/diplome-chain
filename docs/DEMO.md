# Live testnet presentation

Use only fictional names and PDFs. Do not display credentials, private keys or seed phrases.

## Evidence to fill after redeployment

| Evidence | Value |
| --- | --- |
| Network | Sepolia, chain ID 11155111 |
| Current hardened contract address | Pending redeployment |
| University owner | Confirm with `npm run preflight` |
| Deployment transaction / explorer link | Pending |
| Issuance transaction / explorer link | Pending |
| SHA-256 and public IPFS CID | Pending |
| Revocation transaction / explorer link | Pending |
| Preflight output, date, screenshots | Pending |

## Demonstration sequence (about 8 minutes)

1. Explain the README architecture diagram: PDF bytes → SHA-256; upload → CID; owner-signed transaction → registry.
2. Show `npm test`, `npm run coverage`, `npm audit --omit=dev`, and `npm run build`. Explain the tested security invariants and documented limitations.
3. Run `npm run preflight` with the newly deployed contract. Show the contract and owner on Sepolia Etherscan. A bytecode failure must be resolved before claiming the tested source is deployed.
4. Start `npm run server` and `npm run dev`. Open the university area with the owner account, on Sepolia, with enough test ETH for gas.
5. Enter fictional metadata and generate a PDF. Download and retain **these exact bytes**. Upload to IPFS; approve the authorization message. Show CID.
6. Issue the diploma. Show the wallet-signing prompt, pending explorer link, and confirmed success. Save the transaction hash and event from Etherscan.
7. In the public tab (or a browser without MetaMask), verify the saved PDF: authentic. Verify an unregistered PDF or a copy with one byte changed: no match.
8. Switch to another wallet: the university area denies access. Explain that the contract tests also prove direct calls from another account revert, independent of the UI.
9. Return to the owner. Start a write and reject it in MetaMask to demonstrate the error state. Retry deliberately if needed; no success should be shown for a rejection.
10. Revoke the issued hash. Show its pending and confirmed transaction, then verify the original PDF again: revoked. Explain duplicate issuance and repeated revocation are rejected.
11. Explain the public-data boundary, centralized issuer trust, immutable owner/key-loss risk, and why a hash proves byte integrity rather than academic truth.

Fill the evidence table with actual explorer links and screenshots. Local tests, mocked wallet tests and a successful build cannot substitute for the live testnet presentation.
