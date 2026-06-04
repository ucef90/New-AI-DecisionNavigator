# SPEC — AI Pré-Cadrage
## Document de référence pour Claude Code — Session 1

---

## BESOIN RÉEL EN UNE PHRASE

> Guider un chef de projet non-technique pour qu'il sache : est-ce de l'IA ou de l'automatisation ? Si c'est de l'IA, laquelle ? Et comment évaluer ce qu'un fournisseur lui propose ?

---

## CONTEXTE PRODUIT

### Utilisateur cible
- Chef de projet de collectivité publique (CD93 — Conseil Départemental)
- Non-technique, à l'aise avec Word/Excel
- Gère 80 projets/an, dont de plus en plus intègrent une demande IA
- Reçoit des demandes "on veut de l'IA" sans savoir quoi répondre
- Reçoit des réponses fournisseurs (PDF techniques) sans savoir les analyser

### Ce que l'outil produit
1. Une décision argumentée : GO / POC / ÉTUDE / AUTOMATISATION / NO GO
2. Le type de technologie recommandé : RPA, ML, LLM, RAG, OCR, AGENT
3. Une synthèse des obligations réglementaires applicables (RGPD, IA Act, ISO 42001)
4. 5 questions concrètes à poser au fournisseur
5. Un PDF d'une page à présenter à la direction

### Ce que l'outil ne fait PAS
- Pas de wizard en 7 ateliers
- Pas de cartographie en 6 vues
- Pas de 61 modèles de données
- Pas de scoring visible et complexe pour l'utilisateur
- Pas de jargon technique dans l'interface

### Contrainte UX absolue
Le parcours complet doit tenir en 15 minutes maximum pour un chef de projet non-technique.

---

## STACK TECHNIQUE

```
Frontend  : Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
Backend   : Next.js API routes
BDD       : SQLite (dev) → PostgreSQL (prod) via Prisma ORM
IA        : Abstraction provider — compatible OpenAI / Mistral / Ollama
Auth      : NextAuth.js (Auth.js)
PDF       : @react-pdf/renderer ou puppeteer
Docker    : Docker Compose pour déploiement on-premise
```

### Abstraction LLM — structure requise
```typescript
// lib/llm/provider.ts
interface LLMProvider {
  complete(prompt: { system: string; user: string }): Promise<string>
}

// Implémentations : OpenAIProvider, MistralProvider, OllamaProvider, StubProvider
// StubProvider retourne des réponses déterministes pour les tests sans clé API
// Sélection via variable d'environnement : LLM_PROVIDER=openai|mistral|ollama|stub
```

---

## PARCOURS UTILISATEUR — 4 ÉTAPES

```
[1] Créer le projet      3 champs simples
        ↓
[2] Répondre aux 10 questions    ~10 min, 1 question à la fois
        ↓
[3] Étape réglementation         3 questions contextuelles générées
        ↓
[4] Page de résultats            Décision + Réglementation + PDF
        ↓
[+] Module fournisseur (optionnel)   Upload PDF → analyse LLM
```

---

## LES 10 QUESTIONS DU PARCOURS

### Règles d'affichage
- 1 question visible à la fois
- Autosave à chaque réponse (table Answer)
- Reformulation LLM uniquement sur Q1 (texte libre)
- Barre de progression visible : "Question 3 sur 10"

---

### BLOC 1 — Comprendre le problème réel

#### Q1 — Décrire le problème
- **Type** : Texte libre
- **Libellé** : "Décrivez ce qui ne fonctionne pas bien aujourd'hui, sans mentionner de solution technologique."
- **Comportement** : Après soumission, appel LLM Prompt 1 → afficher la reformulation avec message si isSolutionOriented = true
- **Clé Answer** : `Q1`
- **Axe scoring** : Axe 1 — Clarté du besoin

#### Q2 — Fréquence du problème
- **Type** : Choix unique
- **Libellé** : "À quelle fréquence ce problème se produit-il ?"
- **Options** :
  - `daily_multiple` — Plusieurs fois par jour
  - `daily` — Tous les jours
  - `weekly` — Plusieurs fois par semaine
  - `occasional` — Occasionnellement
