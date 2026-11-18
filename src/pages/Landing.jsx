import { Link } from 'react-router-dom';
import Rosette from '../components/Rosette';
export default function Landing() {
  return <>
    <section className="hero"><div><p className="eyebrow">Université de Sousse · Confiance numérique</p>
      <h1>Un diplôme. Une empreinte. Une preuve vérifiable.</h1>
      <p className="lead">Des diplômes dont toute modification est détectable, grâce à une empreinte enregistrée sur la blockchain. Recruteurs, vérifiez un PDF en quelques secondes.</p>
      <div className="row hero-actions"><Link className="btn" to="/recruteur/verifier">Vérifier un diplôme</Link><Link className="btn ghost" to="/universite">Espace université</Link></div>
    </div><Rosette /></section>
    <section className="landing-section"><h2>Comment ça marche ?</h2><ol className="feature-grid">
      <li><h3>L’université émet</h3><p>Elle prépare le diplôme PDF et signe son enregistrement avec son portefeuille.</p></li>
      <li><h3>L’empreinte est inscrite</h3><p>Le hash SHA-256 du fichier est enregistré sur une blockchain publique.</p></li>
      <li><h3>Le recruteur vérifie</h3><p>Il choisit le PDF et retrouve son authenticité et son statut en quelques secondes.</p></li>
    </ol></section>
    <section className="landing-section"><h2>Pourquoi lui faire confiance ?</h2><div className="feature-grid trust-grid">
      <article><h3>SHA-256 local</h3><p>L’empreinte est calculée dans votre navigateur. Un seul octet modifié produit une autre empreinte.</p></article>
      <article><h3>Votre PDF reste chez vous</h3><p>Lors d’une vérification, le fichier n’est jamais envoyé. Seule son empreinte est consultée.</p></article>
      <article><h3>Un registre public</h3><p>Les enregistrements sont consultables sur la blockchain. L’université peut révoquer un diplôme et son statut est visible.</p></article>
    </div></section>
    <section className="landing-section about"><p className="eyebrow">À propos de l’université</p><h2>Le savoir, avec une preuve durable.</h2>
      <p>Université de Sousse — École Supérieure des Sciences et de la Technologie de Hammam Sousse.</p>
      <p>Ce projet de démonstration explore la certification numérique des parcours universitaires. Texte de présentation à personnaliser par l’établissement.</p>
    </section>
  </>;
}
