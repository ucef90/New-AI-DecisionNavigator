# Note stratégique — élargir le marché

> Le point faible « marché étroit » ne se corrige pas par du code : c'est une
> orientation produit. Cette note recense des pistes concrètes pour étendre la
> portée sans dénaturer la valeur (pré-cadrage IA, traçable, souverain).

## Constat

L'outil est très spécialisé : pré-cadrage IA pour **une** collectivité
(Seine-Saint-Denis), vocabulaire et règles orientés secteur public français.
C'est un atout de différenciation, mais un plafond de croissance.

## Axes d'élargissement (du plus proche au plus ambitieux)

1. **Multi-collectivités (même métier).** Généraliser au-delà du CD93 : autres
   départements, communes, intercommunalités, régions. Techniquement faible coût
   (le métier est identique). Prérequis déjà adressés ici : **multi-utilisateurs
   / RBAC** (#1) et **cloisonnement des données** (#3) — la base d'un mode
   multi-tenant.

2. **Autres secteurs publics réglementés.** Hôpitaux, établissements scolaires,
   opérateurs de l'État : même logique « besoin → IA pertinente ? → conformité ».
   Le moteur de règles et le référentiel (RGPD / IA Act / ISO) sont réutilisables ;
   seules quelques règles métier changent.

3. **Au-delà de l'IA : cadrage de projet numérique.** Le squelette (questionnaire
   → score multi-axes → décision tracée → rapport) vaut pour tout arbitrage
   « faut-il lancer ce projet, et comment ? ». Décliner des moteurs voisins
   (cybersécurité, dette technique, achat logiciel) réutilise 80 % de l'app.

4. **Conformité IA comme produit autonome.** Le module réglementaire
   (alertes RGPD / IA Act / CNIL + AIPD) peut devenir une offre à part entière —
   un marché en forte demande, indépendant du pré-cadrage.

5. **White-label / éditeur.** Packager l'outil pour des cabinets de conseil ou
   des éditeurs qui le déploient chez leurs clients (le mode on-premise et le
   provider LLM configurable facilitent ce positionnement).

## Ce qui est déjà en place pour y aller

- **Souveraineté** (on-premise, fonctionne sans clé API) : argument d'entrée
  fort pour tout acteur public.
- **Provider LLM / embeddings configurables** : adaptation au SI de chaque client.
- **Auth + RBAC + cloisonnement + chiffrement des secrets** : prérequis d'un
  déploiement multi-organisations.
- **Décision déterministe et traçable** : défendable en contexte public/audit.

## Ce qui resterait à faire pour un vrai multi-tenant

- Modèle d'**organisation/tenant** (rattacher User, Project, Knowledge à un tenant).
- Périmètre RAG **par tenant** (au-delà du global/projet actuel).
- Administration des comptes (inviter, rôles) au-delà de l'amorçage mono-admin.
- Facturation / quotas si offre SaaS hébergée.

## Recommandation

Commencer par l'**axe 1 (multi-collectivités)** : faible risque, forte
réutilisation, et il capitalise directement sur les renforcements de sécurité
réalisés. Les axes 3-4 (généralisation du cadrage, conformité autonome) sont les
plus créateurs de valeur à moyen terme.
