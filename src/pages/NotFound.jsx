import { Link } from 'react-router-dom';
export default function NotFound() { return <section className="panel"><h1>Page introuvable</h1><p>Cette adresse ne correspond à aucune page.</p><Link className="btn" to="/">Retour à l’accueil</Link></section>; }
