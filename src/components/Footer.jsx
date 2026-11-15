import { CHAIN } from '../config';
export default function Footer() {
  return <footer className="wrap foot"><p>Université de Sousse · ESST Hammam Sousse</p>
    <p>Contact : service de scolarité de l’établissement (coordonnées à compléter).</p>
    <p>Réseau de test : {CHAIN.name}. Les diplômes enregistrés ici n’ont pas de valeur légale.</p>
  </footer>;
}
