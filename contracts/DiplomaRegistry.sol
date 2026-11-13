// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Registre de diplômes : seul le propriétaire (l'université) peut émettre ou révoquer.
contract DiplomaRegistry {
    address public immutable owner;

    struct Diplome {
        bytes32 hashPdf;
        string nomEtudiant;
        string prenomEtudiant;
        string filiere;
        uint16 annee;
        string cid;
        uint256 date;
        bool valide;
        bool existe;
    }

    mapping(bytes32 => Diplome) public diplomes;

    event DiplomeEmis(bytes32 indexed hashPdf, string nom, string prenom, uint256 date);
    event DiplomeRevoque(bytes32 indexed hashPdf, uint256 date);

    modifier onlyOwner() {
        require(msg.sender == owner, "Reserve a l'universite");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function emettreDiplome(
        bytes32 hashPdf,
        string calldata nom,
        string calldata prenom,
        string calldata filiere,
        uint16 annee,
        string calldata cid
    ) external onlyOwner {
        require(hashPdf != bytes32(0), "Hash invalide");
        require(!diplomes[hashPdf].existe, "Diplome deja emis");
        require(bytes(nom).length > 0 && bytes(nom).length <= 128, "Nom invalide");
        require(bytes(prenom).length > 0 && bytes(prenom).length <= 128, "Prenom invalide");
        require(bytes(filiere).length > 0 && bytes(filiere).length <= 256, "Filiere invalide");
        require(annee >= 1900 && annee <= 2100, "Annee invalide");
        require(bytes(cid).length > 0 && bytes(cid).length <= 128, "CID invalide");

        diplomes[hashPdf] = Diplome(hashPdf, nom, prenom, filiere, annee, cid, block.timestamp, true, true);
        emit DiplomeEmis(hashPdf, nom, prenom, block.timestamp);
    }

    function verifierDiplome(bytes32 hashPdf) external view returns (Diplome memory) {
        return diplomes[hashPdf];
    }

    function revoquerDiplome(bytes32 hashPdf) external onlyOwner {
        Diplome storage d = diplomes[hashPdf];
        require(d.existe, "Diplome inconnu");
        require(d.valide, "Deja revoque");
        d.valide = false;
        emit DiplomeRevoque(hashPdf, block.timestamp);
    }
}
