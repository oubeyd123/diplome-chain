# Rubric and security review — 12 November 2026

This is a source review and automated verification report, not an independent professional security audit or a promise of a score. The instructor assigns marks. Automated tests cover the current local source; the live deployment must match it before those results can be attributed to that deployment.

## Rubric mapping

| Criterion | Weight | Initial gaps | Implemented evidence | Remaining validation |
| --- | ---: | --- | --- | --- |
| Smart contract and security | 7 | No metadata bounds; mutable owner declaration; browser-exposed upload JWT; no dependency review | Immutable owner, authorization checks, bounded metadata/year validation, duplicate and revocation invariants; authenticated server uploads; secret excluded from bundle; runtime dependency updates | Redeploy current source; review documented trust/key-loss/privacy limits; low development advisories remain |
| Unit tests | 4 | No test runner, tests, or coverage | 25 Hardhat/Mocha/Chai contract tests; 100% statements, branches, functions and lines; local pinned compiler and CI | Maintain tests with future changes; coverage is not a proof of correctness |
| Interface and integration | 5 | Failed owner reads misreported as wrong wallet; limited pending-state feedback; concurrent file-selection risks; upload auth failures opaque | Loading/error/owner states and retry; signing/pending/confirmed/error feedback and explorer links; cancellation and speed-up handling; input locks, request guards, file bounds and cleanup; 26 app/API/helper tests | Actual browser visual/responsive QA and the live MetaMask/testnet walkthrough; mocks cannot prove extension interoperability |
| Deliverables and presentation | 4 | Short README; missing environment template, architecture and presentation evidence | Complete README, architecture diagram, `.env.example`, CI checks, deployment preflight, demo script and evidence template | Fill actual deployment/issuance/revocation links and demonstrate on testnet |

## Verified results

`npm run check` passed after the dependency overrides and application fixes:

- **25 contract tests:** owner initialization; complete storage and event timestamps; public unknown/modified verification; unauthorized issue/revoke; zero hash; duplicate prevention without overwrites; metadata minimum/maximum byte boundaries; UTF-8 byte sizing; year boundaries; revocation history and event; repeated revocation; prohibition on reissuing revoked hashes; ordinary ETH transfer rejection.
- **26 app/API/helper tests:** owner loading/error/mismatch/network gates; signing → pending → receipt; user rejection; insufficient funds messaging; failed receipts; replacement and cancellation; public authentic/revoked/unknown verdicts; RPC failure; stale verification responses; generated PDF signature and SHA-256 cross-check against Node crypto; one-byte mutation; owner upload success; replay, outsider, expired authorization, substituted files, non-PDF, oversized files, cross-origin and malformed requests; request rate limits; upstream-error redaction.
- **Solidity coverage:** 100% statements, branches, functions and lines in `DiplomaRegistry.sol`. Generated HTML: `coverage/index.html`.
- **Production build:** passed. Vite reports a large JavaScript chunk; this is a performance limitation, not a security pass/fail result.
- **Production dependency audit:** `npm audit --omit=dev` reports **0 vulnerabilities**.
- **Full dependency audit:** **11 low**, **0 moderate**, **0 high**, **0 critical** advisories. The remaining chain is Hardhat 2 / ethers 5 ABI and signing helpers / `elliptic`, propagated through the Hardhat plugins and coverage tooling. The application uses ethers 6. These findings are development dependencies, not shipped runtime dependencies. They are not suppressed. A safe long-term remediation needs a Hardhat 3/native-coverage migration or upstream fixes; forcing incompatible cryptography packages is not a security fix.
- **Secret scan:** the configured Pinata JWT is absent from built JavaScript, and no frontend `VITE_PINATA_JWT` reference remains. `.env` is ignored. This cannot revoke any earlier distributed copy; rotate previously exposed credentials.
- **Pinata live authentication:** HTTP **200** from `data/testAuthentication`. This checks credentials, not PDF upload permission or a full live upload.

