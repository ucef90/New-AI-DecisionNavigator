# Framework IA — 6 Socles Méthodologiques Beyond Expertise

## Philosophie fondamentale
Un mauvais cadrage métier produit presque toujours un mauvais projet IA.
La technologie ne corrige pas le flou. Elle l'amplifie.
Ce framework force à raisonner avant d'agir.

## Structure des 6 socles

### SOCLE 1 — Analyse Métier
**Question centrale :** Quel est le vrai problème ? La valeur existe-t-elle réellement ?
**Objectif :** Reformuler la demande en besoin métier pur, sans technologie implicite.
**Dimensions à évaluer :**
- Clarté du besoin métier (formulé sans technologie)
- Tâches chronophages, répétitives, sans valeur ajoutée
- Impact quantifié (ETP, coûts, délais, taux d'erreur)
- Acteurs impactés (y compris absents)
- Baseline mesurée (volume, délai, taux d'erreur actuel)
- Définition du succès à 18 mois
**Artefacts attendus :** Besoin reformulé, KPI baseline, cartographie AS-IS, acteurs

### SOCLE 2 — IA ou Automatisation ?
**Question centrale :** Pour chaque tâche, faut-il de l'IA, de l'automatisation, ou les deux ?
**Objectif :** Éviter l'IA inutile et les sous-solutions. Choisir le bon niveau de complexité.
**Dimensions à évaluer :**
- Tâches avec règles fixes et prévisibles → automatisation
- Tâches nécessitant compréhension de contexte → IA
- Tâches nécessitant raisonnement/interprétation → IA avancée
- Décisions à portée légale → humain obligatoire
- Besoins : OCR, classification, LLM, RAG, scoring, agents
**Artefacts attendus :** Matrice tâches, architecture hybride, dépendances bloquantes

### SOCLE 3 — Questionnaire de Cadrage (21 dimensions)
**Question centrale :** Le projet est-il viable sur TOUTES ses dimensions ?
**Dimensions obligatoires :**
1. Clarté du besoin métier
2. Qualité et disponibilité des données
3. Structuration des workflows
4. Dépendances SI et APIs
5. Contraintes RGPD et données personnelles
6. Conformité EU AI Act
7. Obligations CSE (L.2312-38)
8. Risques techniques (P×I)
9. Risques organisationnels
10. Risques réglementaires
11. Maturité de la gouvernance IA
12. Disponibilité des experts métier
13. Budget et ROI
14. Scalabilité de la solution
15. Gestion des exceptions
16. Plan de continuité
17. Résistance au changement
18. Formation et accompagnement
19. Validation humaine requise
20. Traçabilité et auditabilité
21. Souveraineté des données
**Artefacts attendus :** Analyse 21 dimensions, matrice risques P×I, grille maturité

### SOCLE 4 — Scoring et Maturité (11 axes, score /55)
**Question centrale :** Quel est le niveau de maturité objectif du projet ?
**11 axes scorés de 1 à 5 :**
1. Maturité métier (besoin clair, KPI, workflows)
2. Qualité des données (disponibilité, structuration, fiabilité)
3. Maturité des workflows (documentés, exceptions maîtrisées)
4. Gouvernance IA (comité, charte, supervision)
5. Niveau de risque (identification, criticité, plans)
6. Complexité projet (métier, doc, workflow, gouvernance)
7. Faisabilité technique (APIs, SI, architecture)
8. Faisabilité organisationnelle (alignement, CdC, rôles)
9. Conformité réglementaire (RGPD, EU AI Act, CSE)
10. Dépendances SI (cartographiées, maîtrisables)
11. Préparation IA (cas d'usage qualifiés, corpus, tests)
**Interprétation :**
- 0-40% → Projet immature → NO GO
- 40-60% → Projet intermédiaire → POC ciblé conditionnel
- 60-80% → Projet mature → GO POC
- 80-100% → Très mature → GO production direct

### SOCLE 5 — Cartographie IA
**Question centrale :** Comment fonctionne le système — flux, dépendances, gouvernance ?
**Éléments à produire :**
- Workflow AS-IS vs cible
- Architecture technique en couches
- Flux de données et sensibilité
- Composants IA requis
- Circuit de validation humaine
- Structure de gouvernance

### SOCLE 6 — Gouvernance et Conformité
**Question centrale :** Le projet est-il conforme, sécurisé et pérenne ?
**Checklist obligatoire avant GO production :**
- Charte IA rédigée et signée
- Comité de gouvernance IA constitué
- AIPD finalisée et validée DPO
- CSE informé et consulté
- Plan de continuité documenté et testé
- Mesures techniques RGPD en place (chiffrement, IAM, logs)

## Logique de décision finale

### GO PRODUCTION
Toutes les conditions : score ≥ 80% + charte signée + AIPD validée + CSE consulté

### GO POC CIBLÉ
Score 60-80% + prérequis techniques identifiés + plan d'action défini

### CONDITIONNEL
Score 40-60% + au moins 1 prérequis bloquant identifié + plan d'action requis

### NO GO
Score < 40% OU blocage RGPD rédhibitoire OU données inexistantes OU SI incompatible
