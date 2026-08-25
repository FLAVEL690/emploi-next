import SEO from '../components/common/SEO';
import './Privacy.css';

export default function Privacy() {
  return (
    <main className="privacy-page">
      <SEO
        title="Politique de confidentialite"
        description="Politique de confidentialite et protection des donnees personnelles de NexJob."
        path="/privacy"
      />
      <section className="privacy-hero">
        <div className="container">
          <p className="privacy-eyebrow">Protection des donnees</p>
          <h1>Politique de confidentialite</h1>
          <p>Cette politique explique comment NexJob collecte, utilise et protege vos donnees personnelles.</p>
          <span>Derniere mise a jour : 25 aout 2026</span>
        </div>
      </section>

      <section className="privacy-content container">
        <article className="privacy-document">
          <div className="privacy-notice">
            <strong>En bref</strong>
            <p>Nous collectons uniquement les informations necessaires au fonctionnement de la plateforme de recrutement. Nous ne vendons pas vos donnees personnelles.</p>
          </div>

          <h2>1. Responsable du traitement</h2>
          <p>Le responsable du traitement est NexaDigic, editeur de NexJob, situe a Yaounde, Cameroun. Pour toute question relative a vos donnees, contactez-nous a <a href="mailto:contact@nexadigic.cm">contact@nexadigic.cm</a>.</p>

          <h2>2. Donnees collectees</h2>
          <ul>
            <li><strong>Compte :</strong> nom, prenom, adresse email, telephone, role et informations de profil.</li>
            <li><strong>Recrutement :</strong> CV, competences, disponibilite, localisation, candidatures et offres publiees.</li>
            <li><strong>Echanges :</strong> messages et notifications necessaires a la mise en relation.</li>
            <li><strong>Technique :</strong> donnees de session et preferences stockees dans le navigateur pour maintenir la connexion, les brouillons et les preferences de notifications.</li>
          </ul>

          <h2>3. Finalites et bases legales</h2>
          <p>Vos donnees sont utilisees pour creer et gerer votre compte, afficher les offres, transmettre et suivre les candidatures, permettre les echanges entre candidats et recruteurs, securiser le service et repondre a vos demandes. Ces traitements reposent selon le cas sur l'execution du service demande, votre consentement, notre interet legitime de securite et nos obligations legales.</p>

          <h2>4. Notifications et stockage local</h2>
          <p>Les notifications push sont activees uniquement apres votre action explicite et peuvent etre desactivees dans votre navigateur ou depuis votre profil. Le stockage local et la session du navigateur servent aux fonctions essentielles : authentification, brouillons et limitation du comptage d'une meme consultation d'offre. Aucun cookie publicitaire n'est utilise par NexJob.</p>

          <h2>5. Destinataires et sous-traitants</h2>
          <p>Les donnees sont accessibles aux personnes autorisees de NexaDigic et, lorsque necessaire, aux utilisateurs concernes par le recrutement (par exemple un recruteur recevant une candidature). Nous utilisons des prestataires techniques, notamment Supabase pour l'authentification et l'hebergement des donnees. Ils n'utilisent les donnees que pour fournir leurs services et selon nos instructions.</p>

          <h2>6. Conservation</h2>
          <p>Les donnees du compte sont conservees pendant son utilisation. Vous pouvez demander leur suppression a tout moment. Certaines informations peuvent etre conservees plus longtemps lorsque la loi l'impose ou pour etablir, exercer ou defendre des droits. Les messages et candidatures sont conserves aussi longtemps que necessaire au suivi de la relation de recrutement, puis supprimes ou anonymises selon les besoins du service.</p>

          <h2>7. Vos droits</h2>
          <p>Dans les conditions prevues par la reglementation applicable, vous pouvez demander l'acces, la rectification, l'effacement, la limitation ou la portabilite de vos donnees, vous opposer a certains traitements et retirer votre consentement. Envoyez votre demande a <a href="mailto:contact@nexadigic.cm">contact@nexadigic.cm</a> en precisant l'adresse associee a votre compte. Une verification d'identite peut etre demandee.</p>

          <h2>8. Securite et transferts</h2>
          <p>NexJob met en place des mesures techniques et organisationnelles destinees a proteger les donnees contre l'acces, la modification ou la divulgation non autorisee. Lorsque nos prestataires traitent des donnees hors de votre pays, nous veillons a appliquer les garanties requises par la reglementation applicable.</p>

          <h2>9. Reclamation</h2>
          <p>Nous vous invitons a nous contacter d'abord afin de resoudre toute difficulte. Vous pouvez egalement saisir l'autorite de protection des donnees competente dans votre pays de residence ou de travail, notamment lorsque le RGPD vous est applicable.</p>

          <h2>10. Evolutions</h2>
          <p>Cette politique peut etre mise a jour pour refleter l'evolution du service ou de la reglementation. La date de mise a jour figure en haut de cette page.</p>
        </article>
      </section>
    </main>
  );
}