- **Logique** :
  - `daily_multiple` ou `daily` → Axe 4 score = 3
  - `weekly` → Axe 4 score = 2
  - `occasional` → Axe 4 score = 1
- **Clé Answer** : `Q2`
- **Axe scoring** : Axe 4 — Valeur métier

#### Q3 — Impact humain
- **Type** : Choix multiple
- **Libellé** : "Qui est le plus impacté par ce problème ?"
- **Options** :
  - `agents` — Les agents / collaborateurs
  - `users` — Les usagers / citoyens
  - `partners` — Les partenaires externes
  - `direction` — La direction
- **Logique** : `users` sélectionné → majoration Axe 4 (+0.5)
- **Clé Answer** : `Q3`
- **Axe scoring** : Axe 4 — Valeur métier

---

### BLOC 2 — Nature du traitement

#### Q4 — Stabilité des règles
- **Type** : Choix unique
- **Libellé** : "Comment qualifieriez-vous le traitement de ce problème aujourd'hui ?"
- **Options** :
  - `stable` — Toujours identique, règles claires
  - `mostly_stable` — Souvent similaire, quelques exceptions
  - `variable` — Variable selon les cas
  - `complex` — Très complexe, jugement humain requis
- **Logique** :
  - `stable` → signal AUTOMATION fort, Axe 2 score = 1
  - `mostly_stable` → Axe 2 score = 2
  - `variable` ou `complex` → signal IA pertinente, Axe 2 score = 3
- **Clé Answer** : `Q4`
- **Axe scoring** : Axe 2 — Pertinence IA

#### Q5 — Volume et complexité
- **Type** : Choix unique
- **Libellé** : "Quel est le volume et la complexité des cas à traiter ?"
- **Options** :
  - `low_simple` — Peu de cas, simples
  - `high_simple` — Beaucoup de cas, simples et répétitifs
  - `high_complex` — Beaucoup de cas, variés et complexes
  - `low_complex` — Peu de cas mais très complexes
- **Logique** :
  - `high_simple` + Q4=stable → décision probable AUTOMATION
  - `high_complex` ou `low_complex` → signal ML/LLM
  - `low_simple` → Axe 4 score = 1
- **Clé Answer** : `Q5`
- **Axe scoring** : Axe 2 + Axe 6

#### Q6 — Disponibilité des données
- **Type** : Choix unique
- **Libellé** : "Disposez-vous de données existantes sur ce problème ?"
- **Options** :
  - `yes_structured` — Oui, accessibles et structurées
  - `yes_scattered` — Oui, mais dispersées ou non structurées
  - `no` — Non, pas de données disponibles
  - `unknown` — Je ne sais pas
- **Logique** :
  - `no` → Règle dure R3 activée : décision cappée à STUDY
  - `unknown` → Axe 3 score = 1, alerte orange
  - `yes_structured` → Axe 3 score = 3
  - `yes_scattered` → Axe 3 score = 2
- **Clé Answer** : `Q6`
- **Axe scoring** : Axe 3 — Maturité data
- **Règle dure** : R3

---

### BLOC 3 — Données personnelles et risques

#### Q7 — Type de données personnelles
- **Type** : Choix multiple
- **Libellé** : "Ce projet implique-t-il des données personnelles ?"
- **Options** :
  - `none` — Non
  - `identity` — Oui – identité (nom, adresse, email)
  - `health` — Oui – santé ou situation médicale
  - `social` — Oui – situation sociale, handicap, famille
  - `hr` — Oui – données professionnelles (RH, paie)
  - `legal` — Oui – données judiciaires
  - `unknown` — Je ne sais pas
- **Logique** :
  - `health` ou `social` ou `legal` → Règle R6 activée + IA Act Annexe III haut risque + RGPD Art. 9
  - `hr` + Q8=auto → IA Act Annexe III emploi + Consultation CSE (L. 2312-38)
  - `unknown` → alerte orange, AIPD recommandée
  - `none` → niveau réglementaire MINIMAL
- **Clé Answer** : `Q7`
- **Axe scoring** : Axe 5 — Risques
- **Règles dures** : R1, R6

