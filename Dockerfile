# ── Image de production AI Pré-Cadrage ────────────────────────
FROM node:20-slim AS base
WORKDIR /app
# openssl requis par le moteur Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ── Dépendances ───────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# URL factice : le build ne se connecte pas à la base (pages dynamiques)
ENV DATABASE_URL="file:./build.db"
RUN npx prisma generate && npm run build

# ── Runner ────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/prisma ./prisma
# tsconfig.json + sources lib/ : nécessaires pour que `prisma db seed` (tsx)
# résolve l'alias @/* et trouve le code importé (moteur, rapport, RAG…).
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/lib ./lib

EXPOSE 3000
# Applique le schéma puis démarre. `db push` est agnostique du provider
# (sqlite ou postgresql) et provisionne la base au démarrage.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm run start"]
