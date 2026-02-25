export type ExtraitOeuvre = {
  id: string;
  oeuvre: string;
  auteur: string;
  annee: string;
  parcours: string;
  extrait: string;
  questionGrammaire: string;
  difficulte: 1 | 2 | 3;
};

export const EXTRAITS_OEUVRES: ExtraitOeuvre[] = [
  { id: 'moliere-1', oeuvre: 'Le Mariage forcé', auteur: 'Molière', annee: '1664', parcours: 'Rire et savoir', extrait: 'Sganarelle hésite entre désir de mariage et peur de la contrainte sociale.', questionGrammaire: 'Identifiez la proposition subordonnée relative et sa fonction.', difficulte: 1 },
  { id: 'moliere-2', oeuvre: 'Le Mariage forcé', auteur: 'Molière', annee: '1664', parcours: 'Rire et savoir', extrait: 'Le dialogue accéléré transforme la dispute en mécanique comique.', questionGrammaire: 'Analysez la valeur des impératifs dans la réplique.', difficulte: 2 },
  { id: 'moliere-3', oeuvre: 'Le Mariage forcé', auteur: 'Molière', annee: '1664', parcours: 'Rire et savoir', extrait: 'Le personnage se contredit pour masquer son angoisse devant l engagement.', questionGrammaire: 'Repérez et analysez la coordination des propositions.', difficulte: 2 },

  { id: 'marivaux-1', oeuvre: "La Surprise de l'amour", auteur: 'Marivaux', annee: '1722', parcours: 'Théâtre et sentiments', extrait: 'Le cœur se découvre à travers un langage qui feint la distance.', questionGrammaire: 'Étudiez l emploi des modalisateurs dans la phrase.', difficulte: 2 },
  { id: 'marivaux-2', oeuvre: "La Surprise de l'amour", auteur: 'Marivaux', annee: '1722', parcours: 'Théâtre et sentiments', extrait: 'La réplique joue sur l hésitation entre aveu et refus.', questionGrammaire: 'Identifiez la valeur du conditionnel.', difficulte: 2 },
  { id: 'marivaux-3', oeuvre: "La Surprise de l'amour", auteur: 'Marivaux', annee: '1722', parcours: 'Théâtre et sentiments', extrait: 'Le marivaudage multiplie les nuances pour différer la vérité.', questionGrammaire: 'Analysez la subordination circonstancielle du passage.', difficulte: 3 },

  { id: 'gouges-1', oeuvre: 'Déclaration des droits de la femme', auteur: 'Olympe de Gouges', annee: '1791', parcours: 'Écrire et combattre pour l égalité', extrait: 'Femme, réveille-toi: le tocsin de la raison se fait entendre.', questionGrammaire: 'Précisez la nature et la valeur de l impératif.', difficulte: 1 },
  { id: 'gouges-2', oeuvre: 'Déclaration des droits de la femme', auteur: 'Olympe de Gouges', annee: '1791', parcours: 'Écrire et combattre pour l égalité', extrait: 'La femme naît libre et demeure égale à l homme en droits.', questionGrammaire: 'Analysez la coordination dans la phrase.', difficulte: 1 },
  { id: 'gouges-3', oeuvre: 'Déclaration des droits de la femme', auteur: 'Olympe de Gouges', annee: '1791', parcours: 'Écrire et combattre pour l égalité', extrait: 'Le texte polémique associe démonstration politique et apostrophe directe.', questionGrammaire: 'Étudiez la valeur des présents dans le passage.', difficulte: 2 },

  { id: 'hugo-1', oeuvre: 'Les Contemplations', auteur: 'Victor Hugo', annee: '1856', parcours: 'Mémoires d une âme', extrait: 'Demain, dès l aube, à l heure où blanchit la campagne...', questionGrammaire: 'Analysez la proposition relative et son antécédent.', difficulte: 1 },
  { id: 'hugo-2', oeuvre: 'Les Contemplations', auteur: 'Victor Hugo', annee: '1856', parcours: 'Mémoires d une âme', extrait: 'Le poète mêle paysage concret et douleur intime.', questionGrammaire: 'Étudiez les expansions du nom dans le vers.', difficulte: 2 },
  { id: 'hugo-3', oeuvre: 'Les Contemplations', auteur: 'Victor Hugo', annee: '1856', parcours: 'Mémoires d une âme', extrait: 'La marche du sujet lyrique devient progression vers le deuil.', questionGrammaire: 'Repérez les temps verbaux dominants et leur valeur.', difficulte: 2 },

  { id: 'rimbaud-1', oeuvre: 'Cahier de Douai', auteur: 'Arthur Rimbaud', annee: '1870', parcours: 'Émancipations créatrices', extrait: 'Ma bohème: Je m en allais, les poings dans mes poches crevées.', questionGrammaire: 'Identifiez la proposition participiale et sa valeur.', difficulte: 2 },
  { id: 'rimbaud-2', oeuvre: 'Cahier de Douai', auteur: 'Arthur Rimbaud', annee: '1870', parcours: 'Émancipations créatrices', extrait: 'Le sonnet transforme la marche en aventure poétique.', questionGrammaire: 'Analysez la valeur de l imparfait.', difficulte: 2 },
  { id: 'rimbaud-3', oeuvre: 'Cahier de Douai', auteur: 'Arthur Rimbaud', annee: '1870', parcours: 'Émancipations créatrices', extrait: 'Le jeune poète revendique une liberté rieuse et insolente.', questionGrammaire: 'Étudiez les groupes nominaux mélioratifs.', difficulte: 3 },

  { id: 'colette-1', oeuvre: 'Sido / Les Vrilles de la vigne', auteur: 'Colette', annee: '1908-1933', parcours: 'La nature, le sensible et l autobiographie', extrait: 'Le souvenir d enfance passe par la sensualité des sensations.', questionGrammaire: 'Analysez la fonction de la subordonnée circonstancielle.', difficulte: 2 },
  { id: 'colette-2', oeuvre: 'Sido / Les Vrilles de la vigne', auteur: 'Colette', annee: '1908-1933', parcours: 'La nature, le sensible et l autobiographie', extrait: 'La phrase ample donne à la mémoire un mouvement ondulant.', questionGrammaire: 'Repérez les expansions adjectivales et leur effet.', difficulte: 2 },
  { id: 'colette-3', oeuvre: 'Sido / Les Vrilles de la vigne', auteur: 'Colette', annee: '1908-1933', parcours: 'La nature, le sensible et l autobiographie', extrait: 'L écriture autobiographique construit une figure maternelle lumineuse.', questionGrammaire: 'Analysez la valeur des pronoms personnels.', difficulte: 3 },

  { id: 'stendhal-1', oeuvre: 'Le Rouge et le Noir', auteur: 'Stendhal', annee: '1830', parcours: 'Le personnage en société', extrait: 'Julien Sorel observe la société comme un champ de conquête.', questionGrammaire: 'Identifiez la subordonnée complétive et sa fonction.', difficulte: 2 },
  { id: 'stendhal-2', oeuvre: 'Le Rouge et le Noir', auteur: 'Stendhal', annee: '1830', parcours: 'Le personnage en société', extrait: 'Le récit alterne ironie du narrateur et ambition du héros.', questionGrammaire: 'Étudiez la valeur du discours indirect libre.', difficulte: 3 },
  { id: 'stendhal-3', oeuvre: 'Le Rouge et le Noir', auteur: 'Stendhal', annee: '1830', parcours: 'Le personnage en société', extrait: 'La tension sociale nourrit le portrait psychologique.', questionGrammaire: 'Repérez les connecteurs logiques et leur rôle.', difficulte: 2 },

  { id: 'balzac-1', oeuvre: 'La Peau de chagrin', auteur: 'Honoré de Balzac', annee: '1831', parcours: 'Les romans de l énergie', extrait: 'Le talisman condense désir, pouvoir et destruction.', questionGrammaire: 'Analysez la phrase complexe du passage.', difficulte: 2 },
  { id: 'balzac-2', oeuvre: 'La Peau de chagrin', auteur: 'Honoré de Balzac', annee: '1831', parcours: 'Les romans de l énergie', extrait: 'Le fantastique sert une réflexion morale sur la volonté.', questionGrammaire: 'Étudiez la valeur des temps du récit.', difficulte: 2 },
  { id: 'balzac-3', oeuvre: 'La Peau de chagrin', auteur: 'Honoré de Balzac', annee: '1831', parcours: 'Les romans de l énergie', extrait: 'Le héros comprend que chaque vœu raccourcit sa vie.', questionGrammaire: 'Identifiez la relation cause/conséquence.', difficulte: 3 },

  { id: 'camus-1', oeuvre: 'La Peste', auteur: 'Albert Camus', annee: '1947', parcours: 'L humanisme en question', extrait: 'La ville découvre soudain la fragilité de son ordre quotidien.', questionGrammaire: 'Analysez la subordonnée circonstancielle de temps.', difficulte: 2 },
  { id: 'camus-2', oeuvre: 'La Peste', auteur: 'Albert Camus', annee: '1947', parcours: 'L humanisme en question', extrait: 'Le narrateur met en tension engagement moral et absurdité du réel.', questionGrammaire: 'Repérez les modalisations du narrateur.', difficulte: 3 },
  { id: 'camus-3', oeuvre: 'La Peste', auteur: 'Albert Camus', annee: '1947', parcours: 'L humanisme en question', extrait: 'Face au mal, les personnages opposent solidarité et lucidité.', questionGrammaire: 'Étudiez la coordination et l opposition syntaxique.', difficulte: 2 },

  { id: 'mixte-1', oeuvre: 'Programme EAF', auteur: 'Corpus transversal', annee: '2024-2025', parcours: 'Comparaisons d œuvres', extrait: 'Comparer la figure du héros entre roman réaliste et roman philosophique.', questionGrammaire: 'Analysez la construction infinitive de la consigne.', difficulte: 1 },
  { id: 'mixte-2', oeuvre: 'Programme EAF', auteur: 'Corpus transversal', annee: '2024-2025', parcours: 'Comparaisons d œuvres', extrait: 'Mettre en regard l argumentation de Gouges et la satire de Molière.', questionGrammaire: 'Identifiez les groupes prépositionnels circonstanciels.', difficulte: 2 },
  { id: 'mixte-3', oeuvre: 'Programme EAF', auteur: 'Corpus transversal', annee: '2024-2025', parcours: 'Comparaisons d œuvres', extrait: 'Observer comment la poésie transforme l expérience intime en portée universelle.', questionGrammaire: 'Analysez la proposition complétive introduite par comment.', difficulte: 2 },
];