#### Q8 — Décision automatisée
- **Type** : Choix unique
- **Libellé** : "L'IA devra-t-elle prendre des décisions qui impactent directement des personnes ?"
- **Options** :
  - `auto_no_human` — Oui, sans validation humaine
  - `auto_with_human` — Oui, mais un agent valide toujours
  - `assist_only` — Non, c'est une aide à la décision uniquement
  - `unknown` — Je ne sais pas encore
- **Logique** :
  - `auto_no_human` → RGPD Art. 22 activé + AIPD obligatoire + Règle R1 + risque IA Act élevé
  - `auto_with_human` → Art. 22 non déclenché, supervision humaine OK
  - `assist_only` → risque réglementaire réduit
- **Clé Answer** : `Q8`
- **Axe scoring** : Axe 5 — Risques
- **Règles dures** : R1

---

### BLOC 4 — Faisabilité et organisation

#### Q9 — Connexion aux systèmes existants
- **Type** : Choix unique
- **Libellé** : "Les outils informatiques actuels peuvent-ils se connecter à une nouvelle solution ?"
- **Options** :
  - `yes_api` — Oui, avec APIs disponibles
  - `to_check` — À vérifier avec la DSI
  - `no` — Non, systèmes fermés
  - `unknown` — Je ne sais pas
- **Logique** :
  - `no` → Axe 6 score = 1
  - `to_check` ou `unknown` → Axe 6 score = 2
  - `yes_api` → Axe 6 score = 3
- **Clé Answer** : `Q9`
- **Axe scoring** : Axe 6 — Faisabilité technique

#### Q10 — Maturité organisationnelle
- **Type** : Choix unique
- **Libellé** : "Les équipes concernées sont-elles prêtes à changer leurs habitudes de travail ?"
- **Options** :
  - `ready` — Oui, forte demande du terrain
  - `partial` — Partiellement, quelques réticences
  - `resistant` — Non, résistance au changement forte
  - `not_asked` — La question n'a pas encore été posée
- **Logique** :
  - `resistant` → Axe 6 score = 1, alerte adoption dans le rapport
  - `not_asked` → Axe 6 score = 1, recommandation : consulter les équipes avant GO
  - `ready` → Axe 6 score = 3
- **Clé Answer** : `Q10`
- **Axe scoring** : Axe 6 — Faisabilité organisationnelle

---

### ÉTAPE RÉGLEMENTATION — 3 questions contextuelles

Générées automatiquement après Q10 selon Q7 et Q8. Toujours posées dans cet ordre.

#### QR1 — Hébergement (toujours posée)
- **Libellé** : "Les données traitées par ce projet resteront-elles hébergées en France ou en Europe ?"
- **Options** : `yes_france` / `yes_europe` / `no` / `unknown`
- **Logique** :
  - `no` ou `unknown` → alerte RGPD Art. 44-49 (transfert hors UE)
- **Clé Answer** : `QR1`

#### QR2 — AIPD (posée si niveau risque HIGH ou MEDIUM)
- **Condition** : Q7 contient `health`, `social`, `legal`, `hr` OU Q8 = `auto_no_human`
- **Libellé** : "Une analyse d'impact sur la protection des données (AIPD) a-t-elle déjà été réalisée ou planifiée ?"
- **Options** : `yes_done` / `yes_planned` / `no` / `unknown`
- **Logique** :
  - `no` → blocage fort, AIPD obligatoire avant lancement (RGPD Art. 35)
  - `unknown` → alerte orange, contacter DPO
- **Clé Answer** : `QR2`

#### QR3 — Supervision humaine (posée si Q8 = `auto_no_human` ou `auto_with_human`)
- **Libellé** : "Un agent humain pourra-t-il contester ou corriger une décision prise par l'IA ?"
- **Options** : `yes_always` / `yes_sometimes` / `no` / `not_planned`
- **Logique** :
  - `no` ou `not_planned` → alerte critique, non-conformité IA Act Art. 14 + RGPD Art. 22
  - décision cappée à POC maximum
- **Clé Answer** : `QR3`

---

## MOTEUR DE DÉCISION

### Les 6 axes de scoring (1 à 3 chacun, total 18)