Dependency overrides update transitive `tmp`, `serialize-javascript`, `cookie`, `bn.js` 4.x, `diff`, newer `glob` and `minimatch` ranges. The full test/coverage/build workflow passed with them on Node 24. Keep the lockfile and recheck when updating tooling.

## Live contract check

The configured Sepolia address at review time was:

- Contract: `0x8Af0e312B078bc53c9A087C92B7b8Db00401CA5e`
- Owner returned by the contract: `0x8589477ccDAe1170E72edf72F2704cDbea23E7BF`
- Chain: Sepolia (`11155111`)

The contract is deployed and readable, and your connected account is its owner. However, `npm run preflight` correctly **fails the bytecode comparison against the hardened local source**. It has not been certified as the updated contract. Different compiler/settings also cause this check to fail; use the exact README settings and redeploy the changed source. No wallet transaction or deployment was submitted during this audit.

## Security analysis and scope limits

1. **Authorization:** both write operations require `msg.sender == owner`. UI restrictions improve usability but are not relied on for security. Direct outsider calls are tested. The signer and chain are checked again before writes.
2. **State integrity:** the hash is nonzero and unique for the life of the registry. Revocation changes only validity and preserves existence/metadata. There is no path to un-revoke or overwrite a record. Ordinary payments fail. No external contract calls occur in issue/revoke, so there is no external-call reentrancy path in those operations.
3. **Upload credentials:** the JWT lives only in the server environment. Uploads require an owner signature over a random, expiring, one-use challenge bound to the exact PDF hash and origin. The server hashes the received bytes and rejects substitution before contacting Pinata. PDF signature checks and size limits reduce malformed-input exposure but are not full PDF validation or antivirus scanning.
4. **Concurrency:** the university flow prevents overlapping operations, file replacement/reset and tab navigation while processing. Verification uses request IDs so an earlier response cannot replace the latest result. Object URLs are released when files change.
5. **External truth:** neither Solidity nor the server proves accreditation, factual student claims, agreement between PDF text and form fields, or that an arbitrary issuer-provided CID contains the hash's bytes. An honest, identified university and correct application configuration remain trust assumptions.
6. **Key lifecycle:** an immutable owner is simple but permanent. Key compromise enables forged records; key loss prevents future writes. Recovery, transfer, pause and multisig governance are outside this prototype. Do not describe these as implemented safeguards.
7. **Privacy and availability:** names and course/year are on chain, PDFs are public IPFS content, and revocation does not erase either. Use synthetic student data. RPC and gateway outages, IPFS retention, gas balances and testnet reorganizations remain operational risks. The UI waits for one confirmation, not finality.
8. **Hosting:** the provided server is intended for a local demonstration, with loopback binding, exact-origin checking, bounded files and in-memory nonces/rate limits. Public hosting needs HTTPS and a same-origin reverse proxy; multiple instances need shared nonce/rate-limit storage and stronger operational request/concurrency controls. No production-readiness claim is made.

## Required completion steps

1. Redeploy the current Solidity source with the README compiler settings using the university's MetaMask account; update `.env` and restart both processes. Old records remain at their old address.
2. Run `npm run preflight` until the deployment bytecode and Pinata authentication checks pass.
3. Perform `docs/DEMO.md` in the actual browser and MetaMask, including real upload, issuance, verification, tampering, rejection, wrong wallet and revocation. Record explorer links/screenshots in its evidence table.
4. Rotate any JWT that was previously exposed in browser builds. Retain only the server-side `PINATA_JWT` and limited upload permissions.

## References used

- [Hardhat Chai Matchers](https://v2.hardhat.org/hardhat-chai-matchers/docs/overview): assertions for reverts and events.
- [ethers v6 documentation](https://docs.ethers.org/v6/single-page/): provider, signer, receipt and transaction-replacement behavior.
- [Pinata upload documentation](https://docs.pinata.cloud/files/uploading-files): multipart uploads, bearer authentication and keeping upload credentials server-side.

The actual commands and tests above establish the project results; these references explain the external APIs, not an endorsement or audit of this project.
