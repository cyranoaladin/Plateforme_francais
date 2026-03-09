'use client';

import { useState } from 'react';
import styles from './styles/faq.module.scss';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Comment fonctionne le tuteur IA ?',
    answer: "Notre tuteur IA analyse votre texte en temps réel et fournit des suggestions personnalisées sur la grammaire, le style, la structure argumentative et la cohérence. Il s'adapte à votre niveau et à vos points faibles.",
  },
  {
    question: 'Puis-je annuler mon abonnement ?',
    answer: "Oui, vous pouvez annuler à tout moment. Votre accès reste actif jusqu'à la fin de la période payée. Aucun frais de résiliation.",
  },
  {
    question: "Qu'est-ce qui est inclus dans chaque tier ?",
    answer: "Apprenti (gratuit) : 3 corrections/mois, tuteur IA basique. Développement : corrections illimitées, tuteur IA avancé, bibliothèque complète. Maîtrise : tout Développement + coaching 1-on-1 mensuel.",
  },
  {
    question: 'Combien de corrections IA par mois ?',
    answer: "Apprenti : 3 corrections. Développement et Maîtrise : illimité. Chaque correction inclut feedback détaillé sur grammaire, style, argumentation et structure.",
  },
  {
    question: "Est-ce que ça prépare bien à l'EAF ?",
    answer: "Oui ! Notre plateforme suit le programme officiel EAF 2026. 94% de nos élèves obtiennent leur note cible ou mieux. Nous couvrons écrit, oral, grammaire et méthodologie.",
  },
  {
    question: "Comment fonctionne la période d'essai gratuit ?",
    answer: "7 jours d'accès complet au tier Développement, sans carte bancaire requise. Vous pouvez annuler à tout moment pendant l'essai."
  },
  {
    question: 'Peut-on changer de tier ?',
    answer: 'Oui, vous pouvez upgrader ou downgrader à tout moment. Le changement prend effet immédiatement avec ajustement au prorata.',
  },
  {
    question: 'Y a-t-il des ressources supplémentaires ?',
    answer: "Oui ! Bibliothèque de 553 ressources : annales EAF, œuvres au programme, vidéos explicatives, documents extraits, rapports de jury. Accès complet en tier Développement et Maîtrise.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.faq} id="faq">
      <div className={styles.container}>
        <div className={styles.section__header}>
          <h2 className={styles.section__title}>Questions fréquentes</h2>
          <p className={styles.section__subtitle}>Tout ce que vous devez savoir</p>
        </div>

        <div className={styles.faq__list}>
          {FAQ_ITEMS.map((item, index) => (
            <div key={index} className={styles.faq__item}>
              <button
                className={`${styles.faq__question} ${openIndex === index ? styles.active : ''}`}
                onClick={() => toggleItem(index)}
                aria-expanded={openIndex === index}
              >
                <span>{item.question}</span>
                <span className={styles.faq__icon}>{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && (
                <div className={styles.faq__answer}>
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.faq__cta}>
          <p>Vous avez d&apos;autres questions ?</p>
          <a href="mailto:contact@nexusreussite.academy" className={styles.btn}>
            Contactez notre équipe
          </a>
        </div>
      </div>
    </section>
  );
}
