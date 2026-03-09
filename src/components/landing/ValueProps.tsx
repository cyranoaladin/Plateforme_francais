'use client';

import styles from './styles/valueProps.module.scss';

interface ValueProp {
  icon: string;
  title: string;
  description: string;
  highlight: string;
}

const PROPS: ValueProp[] = [
  {
    icon: '🤖',
    title: 'Tuteur IA 24/7',
    description: "Feedback immédiat et personnalisé sur vos brouillons",
    highlight: 'Correction en < 30 secondes',
  },
  {
    icon: '👨‍🏫',
    title: "Corrections d'experts",
    description: "Vérification par des professeurs certifiés EAF",
    highlight: "100% des copies vérifiées",
  },
  {
    icon: '📈',
    title: 'Progression garantie',
    description: "Trajectoire pédagogique adaptée à votre niveau",
    highlight: '+15 points en moyenne',
  },
];

export function ValueProps() {
  return (
    <section className={styles.valueProps} id="features">
      <div className={styles.container}>
        <div className={styles.section__header}>
          <h2 className={styles.section__title}>Pourquoi choisir Nexus Réussite ?</h2>
          <p className={styles.section__subtitle}>Trois piliers pour votre réussite</p>
        </div>

        <div className={styles.props__grid}>
          {PROPS.map((prop, idx) => (
            <div key={idx} className={styles.prop__card}>
              <div className={styles.prop__icon}>{prop.icon}</div>
              <h3 className={styles.prop__title}>{prop.title}</h3>
              <p className={styles.prop__description}>{prop.description}</p>
              <div className={styles.prop__highlight}>{prop.highlight}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
