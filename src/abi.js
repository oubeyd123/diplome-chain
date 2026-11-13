export const ABI = [
  'function owner() view returns (address)',
  'function emettreDiplome(bytes32 hashPdf, string nom, string prenom, string filiere, uint16 annee, string cid)',
  'function revoquerDiplome(bytes32 hashPdf)',
  'function verifierDiplome(bytes32 hashPdf) view returns (tuple(bytes32 hashPdf, string nomEtudiant, string prenomEtudiant, string filiere, uint16 annee, string cid, uint256 date, bool valide, bool existe))',
  'event DiplomeEmis(bytes32 indexed hashPdf, string nom, string prenom, uint256 date)',
  'event DiplomeRevoque(bytes32 indexed hashPdf, uint256 date)',
];
