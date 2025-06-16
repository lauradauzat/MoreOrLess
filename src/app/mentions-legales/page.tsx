'use client';

import '@/styles/mentions-legales.css';

export default function MentionsLegales() {
  return (
    <div className="mentions-legales">
      <h1>Mentions légales</h1>
      
      <section>
        <h2>1. Informations légales</h2>
        <p>
          Ce site est édité par [Votre nom ou nom de l'entreprise].<br />
          Contact : [Votre email]<br />
          Hébergement : Vercel Inc.
        </p>
      </section>

      <section>
        <h2>2. Protection des données personnelles</h2>
        <p>
          Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant.
        </p>
      </section>

      <section>
        <h2>3. Propriété intellectuelle</h2>
        <p>
          L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
        </p>
      </section>

      <section>
        <h2>4. Cookies</h2>
        <p>
          Ce site utilise des cookies pour améliorer l'expérience utilisateur. Les cookies sont de petits fichiers texte stockés sur votre ordinateur qui permettent de conserver vos préférences et de vous offrir une meilleure expérience de navigation.
        </p>
      </section>
    </div>
  );
} 