| Axe | Questions sources |
|-----|------------------|
| Axe 1 — Clarté du besoin | Q1 |
| Axe 2 — Pertinence IA | Q4 + Q5 |
| Axe 3 — Maturité data | Q6 |
| Axe 4 — Valeur métier | Q2 + Q3 |
| Axe 5 — Risques | Q7 + Q8 |
| Axe 6 — Faisabilité | Q9 + Q10 |

### Grille de décision

| Score total | Verdict par défaut |
|-------------|-------------------|
| 15 à 18 | GO |
| 10 à 14 | POC |
| 6 à 9 | STUDY |
| < 6 | NOGO |

### Règles dures (overrides le score)

```
R1 : Q8 = auto_no_human + Q7 contient health/social/legal
     → verdict cappé à POC maximum
     → message : "Décision automatisée sur données sensibles : supervision humaine obligatoire avant GO"

R2 : Q4 = stable + Q5 = high_simple
     → verdict = AUTOMATION (pas d'IA nécessaire)
     → techRecommendation = RPA
     → message : "Processus stable et répétitif : l'automatisation classique est plus adaptée que l'IA"

R3 : Q6 = no
     → verdict cappé à STUDY
     → message : "Pas de données disponibles : une étude de faisabilité data est nécessaire avant tout projet IA"

R4 : QR1 = no + Q7 != none
     → alerte bloquante hébergement hors UE
     → message : "Hébergement hors UE détecté : analyse juridique RGPD Art.44-49 requise avant GO"

R5 : QR3 = no ou not_planned + Q8 = auto_no_human
     → verdict cappé à POC
     → message : "Absence de supervision humaine : non-conforme IA Act Art.14 et RGPD Art.22"

R6 : Q7 contient health/social/legal + QR2 = no
     → AIPD obligatoire bloquante
     → message : "AIPD obligatoire non planifiée : lancement impossible sans analyse d'impact (RGPD Art.35)"
```

### Arbre techRecommendation

```
Q4 = stable + Q5 = high_simple
  → RPA

Q4 = variable/complex + Q6 = yes_structured
  → ML

Q4 = variable/complex + Q6 != yes_structured + Q5 = high_complex/low_complex
  → si besoin documentaire détecté dans Q1 (mots-clés : formulaire, document, courrier, dossier)
    → OCR
  → sinon
    → LLM

Q4 = variable/complex + Q6 != yes_structured + base connaissance interne mentionnée dans Q1
  → RAG

Q8 = auto_no_human + n'importe quelle techRecommendation ci-dessus
  → AGENT (ajouter flag autonome)

Fallback si Q4 = mostly_stable
  → STUDY (besoin de préciser avant de choisir)
```

---

## LOGIQUE RÉGLEMENTAIRE COMPLÈTE

### Matrice de niveau de risque

| Condition | Niveau | Frameworks déclenchés |
|-----------|--------|----------------------|
| Q7 health/social/legal + Q8 auto_no_human | HIGH | RGPD Art.9+22+35, IA Act Annexe III, ISO 42001 recommandée |
| Q7 health/social/legal + Q8 auto_with_human | MEDIUM | RGPD Art.9+35 probable, IA Act haut risque supervision |
| Q7 hr + Q8 auto_no_human | MEDIUM | RGPD Art.22+35, IA Act emploi, CSE L.2312-38 |
| Q7 identity/hr + Q8 assist_only | LOW | RGPD Art.5+13, IA Act transparence, registre traitements |
| Q7 none | MINIMAL | Aucun framework obligatoire |

### Référentiel réglementaire (base RAG)

