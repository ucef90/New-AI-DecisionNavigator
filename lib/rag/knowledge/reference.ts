/**
 * Corpus de référence du RAG — notes de synthèse ORIGINALES (rédigées pour
 * l'outil, sans reproduction de textes officiels). Sert d'amorce à la base de
 * connaissances : repères réglementaires, sécurité, choix techno, méthodo.
 *
 * Chaque entrée a un `slug` stable → réindexation idempotente.
 */
export interface ReferenceDoc {
  slug: string
  title: string
  tags: string[]
  content: string
}

export const REFERENCE_DOCS: ReferenceDoc[] = [
  {
    slug: "rgpd-projet-ia",
    title: "RGPD : repères pour un projet IA dans le secteur public",
    tags: ["RGPD", "données personnelles", "AIPD"],
    content: `Un traitement de données personnelles par une IA reste soumis au RGPD. Points de vigilance pour une collectivité :
- Base légale : la plupart des traitements publics reposent sur une mission d'intérêt public ou une obligation légale, plutôt que sur le consentement. La base doit être identifiée avant le projet.
- Finalité et minimisation : le besoin justifie quelles données sont traitées. On n'entraîne ni n'alimente un modèle avec plus de données que nécessaire.
- Analyse d'impact (AIPD/DPIA) : recommandée — souvent requise — dès qu'un traitement est susceptible d'engendrer un risque élevé (données sensibles, profilage, surveillance, vulnérabilité des personnes). À mener avec le DPO en amont.
- Décision automatisée (article 22) : une personne ne doit pas subir une décision produisant des effets juridiques fondée uniquement sur un traitement automatisé, sauf cadre prévu et garanties (intervention humaine, contestation). Pour le secteur public, prévoir une supervision humaine effective.
- Information et droits des personnes : transparence sur l'usage de l'IA, droits d'accès, de rectification, d'opposition.
- Sous-traitance et hébergement : vérifier la localisation des données, l'absence de transfert hors UE non encadré, et les engagements du prestataire (contrat, sécurité).
Mémo de cadrage : identifier base légale → minimiser → AIPD si risque → garantir l'humain dans la boucle → informer.`,
  },
  {
    slug: "ia-act-niveaux-risque",
    title: "Règlement IA (UE) : niveaux de risque et obligations",
    tags: ["IA Act", "conformité", "risque"],
    content: `Le règlement européen sur l'IA classe les systèmes par niveau de risque, avec des obligations croissantes :
- Risque inacceptable : pratiques interdites (notation sociale généralisée, manipulation, certaines surveillances biométriques).
- Haut risque : systèmes touchant des domaines sensibles (accès à des services publics essentiels, emploi, éducation, sécurité…). Obligations renforcées : gestion des risques, qualité des données, documentation technique, journalisation, transparence, supervision humaine, robustesse et cybersécurité, évaluation de conformité.
- Risque limité : obligations de transparence (informer l'utilisateur qu'il interagit avec une IA, marquer les contenus générés).
- Risque minimal : la majorité des usages courants, sans obligation spécifique au titre du règlement.
Pour une collectivité, l'enjeu de cadrage est de déterminer tôt si l'usage envisagé relève du « haut risque », car cela conditionne lourdement le niveau d'exigence (documentation, tests, supervision). Un usage d'aide à la décision interne, avec décision finale humaine, réduit généralement le niveau de risque par rapport à une décision entièrement automatisée affectant directement un usager.`,
  },
  {
    slug: "cnil-reperes-ia",
    title: "Repères pratiques (esprit CNIL) pour déployer une IA",
    tags: ["CNIL", "bonnes pratiques", "RGPD"],
    content: `Bonnes pratiques transverses pour un déploiement d'IA respectueux des personnes :
- Définir précisément la finalité avant de choisir l'outil : une IA n'est pas une finalité en soi.
- Qualifier les données d'entraînement et d'usage : origine, licéité, représentativité, biais potentiels. Documenter ces choix.
- Garder la maîtrise : privilégier des solutions auditables, journalisées, où un agent peut comprendre et corriger une sortie.
- Limiter la conservation : durées de conservation proportionnées, suppression des données qui ne servent plus.
- Sécuriser : contrôle d'accès, traçabilité, chiffrement, tests avant mise en production.
- Tester les biais et la qualité : un modèle peut se tromper de façon systématique sur certains profils ; mesurer avant de généraliser.
- Informer et permettre le recours : les usagers doivent savoir qu'une IA intervient et pouvoir contester.
Pour le cadrage : un projet qui prévoit dès le départ supervision humaine, traçabilité et information des personnes part avec un bien meilleur profil de conformité.`,
  },
  {
    slug: "securite-iso-27001-42001",
    title: "Sécurité et management : ISO/IEC 27001 et 42001",
    tags: ["ISO 27001", "ISO 42001", "sécurité", "souveraineté"],
    content: `Deux référentiels utiles pour évaluer un fournisseur :
- ISO/IEC 27001 : système de management de la sécurité de l'information. Une certification indique que l'organisation gère ses risques de sécurité de façon structurée (politique, contrôle d'accès, gestion des incidents, continuité). C'est un signal de maturité, pas une garantie absolue : vérifier le périmètre certifié et la date.
- ISO/IEC 42001 : management de l'IA (gouvernance, gestion des risques propres à l'IA, cycle de vie des modèles). Plus récent, il complète la 27001 sur les enjeux spécifiques à l'IA.
Au-delà des certifications, regarder concrètement : hébergement des données (localisation UE), réversibilité et export en fin de contrat, journalisation et auditabilité, gestion des mises à jour de modèle, et plan de réponse aux incidents. Une réponse fournisseur crédible documente ces points plutôt que de se contenter d'afficher un logo.`,
  },
  {
    slug: "choisir-la-techno",
    title: "Choisir la bonne technologie : RPA, ML, LLM, RAG, OCR, Agent",
    tags: ["technologie", "choix", "IA", "automatisation"],
    content: `Faire correspondre le besoin réel à la famille technologique :
- RPA (automatisation robotisée) : tâches répétitives, règles stables, ressaisies entre logiciels. Pas d'« intelligence » : si les règles sont claires et fixes, c'est souvent la réponse la plus robuste et la moins risquée.
- ML (apprentissage automatique) : prédiction/classification à partir d'historique (scoring, détection d'anomalies). Nécessite des données étiquetées de qualité.
- OCR / LAD : lire et structurer des documents (formulaires, courriers, pièces scannées). Brique d'entrée fréquente avant tout traitement.
- LLM (modèles de langage) : comprendre/rédiger du texte libre, résumer, reformuler, répondre. Puissant mais probabiliste : prévoir relecture humaine et garde-fous.
- RAG (génération augmentée par récupération) : un LLM qui répond en s'appuyant sur VOS documents indexés, pour des réponses ancrées et sourcées, sans réentraîner le modèle. Idéal quand la connaissance est interne et évolue.
- Agent : enchaîne raisonnement et actions/outils pour des tâches multi-étapes. Plus capable mais plus difficile à maîtriser ; à réserver aux besoins qui le justifient.
Heuristique : si des règles fixes suffisent → RPA ; s'il faut lire des documents → OCR ; s'il faut prédire → ML ; s'il faut exploiter du texte/connaissances internes → LLM/RAG ; n'aller vers l'agent que si le besoin est réellement multi-étapes.`,
  },
  {
    slug: "souverainete-hebergement",
    title: "Souveraineté, on-premise et hébergement des données publiques",
    tags: ["souveraineté", "on-premise", "SecNumCloud", "hébergement"],
    content: `Pour des données publiques, surtout sensibles, la localisation et la maîtrise comptent autant que la fonctionnalité :
- On-premise / local : les données restent dans le système d'information de la collectivité. Maximise la souveraineté et évite les transferts ; demande des ressources internes (infrastructure, exploitation).
- Cloud de confiance : qualifications visant un haut niveau de sécurité et d'immunité aux droits extra-européens (par ex. l'exigence d'un hébergement qualifié pour certaines données sensibles). Vérifier le périmètre exact de la qualification.
- Hébergement UE : a minima, s'assurer que les données ne quittent pas l'Union sans encadrement, et que le prestataire n'est pas soumis à des obligations de divulgation incompatibles.
Questions de cadrage : où vivent les données (entraînement, inférence, journaux) ? Qui peut y accéder ? Que se passe-t-il en fin de contrat (réversibilité, export, suppression) ? Une solution exploitable sans clé API externe et sans sortie de données est souvent la plus simple à faire valider.`,
  },
  {
    slug: "cadrer-un-poc",
    title: "Cadrer un POC IA : étapes, pièges, indicateurs",
    tags: ["POC", "méthodologie", "pilotage"],
    content: `Un POC (preuve de concept) sert à lever une incertitude précise avant tout engagement à l'échelle.
Étapes :
1. Formuler l'hypothèse à tester (« l'IA peut-elle classer ces courriers avec une fiabilité suffisante ? ») et le critère de succès chiffré.
2. Délimiter un périmètre étroit et un jeu de données représentatif.
3. Impliquer tôt DSI (intégration) et DPO (conformité).
4. Mesurer sur des indicateurs objectifs (taux d'erreur, temps gagné, taux de reprise humaine).
5. Décider : généraliser, ajuster, ou arrêter — sans s'enfermer dans le sunk cost.
Pièges fréquents : confondre démo et preuve ; tester sur des données trop favorables ; oublier le coût complet (licences, maintenance, infrastructure, accompagnement) ; négliger la conduite du changement et la supervision humaine ; viser une automatisation totale là où une aide à la décision suffirait.
Un bon POC produit une décision argumentée, pas seulement une démonstration.`,
  },
  {
    slug: "questions-fournisseur-ia",
    title: "Questions types à poser à un fournisseur de solution IA",
    tags: ["fournisseur", "achat", "due diligence"],
    content: `Grille de questions pour objectiver une proposition fournisseur :
- Données : où sont-elles hébergées (entraînement, inférence, journaux) ? Sortent-elles de l'UE ? Sont-elles réutilisées pour entraîner d'autres modèles ?
- Performances : sur quelles données la solution a-t-elle été évaluée, avec quel protocole et quels résultats mesurés ? Comment se comporte-t-elle sur des cas hors corpus ?
- Supervision : un agent peut-il comprendre, contester et corriger une sortie ? La décision finale reste-t-elle humaine ?
- Sécurité : certifications (périmètre, date), traçabilité, gestion des accès, plan de réponse aux incidents.
- Conformité : RGPD (base légale, AIPD, information des personnes), positionnement vis-à-vis du règlement IA (niveau de risque).
- Coûts : coût complet sur 3 ans (licences, maintenance, infrastructure, accompagnement), au-delà du prix d'entrée.
- Réversibilité : export des données et des paramètres en fin de contrat, absence d'enfermement propriétaire.
- Maintenance des modèles : fréquence des mises à jour, impact sur les résultats, possibilité de geler une version.
Une réponse solide documente ces points ; une réponse évasive est en soi un signal.`,
  },
]
