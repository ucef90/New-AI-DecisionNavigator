# Stack technologique — AI Pré-Cadrage

Document de référence des technologies utilisées dans le SaaS **AI Pré-Cadrage**
(outil de pré-cadrage IA pour collectivités). Versions issues de `package.json`.

---

## Vue d'ensemble

| Couche | Technologies clés |
|---|---|
| **Framework** | Next.js 14 (App Router, RSC, Server Actions) |
| **Langage** | TypeScript 5 |
| **UI / Design** | Tailwind CSS 3.4 · shadcn/ui (Radix UI) · animate-ui · Motion |
| **Base de données** | SQLite (dev) / PostgreSQL (prod) via Prisma 6 |
| **IA / LLM** | Abstraction multi-provider : Ollama (local) · OpenAI · Mistral · Stub |
| **PDF / documents** | @react-pdf/renderer (génération) · pdf-parse (extraction) |
| **Déploiement** | Docker + Docker Compose (on-premise) |

---

## 1. Cœur applicatif

| Techno | Version | Rôle |
|---|---|---|
| **Next.js** | 14.2.35 | Framework full-stack : App Router, Server Components, Server Actions, route handlers |
| **React** | 18 | Bibliothèque UI |
| **React DOM** | 18 | Rendu DOM + hooks Server Actions (`useFormState`, `useFormStatus`) |
| **TypeScript** | 5 | Typage statique de toute la base de code |
| **Node.js** | 20+ (runtime) | Exécution serveur |

**Patterns** : Server Components par défaut, Server Actions pour les mutations
(création projet, autosave, analyse fournisseur, upload, suppression),
route handler Node pour l'export PDF.

---

## 2. Base de données & ORM

| Techno | Version | Rôle |
|---|---|---|
| **Prisma** | 6.19.3 | ORM, schéma typé, migrations, `prisma db seed`, Prisma Studio |
| **@prisma/client** | 6.19.3 | Client de requêtes généré |
| **SQLite** | — | Base de développement (zéro installation) |
| **PostgreSQL** | 15 | Base de production (Docker) |

**Modèles** : `User`, `Project`, `Answer`, `Decision`, `RegulatoryAlert`,
`VendorAnalysis`, `Report`, `Attachment`, `AuditLog` (+ enums).

> Prisma est épinglé en **v6** (la v7 supprime `url` du schéma). Le passage
> SQLite → PostgreSQL se fait en changeant le `provider` dans `schema.prisma`.

---

## 3. IA / LLM

| Techno | Rôle |
|---|---|
| **Couche d'abstraction maison** (`lib/llm/`) | Interface unique `complete(prompt, opts)` — bascule de provider via `LLM_PROVIDER` |
| **Ollama** (local) | Modèles IA on-premise (par défaut `qwen2.5:3b`), aucune donnée ne sort |
| **OpenAI** | Provider cloud (optionnel, `response_format: json`) |
| **Mistral** | Provider cloud (optionnel) |
| **Stub** | Provider déterministe **sans IA** : reformulation, analyse fournisseur basée sur le contenu, rapport — fonctionne sans clé ni serveur |

**3 prompts métier** (`lib/prompts/`) : reformulation du besoin (Q1),
analyse fournisseur, génération du rapport. Mode JSON + timeout + repli
automatique sur le Stub si l'IA est indisponible ou trop lente.

> Le **moteur de décision** (`lib/engine/`) est **100 % déterministe** (règles,
> pas de LLM) : scoring 6 axes, règles dures R1-R6, arbre techno, alertes.

---

## 4. UI, design & animation

| Techno | Version | Rôle |
|---|---|---|
| **Tailwind CSS** | 3.4 | Styles utilitaires |
| **shadcn/ui** | — | Composants (button, card, dialog, table, select…) basés sur Radix |
| **Radix UI** | 1.x | Primitives accessibles (dialog, dropdown, checkbox, radio, tabs, select…) |
| **animate-ui** | — | Composants animés (icônes Activity/CloudSunRain, RotatingText, SlidingNumber, GradientBackground, RippleButton) |
| **Motion** | 12.40 | Animations (reveals, stagger, radar, transitions de page) — respect `prefers-reduced-motion` |
| **Phosphor Icons** | 2.1 | Iconographie (import SSR-safe) |
| **next-themes** | 0.4 | Thème clair / sombre (sombre par défaut) |
| **class-variance-authority** | 0.7 | Variantes de composants |
| **clsx** + **tailwind-merge** | 2.1 / 3.6 | Fusion de classes (`cn`) |
| **tailwindcss-animate** | 1.0 | Keyframes d'animation Tailwind |
| **sonner** | 2.0 | Notifications (toasts) |
| **react-use-measure** | 2.1 | Mesure de dimensions (animate-ui) |
| **Police** | DM Sans (`next/font`) + Geist Mono | Typographie |

**Design system** : thème sombre indigo institutionnel, graphes maison en SVG
(radar technologique, jauges), accent unique verrouillé.

---

## 5. PDF & documents

| Techno | Version | Rôle |
|---|---|---|
| **@react-pdf/renderer** | 4.5 | Génération du rapport PDF (bannière, barres de score, radar SVG, jauge de risque) |
| **pdf-parse** | 2.4 | Extraction de texte des PDF (analyse fournisseur, documents projet) |

> `pdf-parse` / `pdfjs-dist` sont déclarés en `serverComponentsExternalPackages`
> (non bundlés) ; `serverActions.bodySizeLimit` relevé à 15 Mo pour l'upload.

---

## 6. Outils de développement & qualité

| Techno | Version | Rôle |
|---|---|---|
| **ESLint** | 8 + eslint-config-next | Linting |
| **tsx** | 4.22 | Exécution TypeScript (script de seed) |
| **PostCSS** | 8 | Pipeline CSS (Tailwind) |
| **Prisma Migrate / Studio** | 6.19 | Migrations & exploration de la base |

---

## 7. Déploiement (on-premise)

| Techno | Rôle |
|---|---|
| **Docker** | Conteneurisation de l'application |
| **Docker Compose** | Orchestration : `docker-compose.yml` (SQLite + Ollama) et `docker-compose.postgres.yml` (PostgreSQL + Ollama) |
| **Ollama** (conteneur) | IA locale pour un déploiement 100 % souverain |
| **OS cibles** | Ubuntu 22.04 LTS / Debian 12 LTS |

---

## Principes d'architecture

- **Souveraineté** : tout fonctionne **on-premise**, IA locale, aucune donnée
  obligatoirement envoyée à l'extérieur.
- **Séparation des responsabilités** : moteur de décision et prompts dans
  `lib/`, isolés de l'UI.
- **Résilience** : repli déterministe (Stub) si l'IA est indisponible.
- **Accessibilité** : composants Radix, contrastes, `prefers-reduced-motion`.
- **Sécurité / conformité** : RGPD, IA Act, ISO 27001/42001 (cf. moteur réglementaire).

---

*Stack au format Next.js 14 / TypeScript. Voir `package.json` pour les versions exactes et `README.md` pour le démarrage.*
