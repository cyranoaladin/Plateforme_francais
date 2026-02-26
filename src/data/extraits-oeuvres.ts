/**
 * Extraits EAF session 2025-2026 — voie générale
 * Source : BO n°30 du 24 juillet 2025 (9 œuvres maintenues) + BO été 2024 (3 romans)
 * 12 œuvres officielles, 3 extraits par œuvre = 36 extraits
 * IMPORTANT : le professeur choisit 1 œuvre parmi 3 par objet d'étude.
 */
export type ExtraitOeuvre = {
  id: string;
  oeuvre: string;
  auteur: string;
  parcours: string;
  objetEtude: 'poesie' | 'roman' | 'theatre' | 'litterature_idees';
  extrait: string;
  source: string;
  questionGrammaire: string;
  analyseGrammaire: string;
  axesPossibles: string[];
  difficulte: 1 | 2 | 3;
};

export const EXTRAITS_OEUVRES: ExtraitOeuvre[] = [

  /* ── POÉSIE DU XIXe AU XXIe SIÈCLE ── */

  {
    id: 'rimbaud-1',
    oeuvre: 'Cahier de Douai',
    auteur: 'Arthur Rimbaud',
    parcours: 'Emancipations creatrices',
    objetEtude: 'poesie',
    extrait: `Je m'en allais, les poings dans mes poches crevees ;
Mon paletot aussi devenait ideal ;
J'allais sous le ciel, Muse ! et j'etais ton feal ;
Oh ! la ! la ! que d'amours splendides j'ai revees !

Mon unique culotte avait un large trou.
-- Petit-Poucet reveur, j'egrenais dans ma course
Des rimes. Mon auberge etait a la Grande-Ourse.
-- Mes etoiles au ciel avaient un doux frou-frou`,
    source: 'Ma Boheme (Fantaisie), octave du sonnet',
    questionGrammaire: 'Dans Mon paletot aussi devenait ideal, analysez la fonction de ideal.',
    analyseGrammaire: 'ideal est attribut du sujet Mon paletot, introduit par le verbe attributif devenait. Double sens concret (use) et abstrait (ideal poetique).',
    axesPossibles: ['Transfiguration poetique du reel', 'Autoportrait en poete vagabond', 'Jeu sur les registres familier et lyrique'],
    difficulte: 1,
  },
  {
    id: 'rimbaud-2',
    oeuvre: 'Cahier de Douai',
    auteur: 'Arthur Rimbaud',
    parcours: 'Emancipations creatrices',
    objetEtude: 'poesie',
    extrait: `Par les soirs bleus d'ete, j'irai dans les sentiers,
Picote par les bles, fouler l'herbe menue :
Reveur, j'en sentirai la fraicheur a mes pieds.
Je laisserai le vent baigner ma tete nue.

Je ne parlerai pas, je ne penserai rien :
Mais l'amour infini me montera dans l'ame,
Et j'irai loin, bien loin, comme un bohemien,
Par la Nature, -- heureux comme avec une femme.`,
    source: 'Sensation, poeme complet',
    questionGrammaire: 'Analysez la coordination Mais l\'amour infini me montera dans l\'ame.',
    analyseGrammaire: 'Mais est une conjonction de coordination a valeur d\'opposition. Elle oppose le silence volontaire a l\'envahissement passif du sentiment. Le futur montera exprime une certitude prophetique.',
    axesPossibles: ['Sensorialite comme voie d\'acces au monde', 'Projet de fugue : futur a valeur programmatique', 'Communion pantheiste avec la Nature'],
    difficulte: 1,
  },
  {
    id: 'rimbaud-3',
    oeuvre: 'Cahier de Douai',
    auteur: 'Arthur Rimbaud',
    parcours: 'Emancipations creatrices',
    objetEtude: 'poesie',
    extrait: `Comme je descendais des Fleuves impassibles,
Je ne me sentis plus guide par les haleurs :
Des Peaux-Rouges criards les avaient pris pour cibles,
Les ayant cloues nus aux poteaux de couleurs.

J'etais insoucieux de tous les equipages,
Porteur de bles flamands ou de cotons anglais.
Quand avec mes haleurs ont fini ces tapages,
Les Fleuves m'ont laisse descendre ou je voulais.`,
    source: 'Le Bateau ivre, deux premieres strophes',
    questionGrammaire: 'Analysez Comme je descendais des Fleuves impassibles : subordonnee et valeur de l\'imparfait.',
    analyseGrammaire: 'Circonstancielle de temps introduite par comme (simultaneite). Imparfait descendais a valeur durative d\'arriere-plan. La majuscule a Fleuves signale l\'allegorisation.',
    axesPossibles: ['Metaphore du bateau-poete : emancipation et derive', 'Eclatement des formes : limites du vers', 'Violence liberatrice : les haleurs (contraintes) elimines'],
    difficulte: 3,
  },
  {
    id: 'ponge-1',
    oeuvre: 'La rage de l\'expression',
    auteur: 'Francis Ponge',
    parcours: 'Dans l\'atelier du poete',
    objetEtude: 'poesie',
    extrait: `L'oeillet, d'entre toutes les fleurs, est encore une de celles que je prefere, et une de celles qui me semblent les plus difficiles a exprimer. Non pas qu'il soit tres complique. Mais ses qualites sont d'un type tres particulier. Il a l'air d'etre fait d'un tissu decoupe : satin ou popeline. De cette etoffe, on a fait de petits ronds crantes. Le tout monte en boule et fiche au bout d'un baton de bois vert, comme un sucre d'orge.`,
    source: 'L\'OEillet, debut du texte',
    questionGrammaire: 'Dans Non pas qu\'il soit tres complique, identifiez le mode verbal et justifiez.',
    analyseGrammaire: 'soit est au subjonctif present, requis par Non pas que qui exprime une cause rejetee. Le subjonctif marque la distance critique du poete.',
    axesPossibles: ['Travail de nomination : difficulte d\'exprimer le reel', 'Comparaison avec l\'artisanat : le poeme comme objet fabrique', 'Atelier poetique visible : Ponge montre le processus de creation'],
    difficulte: 2,
  },
  {
    id: 'ponge-2',
    oeuvre: 'La rage de l\'expression',
    auteur: 'Francis Ponge',
    parcours: 'Dans l\'atelier du poete',
    objetEtude: 'poesie',
    extrait: `Le mimosa. -- Que ce mot d'abord m'enchante ! Par ses deux premieres syllabes il est comme la caresse d'un duvet ou d'un velours, et son double I semble dire son cote mimique et grimacant. Mais la desinence A ouvre largement et librement la gorge : c'est une merveille d'expression, ce mot, il exprime a la perfection son objet. Nous sommes dans le Midi de la France et c'est l'hiver ; le mimosa, sur les collines, a fleuri.`,
    source: 'Le Mimosa, ouverture',
    questionGrammaire: 'Analysez Que ce mot d\'abord m\'enchante ! : type de phrase et valeur du subjonctif.',
    analyseGrammaire: 'Phrase exclamative au subjonctif present a valeur optative. Le que introduit un subjonctif independant exprimant l\'emerveillement du poete.',
    axesPossibles: ['Cratylisme : Ponge postule une motivation du signe', 'Exploration phonetique comme methode poetique', 'Refus du lyrisme au profit d\'une poesie de l\'objet'],
    difficulte: 2,
  },
  {
    id: 'ponge-3',
    oeuvre: 'La rage de l\'expression',
    auteur: 'Francis Ponge',
    parcours: 'Dans l\'atelier du poete',
    objetEtude: 'poesie',
    extrait: `Le bois des pins, leur tronc, ne se laisse pas facilement rompre. Resistant et fibreux, il semble le contraire d'un bois cassant. Il ploie et se redresse. Son ecorce, epaisse et profondement crevassee, est comme le modele meme de l'ecorce. Nul arbre n'a l'ecorce plus arbre. Nul ne s'accroche mieux au vent. Nul ne resiste mieux a la tempete. Et cependant sa forme est etrange : tordue, noueuse, il defie la geometrie.`,
    source: 'La Mounine (passage sur les pins)',
    questionGrammaire: 'Dans Nul arbre n\'a l\'ecorce plus arbre, identifiez la nature de arbre en position finale.',
    analyseGrammaire: 'arbre est employe comme adjectif attribut du COD l\'ecorce (avoir + COD + attribut du COD). Emploi transgressif : nom utilise comme adjectif par conversion, produisant une condensation semantique typique de Ponge.',
    axesPossibles: ['La rage de l\'expression : forcer la langue pour atteindre l\'objet', 'Detournement grammatical comme outil poetique', 'Description comme acte de connaissance'],
    difficulte: 3,
  },
  {
    id: 'dorion-1',
    oeuvre: 'Mes forêts',
    auteur: 'Helene Dorion',
    parcours: 'La poesie, la nature, l\'intime',
    objetEtude: 'poesie',
    extrait: `Mes forêts sont de grands arbres
qui portent leurs branches
comme des bras ouverts
sur un monde abime

elles sont l'ombre et la lumiere
le souffle et le silence
l'elan qui porte la terre
vers un ciel immobile

mes forets sont des poemes
que le vent ecrit
sur la page blanche du jour`,
    source: 'Section I, poeme liminaire',
    questionGrammaire: 'Analysez la valeur du present dans Mes forêts sont de grands arbres et Mes forêts sont des poèmes.',
    analyseGrammaire: 'Present gnomique (verite generale) : definition metaphorique permanente. La repetition Mes forets sont cree un effet de litanie transformant la definition en incantation.',
    axesPossibles: ['Metaphore filee foret/poeme : la nature comme ecriture', 'Anaphore mes forets et construction d\'un monde interieur', 'Couples antithetiques (ombre/lumiere) : poetique de la reconciliation'],
    difficulte: 1,
  },
  {
    id: 'dorion-2',
    oeuvre: 'Mes forêts',
    auteur: 'Helene Dorion',
    parcours: 'La poesie, la nature, l\'intime',
    objetEtude: 'poesie',
    extrait: `Mes forêts traversent le temps
comme une riviere traverse la pierre
lentement elles faconnent
ce que nous devenons

il y a dans chaque arbre
une memoire du monde
dans chaque feuille qui tombe
le souvenir d'un ciel

et nous marchons parmi les ombres
cherchant la forme juste
d'un mot qui dirait tout
sans rien figer`,
    source: 'Section III, poeme central',
    questionGrammaire: 'Analysez comme une riviere traverse la pierre : nature et fonction.',
    analyseGrammaire: 'Circonstancielle de comparaison introduite par comme. Elle associe l\'erosion lente a l\'action du temps sur l\'etre humain, reliant nature et interiorite.',
    axesPossibles: ['Le temps et l\'erosion : lenteur comme valeur poetique', 'Quete du mot juste et impossible totalite du langage', 'Nature et memoire : l\'arbre comme archive vivante'],
    difficulte: 2,
  },
  {
    id: 'dorion-3',
    oeuvre: 'Mes forêts',
    auteur: 'Helene Dorion',
    parcours: 'La poesie, la nature, l\'intime',
    objetEtude: 'poesie',
    extrait: `Quelque chose se dechire
entre le monde et moi
un voile peut-etre
ou bien cette certitude
que les mots suffisent

mes forets deviennent alors
le lieu d'un recommencement
la ou la parole defaite
retrouve son premier elan

dans le silence des branches
j'entends battre la terre
comme on entend battre un coeur
lorsqu'on y pose l'oreille`,
    source: 'Section V, avant-dernier poeme',
    questionGrammaire: 'Identifiez la subordonnee relative dans la ou la parole defaite retrouve son premier elan.',
    analyseGrammaire: 'ou la parole defaite retrouve son premier elan est une relative introduite par ou (adverbial de lieu), antecedent le lieu. Elle definit ce lieu comme espace de regeneration du langage.',
    axesPossibles: ['Crise du langage et recommencement', 'Comparaison coeur/terre : intimite du rapport au monde', 'Passage de la dechirure a la reconstruction'],
    difficulte: 3,
  },

  /* ── LITTÉRATURE D'IDÉES DU XVIe AU XVIIIe SIÈCLE ── */

  {
    id: 'laboetie-1',
    oeuvre: 'Discours de la servitude volontaire',
    auteur: 'Etienne de La Boetie',
    parcours: 'Defendre et entretenir la liberte',
    objetEtude: 'litterature_idees',
    extrait: `Pour ce moment, je ne voudrais sinon entendre comme il se peut faire que tant d'hommes, tant de bourgs, tant de villes, tant de nations endurent quelquefois un tyran seul, qui n'a de puissance que celle qu'ils lui donnent ; qui n'a de pouvoir de leur nuire, sinon tant qu'ils ont le vouloir de le souffrir ; qui ne saurait leur faire mal aucun, sinon lorsqu'ils aiment mieux le souffrir que lui contredire.`,
    source: 'Ouverture du Discours, premier paragraphe',
    questionGrammaire: 'Analysez qui n\'a de puissance que celle qu\'ils lui donnent : relative et systeme restrictif.',
    analyseGrammaire: 'Relative determinative (antecedent un tyran seul). ne... que = negation exceptive. celle qu\'ils lui donnent contient une seconde relative (antecedent : pronom celle). Syntaxe enchassee renforcant la demonstration.',
    axesPossibles: ['Le paradoxe : le tyran n\'a que le pouvoir qu\'on lui accorde', 'Accumulation (tant de...) et amplification oratoire', 'Question inaugurale comme strategie argumentative'],
    difficulte: 2,
  },
  {
    id: 'laboetie-2',
    oeuvre: 'Discours de la servitude volontaire',
    auteur: 'Etienne de La Boetie',
    parcours: 'Defendre et entretenir la liberte',
    objetEtude: 'litterature_idees',
    extrait: `C'est le peuple qui s'asservit, qui se coupe la gorge, qui, ayant le choix ou d'etre serf ou d'etre libre, quitte la franchise et prend le joug, qui consent a son mal, ou plutot le pourchasse. S'il lui coutait quelque chose a recouvrer sa liberte, je ne l'en presserais point ; encore que, qu'est-ce que l'homme doit avoir plus cher que de se remettre en son droit naturel ?`,
    source: 'Premier mouvement, la servitude consentie',
    questionGrammaire: 'Analysez ou d\'etre serf ou d\'etre libre : coordination et effet rhetorique.',
    analyseGrammaire: 'Coordination disjonctive ou... ou presentant deux termes antithetiques. L\'alternative binaire simplifie le choix pour rendre plus scandaleuse la preference pour la servitude.',
    axesPossibles: ['Responsabilite du peuple dans sa servitude', 'Eloquence judiciaire : accuser pour reveiller', 'Registre polemique : accumulation de relatives'],
    difficulte: 2,
  },
  {
    id: 'laboetie-3',
    oeuvre: 'Discours de la servitude volontaire',
    auteur: 'Etienne de La Boetie',
    parcours: 'Defendre et entretenir la liberte',
    objetEtude: 'litterature_idees',
    extrait: `Soyez resolus de ne servir plus, et vous voila libres. Je ne veux pas que vous le poussiez ou l'ebranliez, mais seulement ne le soutenez plus, et vous le verrez, comme un grand colosse a qui on a derobe la base, de son poids meme fondre en bas et se rompre. Les tyrans ne sont grands que parce que nous sommes a genoux.`,
    source: 'Passage central, appel a la resistance passive',
    questionGrammaire: 'Dans les tyrans ne sont grands que parce que nous sommes a genoux, analysez la subordonnee et la restriction.',
    analyseGrammaire: 'parce que nous sommes a genoux est une circonstancielle de cause (locution parce que). ne... que = restriction limitant la grandeur des tyrans a cette seule cause. Renversement argumentatif puissant.',
    axesPossibles: ['Desobeissance passive comme arme', 'Metaphore du colosse aux pieds d\'argile', 'Formule finale comme sentence memorable'],
    difficulte: 3,
  },
  {
    id: 'fontenelle-1',
    oeuvre: 'Entretiens sur la pluralité des mondes',
    auteur: 'Bernard Le Bouyer de Fontenelle',
    parcours: 'Le gout de la science',
    objetEtude: 'litterature_idees',
    extrait: `Figurez-vous un Allemand, un Chinois, un Iroquois, qui n'auraient jamais entendu parler d'opera, et qui se trouveraient a une representation du Phaeton ou d'Armide. Se pourraient-ils imaginer que les machines et les ressorts qu'on a arranges derriere le theatre produisent tous ces mouvements si merveilleux qu'ils voient ? C'est justement la nature qui est ce theatre, dont les ressorts sont caches ; et pour les decouvrir, il ne faut que de la curiosite.`,
    source: 'Premier soir, la metaphore de l\'opera',
    questionGrammaire: 'Analysez qui n\'auraient jamais entendu parler d\'opera : nature, fonction et valeur du conditionnel.',
    analyseGrammaire: 'Relative determinative, pronom relatif sujet qui, antecedent un Allemand, un Chinois, un Iroquois. Conditionnel passe auraient entendu a valeur d\'irreel dans le cadre hypothetique.',
    axesPossibles: ['Analogie opera/nature : methode d\'explication accessible', 'Relativisme culturel comme outil de decentrement', 'Curiosite comme vertu cardinale des Lumieres'],
    difficulte: 2,
  },
  {
    id: 'fontenelle-2',
    oeuvre: 'Entretiens sur la pluralité des mondes',
    auteur: 'Bernard Le Bouyer de Fontenelle',
    parcours: 'Le gout de la science',
    objetEtude: 'litterature_idees',
    extrait: `Quand le ciel ne serait qu'une voute bleue et aplatie, ainsi qu'il en a l'air, je vous avoue que ce ne serait pas trop la peine de s'appliquer a la philosophie. La bonne philosophie serait de s'en tenir aux apparences. Mais le spectacle de la nature est si beau, et les verites qu'on y decouvre sont si surprenantes, qu'il y aurait de l'ingratitude a les negliger.`,
    source: 'Premier soir, debut de la conversation',
    questionGrammaire: 'Dans Quand le ciel ne serait qu\'une voute bleue, identifiez le mode/temps et la valeur.',
    analyseGrammaire: 'serait est au conditionnel present. Quand + conditionnel a valeur concessive (meme si). Fontenelle pose une hypothese irreelle pour mieux la refuter.',
    axesPossibles: ['Vulgarisation galante : rendre la science aimable', 'Hypothese comme outil pedagogique', 'Spectacle de la nature : science et emerveillement'],
    difficulte: 2,
  },
  {
    id: 'fontenelle-3',
    oeuvre: 'Entretiens sur la pluralité des mondes',
    auteur: 'Bernard Le Bouyer de Fontenelle',
    parcours: 'Le gout de la science',
    objetEtude: 'litterature_idees',
    extrait: `Croyez-vous, me dit-elle, que la vanite humaine se demonte en faveur de la philosophie ? Croyez-vous que si l'on pouvait dire aux hommes que la Terre n'est pas le centre de l'univers, ils ne seraient pas bien humilies ? Le soleil tourne autour de nous, voila qui est commode pour notre orgueil. Mais placer le soleil au centre, et nous reduire a tourner autour de lui comme de simples planetes, voila qui est insupportable.`,
    source: 'Deuxieme soir, le systeme de Copernic',
    questionGrammaire: 'Analysez le systeme hypothetique si l\'on pouvait dire [...], ils ne seraient pas bien humilies ?',
    analyseGrammaire: 'Systeme hypothetique a l\'irreel du present : si + imparfait (pouvait) -> conditionnel present (seraient). L\'interrogation rhetorique renforce l\'ironie.',
    axesPossibles: ['Ironie comme arme philosophique', 'Revolution copernicienne et blessure narcissique', 'Dialogue galant comme transmission du savoir'],
    difficulte: 3,
  },
  {
    id: 'graffigny-1',
    oeuvre: 'Lettres d\'une Péruvienne',
    auteur: 'Francoise de Graffigny',
    parcours: 'Un nouvel univers s\'est offert a mes yeux',
    objetEtude: 'litterature_idees',
    extrait: `Je ne sais pas combien de temps j'ai ete dans cet etat d'aneantissement ; mais, en reprenant mes sens, je me trouvai resserree dans un espace si etroit qu'il ne m'aurait pas ete possible de m'y retourner. L'obscurite etait affreuse, le mouvement incommode me causait une douleur vive. On me transportait, je ne savais ou. L'air que je respirais n'avait plus cette douceur a laquelle j'etais accoutumee.`,
    source: 'Lettre I, le rapt de Zilia',
    questionGrammaire: 'Analysez si etroit qu\'il ne m\'aurait pas ete possible de m\'y retourner.',
    analyseGrammaire: 'Circonstancielle de consequence (si... que). Conditionnel passe aurait ete exprime une consequence irreelle dans le passe. Construction impersonnelle il + etre possible + de + infinitif renforce le sentiment d\'impuissance.',
    axesPossibles: ['Recit de captivite : sensations physiques du traumatisme', 'Regard etranger comme outil de critique', 'Ecriture epistolaire comme seul espace de liberte'],
    difficulte: 2,
  },
  {
    id: 'graffigny-2',
    oeuvre: 'Lettres d\'une Péruvienne',
    auteur: 'Francoise de Graffigny',
    parcours: 'Un nouvel univers s\'est offert a mes yeux',
    objetEtude: 'litterature_idees',
    extrait: `Les Francais sont si transparents dans leurs pensees que l'on n'a pas besoin de les observer pour les connaitre. Ils parlent comme ils pensent, et pensent comme ils sentent. Leur visage est le miroir de leur ame, et pourtant ils se trompent continuellement les uns les autres. Quelle etrange nation ! Ou le mensonge nait dans la sincerite meme, et l'artifice dans la franchise.`,
    source: 'Lettre XIX, portrait de la societe francaise',
    questionGrammaire: 'Analysez si transparents [...] que l\'on n\'a pas besoin de les observer : type de subordonnee.',
    analyseGrammaire: 'Circonstancielle de consequence, systeme correlatif si + adjectif + que. Le paradoxe surgit apres (et pourtant), creant un effet ironique typique du regard etranger.',
    axesPossibles: ['Regard naif et lucide de l\'etrangere', 'Paradoxe comme figure structurante', 'Tradition des Lettres persanes revisitee au feminin'],
    difficulte: 2,
  },
  {
    id: 'graffigny-3',
    oeuvre: 'Lettres d\'une Péruvienne',
    auteur: 'Francoise de Graffigny',
    parcours: 'Un nouvel univers s\'est offert a mes yeux',
    objetEtude: 'litterature_idees',
    extrait: `On m'a offert tant de choses superflues, et l'on m'a refuse si constamment les necessaires, que j'ai longtemps cru que le superflu etait le seul besoin des Francais. Ils estiment l'or plus que la vertu, et le paraitre plus que l'etre. On me donne des habits qui eblouissent la vue, et l'on me refuse des livres qui eclairent l'esprit.`,
    source: 'Lettre XXVIII, critique de la civilisation materielle',
    questionGrammaire: 'Analysez les deux subordonnees en que dans tant de choses [...] que j\'ai cru que le superflu etait le seul besoin.',
    analyseGrammaire: 'Premier que : circonstancielle de consequence (correlee a tant de et si constamment). Second que : conjonctive completive, COD de cru. Les deux que ont des natures differentes.',
    axesPossibles: ['Critique du materialisme europeen par le regard sauvage', 'Antithese comme figure argumentative', 'Revendication feminine d\'acces au savoir'],
    difficulte: 3,
  },

  /* ── THÉÂTRE DU XVIIe AU XXIe SIÈCLE ── */

  {
    id: 'corneille-1',
    oeuvre: 'Le Menteur',
    auteur: 'Pierre Corneille',
    parcours: 'Mensonge et comedie',
    objetEtude: 'theatre',
    extrait: `DORANTE. -- Je suis donc bien heureux, et de cette aventure\nRetirons de quoi rire au moins pour le present.\nJ'ai feint d'avoir donne le festin sur la riviere ;\nMa foi, je m'y suis pris d'assez bonne maniere.\nJ'ai dit tout a mon pere avec tant d'assurance,\nQue lui-meme en a pris un air de confiance :\nLe bon homme etait ravi, cela faisait pitie,\nEt moi, je m'applaudis de mon bel artifice.`,
    source: 'Acte II, scene 5, monologue de Dorante',
    questionGrammaire: 'Analysez le systeme avec tant d\'assurance, / Que lui-meme en a pris un air de confiance.',
    analyseGrammaire: 'Circonstancielle de consequence correlee a tant de + nom + que + indicatif. L\'effet comique nait du fait que l\'assurance du menteur convainc jusqu\'a son propre pere.',
    axesPossibles: ['Monologue du menteur : jubilation comme ressort comique', 'Mensonge comme performance theatrale : mise en abyme', 'Comedie de caractere cornelienne'],
    difficulte: 1,
  },
  {
    id: 'corneille-2',
    oeuvre: 'Le Menteur',
    auteur: 'Pierre Corneille',
    parcours: 'Mensonge et comedie',
    objetEtude: 'theatre',
    extrait: `CLITON. -- Le voila maintenant entre deux precipices :\nDire vrai, c'est se perdre ; et mentir, c'est son vice.\nLe bel emploi pour un esprit vaillant,\nD'etre pris au milieu d'un piege si brillant !\n\nDORANTE. -- Le moyen que je puisse accorder avec moi\nCe que j'ai dit hier et ce que je suis aujourd'hui ?`,
    source: 'Acte IV, scene 2, le menteur accule',
    questionGrammaire: 'Analysez Dire vrai, c\'est se perdre ; et mentir, c\'est son vice : type de propositions et effets.',
    analyseGrammaire: 'Deux independantes juxtaposees (point-virgule) puis coordonnees (et). Structure infinitif sujet + c\'est + attribut (presentatif). Parallelisme syntaxique creant un dilemme impossible.',
    axesPossibles: ['Dilemme du menteur : verite aussi dangereuse que mensonge', 'Role de Cliton : commentateur lucide', 'Alexandrin au service du comique'],
    difficulte: 2,
  },
  {
    id: 'corneille-3',
    oeuvre: 'Le Menteur',
    auteur: 'Pierre Corneille',
    parcours: 'Mensonge et comedie',
    objetEtude: 'theatre',
    extrait: `DORANTE. -- Le mensonge est un vice aise, mais dangereux :\nIl plait quand il commence, il perd quand il poursuit ;\nUn seul pas dans le faux en entraine un autre,\nEt la suite des temps est toujours contre nous.\nJ'ai feint une naissance et dit une aventure\nQui par ma propre faute a pris cette tournure.`,
    source: 'Acte V, scene 3, prise de conscience',
    questionGrammaire: 'Dans Il plait quand il commence, il perd quand il poursuit, analysez les subordonnees de temps.',
    analyseGrammaire: 'Deux circonstancielles de temps introduites par quand. Parallelisme syntaxique parfait (sujet + verbe + quand + sujet + verbe) creant une sentence morale opposant debut (plaisir) et continuation (perte).',
    axesPossibles: ['Prise de conscience morale : mensonge comme engrenage', 'Sentence morale et comedie moralisante', 'Identite fracturee du menteur'],
    difficulte: 3,
  },
  {
    id: 'musset-1',
    oeuvre: 'On ne badine pas avec l\'amour',
    auteur: 'Alfred de Musset',
    parcours: 'Les jeux du coeur et de la parole',
    objetEtude: 'theatre',
    extrait: `PERDICAN. -- Tous les hommes sont menteurs, inconstants, faux, bavards, hypocrites, orgueilleux et laches, meprisables et sensuels ; toutes les femmes sont perfides, artificieuses, vaniteuses, curieuses et depravees ; le monde n'est qu'un egout sans fond ou les phoques les plus informes rampent et se tordent sur des montagnes de fange ; mais il y a au monde une chose sainte et sublime, c'est l'union de deux de ces etres si imparfaits et si affreux.`,
    source: 'Acte II, scene 5, tirade de Perdican',
    questionGrammaire: 'Analysez mais dans mais il y a au monde une chose sainte et sublime : relation logique et effet.',
    analyseGrammaire: 'Mais = conjonction de coordination exprimant opposition/concession. Elle oppose le requisitoire contre l\'humanite a l\'affirmation unique de l\'amour. Renversement par mais creant un contraste maximal.',
    axesPossibles: ['Eloquence du desespoir amoureux', 'Registre lyrique dans le theatre romantique', 'Paradoxe de l\'amour : etres affreux creant le sublime'],
    difficulte: 1,
  },
  {
    id: 'musset-2',
    oeuvre: 'On ne badine pas avec l\'amour',
    auteur: 'Alfred de Musset',
    parcours: 'Les jeux du coeur et de la parole',
    objetEtude: 'theatre',
    extrait: `CAMILLE. -- Je veux aimer, mais je ne veux pas souffrir ; je veux aimer d'un amour eternel, et faire des serments qui ne se violent pas. Voila mon amant. (Elle montre son crucifix.)\nPERDICAN. -- Cet amant-la ne fait pas de jaloux.\nCAMILLE. -- Vous etes amer et vous avez raison ; mais si vous croyez que je n'ai pas pleure, que je n'ai pas combattu, vous vous trompez.`,
    source: 'Acte III, scene 3, confrontation',
    questionGrammaire: 'Analysez les subordonnees enchassees dans si vous croyez que je n\'ai pas pleure, que je n\'ai pas combattu, vous vous trompez.',
    analyseGrammaire: 'si vous croyez [...] = circonstancielle de condition (si + present -> present : hypothese reelle). que je n\'ai pas pleure et que je n\'ai pas combattu = deux conjonctives completives juxtaposees, COD de croyez.',
    axesPossibles: ['Conflit amour sacre / amour profane', 'Parole comme arme et masque', 'Dimension tragique sous le proverbe'],
    difficulte: 2,
  },
  {
    id: 'musset-3',
    oeuvre: 'On ne badine pas avec l\'amour',
    auteur: 'Alfred de Musset',
    parcours: 'Les jeux du coeur et de la parole',
    objetEtude: 'theatre',
    extrait: `CAMILLE. -- Morte ! non, cela n'est pas possible ! Je ne l'ai pas voulu ! Perdican ! qu'avons-nous fait ? Rosette ! Rosette ! au secours ! Pardon, mon Dieu ! cette enfant est morte !\nPERDICAN. -- Adieu, Camille.\nCAMILLE. -- Mais qu'est-ce donc que cela ? Qui est-ce qui tue les gens ? Elle est vraiment morte ! Je ne savais pas ce que c'etait qu'un mot...`,
    source: 'Acte III, scene 8, denouement (mort de Rosette)',
    questionGrammaire: 'Analysez Je ne savais pas ce que c\'etait qu\'un mot : subordonnee et valeur de l\'imparfait.',
    analyseGrammaire: 'ce que c\'etait qu\'un mot = interrogative indirecte (COD de savais). L\'imparfait savais a une valeur de decouverte retrospective : Camille prend conscience trop tard du pouvoir destructeur des paroles.',
    axesPossibles: ['Denouement tragique : mort de l\'innocente', 'Pouvoir des mots comme theme central', 'Melange des genres : comedie virant au drame'],
    difficulte: 3,
  },
  {
    id: 'sarraute-1',
    oeuvre: 'Pour un oui ou pour un non',
    auteur: 'Nathalie Sarraute',
    parcours: 'Theatre et dispute',
    objetEtude: 'theatre',
    extrait: `H.1 -- Qu'est-ce qu'il y a eu ? Mais rien... Il n'y a rien eu... C'est plutot ce qui n'a pas eu lieu... ce qui ne s'est pas passe entre nous... C'est quelque chose que tu m'as dit...\nH.2 -- Moi ? Qu'est-ce que je t'ai dit ?\nH.1 -- Oh, c'est difficile a retrouver... c'est de ces choses auxquelles sur le moment on ne prete pas attention... ca passe... Et puis ca revient... Ca se met a vivre sa vie...\nH.1 -- Oui... Tu m'avais dit : C'est biiien... ca...`,
    source: 'Debut de la piece, la revelation du malaise',
    questionGrammaire: 'Analysez c\'est de ces choses auxquelles sur le moment on ne prete pas attention : identifiez la relative.',
    analyseGrammaire: 'auxquelles [...] on ne prete pas attention = relative determinative. auxquelles (= a + lesquelles) est COI de preter attention a. Antecedent : ces choses. La relative caracterise les micro-evenements langagiers que Sarraute met au centre de son theatre.',
    axesPossibles: ['Tropisme sarrautien : micro-drames sous la conversation', 'Dispute pour un oui ou pour un non', 'Oralite theatrale : hesitations comme materiau'],
    difficulte: 1,
  },
  {
    id: 'sarraute-2',
    oeuvre: 'Pour un oui ou pour un non',
    auteur: 'Nathalie Sarraute',
    parcours: 'Theatre et dispute',
    objetEtude: 'theatre',
    extrait: `H.1 -- Ce n'est pas ce que tu as dit, c'est la facon dont tu l'as dit... Il y avait entre C'est bien et ca, un espace... un tout petit espace... et ca venait apres, en dessous... c'etait pose sur un autre plan... comme si tu t'adressais a toi-meme... comme si tu te retirais...\nH.2 -- Mais c'est de la folie !\nH.1 -- Peut-etre. Mais c'est justement cette folie-la qui m'interesse.`,
    source: 'Milieu de la piece, l\'analyse de l\'intonation',
    questionGrammaire: 'Analysez comme si tu t\'adressais a toi-meme : construction et mode/temps.',
    analyseGrammaire: 'Circonstancielle de comparaison hypothetique introduite par comme si. L\'imparfait adressais apres comme si exprime l\'irreel du present : le locuteur reconstruit et interprete ce qui se cachait derriere les mots.',
    axesPossibles: ['Sous-conversation : ce qui se dit en dessous des mots', 'Theatre du quotidien : Sarraute dematerialise l\'action', 'Espace entre les mots comme lieu du drame'],
    difficulte: 2,
  },
  {
    id: 'sarraute-3',
    oeuvre: 'Pour un oui ou pour un non',
    auteur: 'Nathalie Sarraute',
    parcours: 'Theatre et dispute',
    objetEtude: 'theatre',
    extrait: `H.2 -- Ecoute, on ne va pas se separer pour ca.\nH.1 -- Pour ca ? Tu vois, tu le fais encore. Pour ca. Comme si ce n'etait rien. Comme si ce que je ressens ne comptait pas. Ca -- tu ranges, tu classes, tu reduis. Mais ca, justement, c'est tout. C'est nous. C'est ce qui fait que deux personnes sont ensemble ou ne le sont pas.\nH.2 -- Mais enfin, raisonnablement...\nH.1 -- Raisonnablement ! Ah, te voila bien !`,
    source: 'Derniere partie, le point de rupture',
    questionGrammaire: 'Analysez C\'est ce qui fait que deux personnes sont ensemble ou ne le sont pas : subordonnees enchassees.',
    analyseGrammaire: 'Trois niveaux : 1) ce qui fait que [...] = relative substantive, sujet reel du presentatif C\'est. 2) que deux personnes sont ensemble ou ne le sont pas = conjonctive completive, COD de fait. 3) ou ne le sont pas = coordonnee par ou (disjonction).',
    axesPossibles: ['Le mot comme acte : dire ca c\'est nier l\'importance de l\'autre', 'Dispute qui menace de tout rompre', 'Nouveau Roman au theatre : langage est le seul evenement'],
    difficulte: 3,
  },

  /* ── ROMAN ET RÉCIT DU MOYEN ÂGE AU XXIe SIÈCLE ── */

  {
    id: 'prevost-1',
    oeuvre: 'Manon Lescaut',
    auteur: 'Abbe Prevost',
    parcours: 'Personnages en marge, plaisirs du romanesque',
    objetEtude: 'roman',
    extrait: `Elle me parut si charmante que moi, qui n'avais jamais pense a la difference des sexes, ni regarde une fille avec un peu d'attention, moi, dis-je, dont tout le monde admirait la sagesse et la retenue, je me trouvai enflamme tout d'un coup jusqu'au transport. J'avais le defaut d'etre excessivement timide et facile a deconcerter ; mais loin d'en etre arrete par cette faiblesse, je m'avancai vers la maitresse de mon coeur.`,
    source: 'Premiere partie, premiere rencontre avec Manon',
    questionGrammaire: 'Analysez si charmante que moi [...] je me trouvai enflamme : systeme consecutif.',
    analyseGrammaire: 'Systeme correlatif si + adjectif + que + indicatif exprimant la consequence. L\'incise moi, qui [...], moi, dis-je, dont [...] cree une longue parenthese retardant la principale, mimant le bouleversement du narrateur.',
    axesPossibles: ['Coup de foudre comme topos romanesque', 'Recit retrospectif et lucidite du narrateur', 'Ambiguite de Manon : innocence et seduction'],
    difficulte: 2,
  },
  {
    id: 'prevost-2',
    oeuvre: 'Manon Lescaut',
    auteur: 'Abbe Prevost',
    parcours: 'Personnages en marge, plaisirs du romanesque',
    objetEtude: 'roman',
    extrait: `Helas ! que ne le marquais-je un jour plus tard ! J'aurais porte chez mon pere toute mon innocence. L'amour me rendit si tendre, des le premier moment, que je pensais languir dans une eternelle misere, si je n'obtenais pas l'affection de celle qui venait, en un instant, de m'oter toute ma raison. Manon etait engagee par ses parents pour etre religieuse : c'est ce qui la faisait envoyer au couvent.`,
    source: 'Premiere partie, suite de la rencontre',
    questionGrammaire: 'Analysez que ne le marquais-je un jour plus tard ! : type de phrase et valeur de l\'imparfait.',
    analyseGrammaire: 'Phrase exclamative a valeur optative (regret irrealisable). L\'inversion sujet-verbe marquais-je est caracteristique du style soutenu. L\'imparfait a une valeur d\'irreel du passe, exprimant le regret retrospectif.',
    axesPossibles: ['Fatalite de la passion et discours retrospectif', 'Heros romanesque en marge : chute sociale par amour', 'Tension raison/sentiment au XVIIIe siecle'],
    difficulte: 2,
  },
  {
    id: 'prevost-3',
    oeuvre: 'Manon Lescaut',
    auteur: 'Abbe Prevost',
    parcours: 'Personnages en marge, plaisirs du romanesque',
    objetEtude: 'roman',
    extrait: `Je demeurai si accable du coup que je ne m'apercus de mon sort que longtemps apres. La nuit qui couvrait le desert n'empechait pas que je ne visse son visage encore. J'entrepris d'ouvrir la terre avec mes mains pour y deposer le corps de Manon. Je n'avais que cette triste occupation. Je rompis mon epee, pour m'en servir a creuser, mais j'en tirais moins de secours que de mes mains.`,
    source: 'Deuxieme partie, mort de Manon dans le desert',
    questionGrammaire: 'Dans n\'empechait pas que je ne visse son visage, analysez le subjonctif et le ne expletif.',
    analyseGrammaire: 'que je ne visse = conjonctive completive au subjonctif imparfait, COD de empecher. Le subjonctif est requis par le verbe empecher. Le ne est expletif (sans valeur negative), typique apres les verbes d\'empechement en francais classique.',
    axesPossibles: ['Pathetique de la scene de mort : sublime du desespoir', 'Marginalite absolue : le desert comme lieu d\'exclusion', 'Romanesque pousse a l\'extreme : gestes primitifs et passion pure'],
    difficulte: 3,
  },
  {
    id: 'balzac-1',
    oeuvre: 'La Peau de chagrin',
    auteur: 'Honore de Balzac',
    parcours: 'Les romans de l\'energie : creation et destruction',
    objetEtude: 'roman',
    extrait: `Voici, dit-il d'une voix eclatante en montrant la Peau de chagrin, le POUVOIR et le VOULOIR reunis. La sont vos idees sociales, vos desirs excessifs, vos intemperances, vos joies qui tuent, vos douleurs qui font trop vivre. Qui possedera ce talisman sera maitre du monde ; mais tout souhait accorde sera pris sur sa vie. Le cercle de cette peau se retrecira suivant la force et le nombre de ses souhaits.`,
    source: 'Premiere partie, Le Talisman, discours de l\'antiquaire',
    questionGrammaire: 'Analysez Qui possedera ce talisman sera maitre du monde : nature de qui et construction.',
    analyseGrammaire: 'Qui possedera ce talisman = relative sans antecedent (relative substantive) a valeur de pronom indefini (= quiconque). Elle fonctionne comme sujet du verbe sera. Le futur a valeur prophetique, posant le pacte faustien.',
    axesPossibles: ['Pacte faustien : pouvoir contre duree de vie', 'Critique de la societe du desir', 'Fantastique comme metaphore morale de la volonte'],
    difficulte: 2,
  },
  {
    id: 'balzac-2',
    oeuvre: 'La Peau de chagrin',
    auteur: 'Honore de Balzac',
    parcours: 'Les romans de l\'energie : creation et destruction',
    objetEtude: 'roman',
    extrait: `Raphael tira de dessous son chevet le lambeau de la Peau de chagrin, fragile et petit comme la feuille d'une pervenche, et le montra a Pauline. -- Pauline, belle image de ma belle vie, disons-nous adieu, dit-il. -- Adieu ? repeta-t-elle d'un air surpris. -- Oui. Cet objet est le depositaire de ma volonte. Ce qu'il me reste de vie est la. Je meurs si je forme un voeu.`,
    source: 'Troisieme partie, L\'Agonie, Raphael et Pauline',
    questionGrammaire: 'Analysez fragile et petit comme la feuille d\'une pervenche : nature et fonction.',
    analyseGrammaire: 'Groupe adjectival en apposition au nom lambeau. fragile et petit = deux adjectifs coordonnes. comme la feuille d\'une pervenche = complement de comparaison. L\'apposition, detachee entre virgules, cree un ralentissement dramatique.',
    axesPossibles: ['Tension energie vitale / destruction', 'Dilemme : vivre sans desir ou desirer sans vivre', 'Dimension allegorique de la peau qui retrecit'],
    difficulte: 2,
  },
  {
    id: 'balzac-3',
    oeuvre: 'La Peau de chagrin',
    auteur: 'Honore de Balzac',
    parcours: 'Les romans de l\'energie : creation et destruction',
    objetEtude: 'roman',
    extrait: `En ce moment, Raphael laissa voir sur ses traits une expression si hideuse que la jeune fille se mit a trembler. Il saisit la peau de chagrin, et prononca un souhait terrible. Le talisman obeit, la peau diminua ; mais Raphael n'y prit pas garde. Il venait de comprendre que chaque souhait lui coutait un jour de sa vie, que le vouloir et le pouvoir etaient des forces qui s'entre-devoraient.`,
    source: 'Troisieme partie, passage de la revelation finale',
    questionGrammaire: 'Analysez les deux completives dans Il venait de comprendre que chaque souhait lui coutait [...], que le vouloir et le pouvoir etaient des forces qui s\'entre-devoraient.',
    analyseGrammaire: 'Les deux que introduisent des conjonctives completives juxtaposees, COD de comprendre. L\'imparfait (coutait, etaient) suit la concordance des temps avec le plus-que-proche venait de comprendre. La seconde completive contient une relative (qui s\'entre-devoraient).',
    axesPossibles: ['Autodestruction comme prix du desir', 'Roman philosophique balzacien', 'Vouloir et pouvoir : romans de l\'energie et leur ambiguite'],
    difficulte: 3,
  },
  {
    id: 'colette-1',
    oeuvre: 'Sido suivi de Les Vrilles de la vigne',
    auteur: 'Colette',
    parcours: 'La celebration du monde',
    objetEtude: 'roman',
    extrait: `Elle m'a donne le jour, et, avec le jour, le gout passionne de tout ce qui respire a l'air libre, le mepris de la peur, et un certain sentiment de la splendeur de la vie que je n'ai pas perdu. De ma mere me vient aussi cette gaiete qui resiste a tout, et ce besoin de rire qui fleurit surtout quand j'ai le moins de raisons de rire. Elle m'a enseigne la patience du jardinier et les vertus de la rosee.`,
    source: 'Sido, ouverture du portrait de la mere',
    questionGrammaire: 'Analysez un certain sentiment de la splendeur de la vie que je n\'ai pas perdu : relative et antecedent.',
    analyseGrammaire: 'que je n\'ai pas perdu = relative determinative, pronom que (COD de ai perdu). Antecedent : un certain sentiment de la splendeur de la vie. La relative inscrit le legs maternel dans la duree et la fidelite.',
    axesPossibles: ['Portrait de Sido : la mere comme source de vitalite', 'Heritage sensoriel : recevoir le monde par les sens', 'Ecriture autobiographique comme celebration'],
    difficulte: 1,
  },
  {
    id: 'colette-2',
    oeuvre: 'Sido suivi de Les Vrilles de la vigne',
    auteur: 'Colette',
    parcours: 'La celebration du monde',
    objetEtude: 'roman',
    extrait: `Le rossignol chantait. Il chantait pendant des heures, invisible dans le feuillage sombre du grand noyer. Je ne dormais plus. Je sortais de mon lit, je posais mes pieds nus sur le plancher de bois frais, je soulevais le rideau de tulle. Le jardin baigne de lune etait vert et bleu. Le rossignol recommencait, et sa voix emplissait la nuit comme une eau qui monte. Comment aurais-je pu dormir ? Le monde etait si beau, si prodigue en murmures.`,
    source: 'Les Vrilles de la vigne, le rossignol nocturne',
    questionGrammaire: 'Analysez Comment aurais-je pu dormir ? : type de phrase, mode/temps et valeur.',
    analyseGrammaire: 'Phrase interrogative rhetorique au conditionnel passe (aurais pu) exprimant une impossibilite dans le passe. L\'interrogation rhetorique implique qu\'il etait impossible de dormir face a tant de beaute. Le conditionnel a valeur d\'irreel du passe.',
    axesPossibles: ['La celebration sensorielle du monde nocturne', 'L\'ecriture de la sensation : synesthesies et immersion', 'Le lyrisme colettien : fusion entre sujet et nature'],
    difficulte: 2,
  },
  {
    id: 'colette-3',
    oeuvre: 'Sido suivi de Les Vrilles de la vigne',
    auteur: 'Colette',
    parcours: 'La celebration du monde',
    objetEtude: 'roman',
    extrait: `Sido, ma mere, regardait d'un oeil mefiant les chrysanthemes mauves et blancs, qu'elle appelait 'vilaines betes'. Mais pour un bouton de rose ou un brin de reseda, elle perdait toute mesure. 'Viens voir !' criait-elle. Et je la trouvais immobile devant un iris que la chaleur venait d'ouvrir, les mains jointes comme devant un miracle. Car elle savait, mieux que personne, que chaque fleur ouverte est un evenement qui ne se reproduira pas.`,
    source: 'Sido, portrait de la mere au jardin',
    questionGrammaire: 'Analysez chaque fleur ouverte est un evenement qui ne se reproduira pas : identifiez la relative et commentez la valeur du futur.',
    analyseGrammaire: 'qui ne se reproduira pas = relative determinative (antecedent evenement), pronom relatif sujet qui. Le futur se reproduira a valeur de certitude absolue portant sur l\'avenir. La relative attribue a l\'evenement un caractere unique et irreversible, elevant l\'observation botanique au rang de revelation philosophique.',
    axesPossibles: ['Le sacre du quotidien : l\'emerveillement devant la nature', 'Le personnage de Sido : une initiatrice au regard poetique', 'La celebration du monde comme art de vivre et d\'ecrire'],
    difficulte: 3,
  },
];
