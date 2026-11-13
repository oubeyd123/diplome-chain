const { expect } = require('chai');
const { ethers } = require('hardhat');
describe('DiplomaRegistry', function () {
  let registry, owner, stranger;
  const hash = ethers.sha256(ethers.toUtf8Bytes('PDF original'));
  const changed = ethers.sha256(ethers.toUtf8Bytes('PDF modified'));
  const args = [hash, 'Doe', 'Jane', 'Computer Science', 2026, 'QmTestCID'];
  beforeEach(async function () {
    [owner, stranger] = await ethers.getSigners();
    registry = await ethers.deployContract('DiplomaRegistry');
    await registry.waitForDeployment();
  });
  it('sets the deployer as owner', async () => expect(await registry.owner()).to.equal(owner.address));
  it('returns an empty result for unknown or changed PDFs', async () => {
    await registry.emettreDiplome(...args);
    const d = await registry.verifierDiplome(changed);
    expect(d.existe).to.equal(false); expect(d.valide).to.equal(false);
  });
  it('stores all fields and emits issuance with the block timestamp', async () => {
    const tx = await registry.emettreDiplome(...args);
    const receipt = await tx.wait();
    const { timestamp } = await ethers.provider.getBlock(receipt.blockNumber);
    await expect(tx).to.emit(registry, 'DiplomeEmis').withArgs(hash, 'Doe', 'Jane', timestamp);
    expect(Array.from(await registry.verifierDiplome(hash))).to.deep.equal([hash, 'Doe', 'Jane', 'Computer Science', 2026n, 'QmTestCID', BigInt(timestamp), true, true]);
    expect((await registry.diplomes(hash)).existe).to.equal(true);
  });
  it('blocks issuance by another account', async () => {
    await expect(registry.connect(stranger).emettreDiplome(...args)).to.be.revertedWith("Reserve a l'universite");
    expect((await registry.verifierDiplome(hash)).existe).to.equal(false);
  });
  it('blocks revocation by another account and preserves validity', async () => {
    await registry.emettreDiplome(...args);
    await expect(registry.connect(stranger).revoquerDiplome(hash)).to.be.revertedWith("Reserve a l'universite");
    expect((await registry.verifierDiplome(hash)).valide).to.equal(true);
  });
  it('rejects the zero hash', async () => await expect(registry.emettreDiplome(ethers.ZeroHash, ...args.slice(1))).to.be.revertedWith('Hash invalide'));
  it('rejects duplicate issuance without overwriting metadata', async () => {
    await registry.emettreDiplome(...args);
    await expect(registry.emettreDiplome(hash, 'Other', ...args.slice(2))).to.be.revertedWith('Diplome deja emis');
    expect((await registry.verifierDiplome(hash)).nomEtudiant).to.equal('Doe');
  });
  for (const [index, label, max] of [[1,'Nom',128], [2,'Prenom',128], [3,'Filiere',256], [5,'CID',128]]) {
    for (const value of ['', 'a'.repeat(max + 1)]) it(`rejects ${label} of length ${value.length}`, async () => {
      const invalid = [...args]; invalid[index] = value;
      await expect(registry.emettreDiplome(...invalid)).to.be.revertedWith(`${label} invalide`);
    });
  }
  for (const year of [0,1899,2101,65535]) it(`rejects year ${year}`, async () => {
    const invalid = [...args]; invalid[4] = year;
    await expect(registry.emettreDiplome(...invalid)).to.be.revertedWith('Annee invalide');
  });
  for (const year of [1900,2100]) it(`accepts boundary year ${year} and maximum byte lengths`, async () => {
    await registry.emettreDiplome(hash,'a'.repeat(128),'b'.repeat(128),'c'.repeat(256),year,'d'.repeat(128));
    expect((await registry.verifierDiplome(hash)).annee).to.equal(year);
  });
  it('measures UTF-8 bytes rather than characters', async () => {
    await expect(registry.emettreDiplome(hash, 'é'.repeat(65), ...args.slice(2))).to.be.revertedWith('Nom invalide');
  });
  it('revokes, emits an event and preserves the historical record', async () => {
    await registry.emettreDiplome(...args);
    const before = await registry.verifierDiplome(hash);
    const tx = await registry.revoquerDiplome(hash);
    const receipt = await tx.wait();
    const { timestamp } = await ethers.provider.getBlock(receipt.blockNumber);
    await expect(tx).to.emit(registry,'DiplomeRevoque').withArgs(hash,timestamp);
    const after = await registry.verifierDiplome(hash);
    expect(after.valide).to.equal(false); expect(after.existe).to.equal(true);
    expect(after.date).to.equal(before.date); expect(after.cid).to.equal(before.cid);
    await expect(registry.revoquerDiplome(hash)).to.be.revertedWith('Deja revoque');
    await expect(registry.emettreDiplome(...args)).to.be.revertedWith('Diplome deja emis');
  });
  it('rejects revocation of an unknown diploma', async () => await expect(registry.revoquerDiplome(hash)).to.be.revertedWith('Diplome inconnu'));
  it('rejects ETH transfers', async () => await expect(owner.sendTransaction({to: await registry.getAddress(), value: 1})).to.be.reverted);
});