```
RGPD (Règlement UE 2016/679) :
  Art. 5   — Principes généraux
  Art. 9   — Données sensibles (santé, handicap, judiciaire)
  Art. 13  — Information des personnes
  Art. 22  — Décision exclusivement automatisée
  Art. 25  — Privacy by design
  Art. 35  — Analyse d'impact (AIPD)
  Art. 44-49 — Transferts hors UE

IA Act UE (Règlement 2024/1689) :
  Art. 5   — Pratiques interdites (depuis fév. 2025)
  Art. 6 + Annexe III — Systèmes à haut risque
  Art. 13  — Transparence
  Art. 14  — Supervision humaine
  Art. 17  — Système qualité
  Calendrier :
    - Fév. 2025 : pratiques interdites applicables
    - Août 2025 : modèles GPAI + gouvernance
    - Août 2026 : application générale
    - 2 déc. 2027 : haut risque Annexe III (report Digital Omnibus mai 2026)
    - Août 2028 : produits réglementés

Annexe III — Domaines haut risque (pertinents secteur public) :
  - Accès aux services essentiels (aides sociales, handicap)
  - Emploi et RH
  - Éducation
  - Justice

CNIL (13 fiches pratiques IA 2024-2025) :
  - Périmètre RGPD sur les systèmes IA
  - Base légale entraînement (intérêt légitime art. 6.1.f)
  - Minimisation des données
  - Information des personnes concernées
  - Traçabilité des modèles (outil CNIL déc. 2025)

ISO 42001:2023 :
  - Système de management IA (SMIA)
  - Couvre 80-85% des exigences IA Act
  - Certifiable par tierce partie
  - Reconnue par la Commission européenne
  - Recommandée pour systèmes à haut risque

Droit du travail français :
  - L. 2312-38 Code du travail
  - Consultation CSE obligatoire si IA impacte conditions de travail ou évaluation des agents

Référentiels secteur public :
  - Référentiel DINUM IA (2024)
  - Charte IA État français
  - RGS v2 (sécurité SI collectivités)
```

---

## MODÈLE DE DONNÉES PRISMA

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = env("DATABASE_PROVIDER") // "sqlite" ou "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String
  role      UserRole  @default(USER)
  createdAt DateTime  @default(now())
  projects  Project[]
  auditLogs AuditLog[]
}

enum UserRole {
  ADMIN
  USER
}

model Project {
  id                String             @id @default(uuid())
  userId            String
  user              User               @relation(fields: [userId], references: [id])
  name              String
  direction         String?
  description       String?
  status            ProjectStatus      @default(DRAFT)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  answers           Answer[]
  decision          Decision?
  regulatoryAlerts  RegulatoryAlert[]
  vendorAnalyses    VendorAnalysis[]
  reports           Report[]
  auditLogs         AuditLog[]
}

enum ProjectStatus {
  DRAFT
  IN_PROGRESS
  DONE
}

model Answer {
  id                String   @id @default(uuid())
  projectId         String
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  questionKey       String   // Q1..Q10, QR1..QR3
  value             Json     // réponse brute (string, array, etc.)
  llmReformulation  String?  // uniquement pour Q1
  answeredAt        DateTime @default(now())

  @@unique([projectId, questionKey])
}

model Decision {
  id                  String             @id @default(uuid())
  projectId           String             @unique
  project             Project            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  verdict             Verdict
  techRecommendation  TechType?
  justification       String
  score               Json               // { axe1: 2, axe2: 3, axe3: 1, axe4: 2, axe5: 2, axe6: 2, total: 12 }
  rulesTriggered      Json               // ["R1", "R6"]
  regulatoryLevel     RegulatoryLevel
  generatedAt         DateTime           @default(now())
}

enum Verdict {
  GO
  POC
  STUDY
  AUTOMATION
  NOGO
}

enum TechType {
  RPA
  ML
  LLM
  RAG
  OCR
  AGENT
}

enum RegulatoryLevel {
  HIGH
  MEDIUM
  LOW
  MINIMAL
}

model RegulatoryAlert {
  id          String            @id @default(uuid())
  projectId   String
  project     Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  level       AlertLevel
  framework   RegulatoryFramework
  article     String?           // ex: "Art. 22"
  obligation  String            // description de l'obligation
  action      String            // action concrète à mener
  deadline    String?           // ex: "Avant lancement", "2 déc. 2027"
}

enum AlertLevel {
  HIGH
  MEDIUM
  LOW
}

enum RegulatoryFramework {
  RGPD
  AI_ACT
  ISO_42001
  CNIL
  CSE
  OTHER
}

model VendorAnalysis {
  id               String   @id @default(uuid())
  projectId        String
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  documentName     String?
  documentContent  String?  // texte extrait du PDF
  fitScore         Int?     // 1-5
  fitJustification String?
  redFlags         Json     // [{ severity, claim, concern }]
  questions        Json     // [{ question, why }]
  recommendations  String?
  recommendation   VendorRecommendation?
  createdAt        DateTime @default(now())
}

