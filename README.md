# AI Pré-Cadrage

Outil de pré-cadrage IA pour chefs de projet de collectivités publiques. Il guide vers une décision argumentée (**GO / POC / ÉTUDE / AUTOMATISATION / NO GO**), recommande un type de technologie (RPA, ML, LLM, RAG, OCR, AGENT), liste les obligations réglementaires (RGPD, IA Act, ISO 42001) et produit un rapport PDF d'une page — le tout en moins de 15 minutes.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind + shadcn/ui · Prisma (SQLite en dev, PostgreSQL en prod) · abstraction LLM (OpenAI / Mistral / Ollama / Stub) · @react-pdf/renderer.

## Démarrage (développement)

```bash
npm install
cp .env.example .env
npm run db:migrate      # crée la base SQLite + applique le schéma
npm run db:seed         # 3 projets de démonstration (décisions calculées par le moteur)
npm run dev             # http://localhost:3000
```

L'application fonctionne **sans clé API** : `LLM_PROVIDER=stub` renvoie des réponses déterministes. Pour brancher un vrai modèle, voir les variables ci-dessous.

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build et lancement production |
| `npm run db:migrate` | Migration Prisma (dev) |
| `npm run db:seed` | Données de démonstration |
| `npm run db:studio` | Explorateur de base Prisma |

## Variables d'environnement

Voir [.env.example](.env.example). Principales :

- `DATABASE_PROVIDER` / `DATABASE_URL` — `sqlite` (dev) ou `postgresql` (prod)
- `LLM_PROVIDER` — `stub` | `openai` | `mistral` | `ollama`
- `OPENAI_API_KEY` / `MISTRAL_API_KEY` / `OLLAMA_BASE_URL` selon le provider
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL`

## Architecture

```
app/                    Pages (App Router) + Server Actions + route PDF
components/             UI (shadcn), layout, wizard, dashboard, décision, fournisseur
lib/
  db.ts                 Client Prisma (singleton)
  llm/                  Abstraction LLM + providers (stub/openai/mistral/ollama)
  questions/            Définition du parcours (10 questions + 3 réglementaires)
  engine/               Moteur de décision (scoring 6 axes, règles R1-R6, techno, alertes)
  prompts/              Prompts LLM (reformulation, fournisseur, rapport)
  report/               Génération du rapport (Prompt 3)
  pdf/                  Document PDF (react-pdf)
prisma/                 schema.prisma + migrations + seed
```

Le moteur de décision et les prompts sont **séparés de l'UI** : toute la logique métier vit dans `lib/`.

## Déploiement on-premise (Docker)

### Version simple — SQLite (démarre immédiatement)

```bash
docker compose up --build
# → http://localhost:3000 (données persistées dans un volume)
```

### Cible SPEC — PostgreSQL + Ollama

1. Dans `prisma/schema.prisma`, mettre `provider = "postgresql"` dans le bloc `datasource` (Prisma ne permet pas de choisir le provider via une variable d'environnement).
2. Lancer :

```bash
docker compose -f docker-compose.postgres.yml up --build
docker compose -f docker-compose.postgres.yml exec ollama ollama pull mistral
```

Le conteneur applique automatiquement le schéma (`prisma db push`) au démarrage.

## État du projet

Construit en 6 sessions. Livré : init + schéma, parcours de cadrage (wizard + autosave + reformulation LLM), moteur de décision, export PDF + analyse fournisseur, dashboard avec graphiques, déploiement Docker. **À venir** : authentification NextAuth (mode mono-utilisateur pour l'instant).
