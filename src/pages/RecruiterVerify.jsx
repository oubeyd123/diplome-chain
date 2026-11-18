import VerifyBox from '../components/VerifyBox';

export default function RecruiterVerify() {
  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">Vérification publique</p>
        <h1>Vérifier un diplôme</h1>
        <p>Aucun compte ni portefeuille ne sont nécessaires. Le PDF reste sur votre appareil pendant la vérification.</p>
      </div>
    </div>
    <VerifyBox />
  </>;
}