enum VendorRecommendation {
  PROCEED
  CAUTION
  AVOID
}

model Report {
  id          String       @id @default(uuid())
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  format      ReportFormat
  content     String       // markdown
  filePath    String?      // chemin PDF généré
  generatedAt DateTime     @default(now())
}

enum ReportFormat {
  PDF
  MARKDOWN
}

model AuditLog {
  id        String   @id @default(uuid())
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id])
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String   // ex: "ANSWER_SAVED", "REPORT_GENERATED", "VENDOR_UPLOADED"
  detail    Json?
  createdAt DateTime @default(now())
}
```

---

## PROMPTS LLM

### Prompt 1 — Reformulation du besoin (Q1)

**System prompt :**
```
Tu es un assistant de pré-cadrage IA pour des chefs de projet de collectivités publiques françaises.
Tu les aides à formuler clairement leur problème métier avant de décider si l'IA est pertinente.

Tes règles absolues :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
- Ne propose jamais de solution technologique dans ta réponse.
- Utilise un langage simple, sans jargon technique.
- Sois concis : 2 phrases maximum par champ texte.
- Si le besoin est déjà bien formulé, garde-le tel quel.
```

**User prompt :**
```
Le chef de projet a décrit son besoin ainsi :
"{{Q1_VALUE}}"

Analyse cette description et réponds avec ce JSON exact :
{
  "problemReformulated": "Le vrai problème en 1 phrase claire, orienté résultat",
  "isSolutionOriented": true ou false,
  "detectedSignals": ["signal1", "signal2"],
  "clarifyingQuestion": "Une question à poser si le besoin est flou, sinon null",
  "confidence": "high|medium|low"
}
```

**Comportement attendu :**
- `isSolutionOriented = true` → afficher : "Vous décrivez une solution, pas un problème. Voici le problème reformulé :"
- `confidence = low` → afficher `clarifyingQuestion` avant de passer à Q2
- `detectedSignals` liste les mots-clés technologiques détectés dans la saisie

---

### Prompt 2 — Analyse fournisseur

**System prompt :**
```
Tu es un analyste technique senior spécialisé dans l'évaluation de solutions IA pour le secteur public français.
Tu analyses des documents fournisseurs (propositions commerciales, fiches techniques, réponses à appel d'offres).

Tes règles absolues :
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.
- Sois factuel et précis : cite des éléments du document quand tu identifies un problème.
- Ne fais pas de publicité pour le fournisseur : reste neutre et critique.
- Identifie les promesses non vérifiables, les dépendances cachées, les coûts non mentionnés.
- Adapte les questions au profil du projet fourni en contexte.
```

**User prompt :**
```
PROFIL DU PROJET :
- Besoin : {{PROBLEM_REFORMULATED}}
- Décision recommandée : {{VERDICT}}
- Type d'IA recommandé : {{TECH_RECOMMENDATION}}
- Données personnelles : {{DATA_TYPES}}
- Niveau de risque réglementaire : {{REG_LEVEL}}

DOCUMENT FOURNISSEUR :
{{DOCUMENT_CONTENT}}

Analyse ce document et réponds avec ce JSON exact :
{
  "vendorName": "nom du fournisseur ou Non identifié",
  "solutionType": "type de solution proposée en 5 mots max",
  "fitScore": 1 à 5,
  "fitJustification": "2 phrases expliquant l'adéquation au besoin",
  "redFlags": [
    {
      "severity": "high|medium|low",
      "claim": "affirmation exacte du document",
      "concern": "pourquoi c'est problématique"
    }
  ],
  "hiddenDependencies": ["dépendance 1", "dépendance 2"],
  "questionsToAsk": [
    {
      "question": "Question précise à poser au fournisseur",
      "why": "Pourquoi cette question est importante"
    }
  ],
  "regulatoryGaps": ["obligation non couverte 1"],
  "recommendation": "PROCEED|CAUTION|AVOID",
  "recommendationReason": "1 phrase de justification"
}
```

**Règles :**
- `questionsToAsk` : minimum 5 questions, adaptées au profil projet
- `documentContent` : tronquer à 3000 tokens si nécessaire (garder intro + sections techniques + conclusion)
- `redFlags` vide si le document est honnête — ne pas inventer
- `regulatoryGaps` : croiser avec le niveau de risque réglementaire du projet

---

### Prompt 3 — Génération du rapport final

**System prompt :**
```
Tu génères un rapport de pré-cadrage IA d'une page A4 pour un chef de projet de collectivité publique.
Langage simple, professionnel, accessible. Pas de jargon technique.
Réponds en markdown structuré uniquement.
```

**User prompt :**
```
DONNÉES DU PROJET : {{ALL_ANSWERS_JSON}}
DÉCISION : {{DECISION_JSON}}
ALERTES RÉGLEMENTAIRES : {{REGULATORY_ALERTS_JSON}}
ANALYSE FOURNISSEUR (si présente) : {{VENDOR_ANALYSIS_JSON}}

Génère un rapport markdown avec exactement ces sections :

# Rapport de pré-cadrage IA — {{PROJECT_NAME}}
**Date :** {{DATE}} | **Chef de projet :** {{USER_NAME}}

## 1. Résumé du besoin
(3 lignes max)

## 2. Décision recommandée
**[BADGE : GO / POC / ÉTUDE / AUTOMATISATION / NO GO]**
(5 lignes de justification)

## 3. Technologie recommandée
(Expliquer en langage simple ce qu'est RPA / ML / LLM / RAG / OCR / AGENT)

## 4. Obligations réglementaires
(Liste des alertes avec niveau et action concrète)

## 5. Questions à poser au fournisseur
(Si analyse fournisseur présente — 5 questions)

## 6. Prochaines étapes
(3 actions concrètes avec responsable suggéré)

Règles de rédaction :
- Chaque section : 5 lignes maximum
- Pas de bullet points imbriqués sur plus de 2 niveaux
- Ton professionnel mais accessible
- Pas de jargon technique
```

---

## STRUCTURE DES PAGES

```
/                          → Redirect vers /dashboard
/auth/signin               → Page de connexion
/dashboard                 → Liste projets + KPIs portfolio
/projects/new              → Création projet (3 champs)
/projects/[id]             → Vue projet complète
/projects/[id]/wizard      → Parcours 10 questions (1 question par écran)
/projects/[id]/results     → Page de résultats (décision + réglementation + PDF)
/projects/[id]/vendor      → Module analyse fournisseur (optionnel)
/settings                  → Configuration LLM provider
```

---

## DASHBOARD — KPIs À AFFICHER

```
Carte 1 : Nombre total de projets
Carte 2 : Répartition GO / POC / ÉTUDE / AUTO / NOGO (donut chart)
Carte 3 : Projets à risque réglementaire élevé (count + liste)
Carte 4 : Distribution techRecommendation (bar chart)
Table   : Liste projets avec colonnes : Nom / Direction / Verdict / Tech / Risque réglementaire / Date
```

---

## VARIABLES D'ENVIRONNEMENT REQUISES

```env
# Base de données
DATABASE_PROVIDER=sqlite          # ou postgresql
DATABASE_URL=file:./dev.db        # ou postgres://...

# LLM Provider
LLM_PROVIDER=stub                 # stub | openai | mistral | ollama
OPENAI_API_KEY=                   # si LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
MISTRAL_API_KEY=                  # si LLM_PROVIDER=mistral
MISTRAL_MODEL=mistral-small-latest
OLLAMA_BASE_URL=http://localhost:11434  # si LLM_PROVIDER=ollama
OLLAMA_MODEL=mistral

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_NAME=AI Pré-Cadrage
```

---

## DOCKER COMPOSE (on-premise)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_PROVIDER=postgresql
      - DATABASE_URL=postgresql://postgres:password@db:5432/precadrage
      - LLM_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://ollama:11434
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
      - ollama

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: precadrage
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  ollama:
    image: ollama/ollama
    volumes:
      - ollama_data:/root/.ollama

volumes:
  pgdata:
  ollama_data:
```

---

## DONNÉES DE DÉMONSTRATION (seed)

### Projet 1 — Traitement emails MDPH
```
name: "Automatisation boîtes mails MDPH"
direction: "MDPH"
Q1: "On reçoit 500 emails par jour et les agents passent 3h à les trier manuellement"
Q2: daily_multiple
Q3: [agents, users]
Q4: variable
Q5: high_complex
Q6: yes_scattered
Q7: [social, identity]
Q8: auto_with_human
Q9: to_check
Q10: partial
QR1: yes_france
QR2: no
QR3: yes_always
→ Verdict attendu : POC | Tech : LLM | Risque : MEDIUM
```

### Projet 2 — Interprétariat PMI
```
name: "IA traduction interprétariat PMI"
direction: "PMI"
Q1: "Les familles non francophones n'arrivent pas à communiquer lors des consultations"
Q2: daily
Q3: [users]
Q4: complex
Q5: low_complex
Q6: no
Q7: [health]
Q8: assist_only
Q9: unknown
Q10: not_asked
QR1: unknown
QR2: no
QR3: yes_always
→ Verdict attendu : STUDY (R3 : pas de données) | Risque : MEDIUM
```

### Projet 3 — LAD MDPH (Lecture Automatique Documents)
```
name: "LAD MDPH — Multigest.ai"
direction: "MDPH"
Q1: "Les dossiers papier MDPH doivent être saisis manuellement dans le SI, c'est long et source d'erreurs"
Q2: daily_multiple
Q3: [agents, users]
Q4: mostly_stable
Q5: high_simple
Q6: yes_structured
Q7: [health, social, identity]
Q8: auto_with_human
Q9: yes_api
Q10: ready
QR1: yes_france
QR2: yes_planned
QR3: yes_always
→ Verdict attendu : POC | Tech : OCR | Risque : MEDIUM
```

---

## PLAN DES 6 SESSIONS CLAUDE CODE

```
Session 1 : Init + structure
  - Nouveau repo Next.js + TypeScript + Tailwind + shadcn
  - Schéma Prisma (8 modèles de ce document)
  - Abstraction LLM (StubProvider + OpenAIProvider)
  - Layout principal + navigation

Session 2 : Parcours de cadrage
  - Page création projet (/projects/new)
  - Wizard une question par écran (/projects/[id]/wizard)
  - Autosave Answer à chaque réponse
  - Intégration Prompt 1 (reformulation Q1)

Session 3 : Moteur de décision + page résultats
  - Moteur scoring 6 axes
  - 6 règles dures R1-R6
  - Arbre techRecommendation
  - Génération RegulatoryAlerts
  - Page résultats (/projects/[id]/results)

Session 4 : Export PDF + module fournisseur
  - Prompt 3 → génération markdown rapport
  - Export PDF via @react-pdf/renderer
  - Module analyse fournisseur (/projects/[id]/vendor)
  - Intégration Prompt 2

Session 5 : Dashboard + données démo
  - Dashboard KPIs + charts
  - Seed 3 projets démo
  - Vérification parcours complet < 15 minutes

Session 6 : Docker + déploiement
  - Docker Compose (app + PostgreSQL + Ollama)
  - Variables d'environnement
  - README déploiement on-premise
```

---

## INSTRUCTIONS POUR CLAUDE CODE

1. **Commence toujours par la Session 1** — ne pas sauter d'étapes
2. **Un fichier = une responsabilité** — pas de logique métier dans les composants UI
3. **Le moteur de décision est dans `/lib/engine/`** — séparé de l'UI et des API routes
4. **Les prompts LLM sont dans `/lib/prompts/`** — un fichier par prompt
5. **StubProvider par défaut** — l'app doit fonctionner sans clé API
6. **Autosave obligatoire** — chaque Answer sauvegardée immédiatement, pas de bouton "Enregistrer tout"
7. **Mobile-friendly** — le chef de projet peut utiliser l'outil sur tablette
8. **Pas de complexité visible** — le scoring et les règles tournent en arrière-plan, l'utilisateur ne voit que la décision finale

---

*SPEC v1.0 — Générée le 04/06/2026*
*Basée sur l'analyse du besoin réel du CD93 — Conseil Départemental de Seine-Saint-Denis*
