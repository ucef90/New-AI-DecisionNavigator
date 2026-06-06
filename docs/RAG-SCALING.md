# RAG — passage à l'échelle

## État actuel (force brute)

La recherche sémantique compare le vecteur de la requête à chaque fragment par
**similarité cosinus en JavaScript** :

- Les vecteurs sont stockés en JSON sur `KnowledgeChunk.embedding`.
- `retrieve()` charge les vecteurs des candidats (filtrés par modèle + périmètre),
  calcule le cosinus, puis ne charge le contenu que pour le top-k (récupération
  en 2 phases — voir `lib/rag/retrieve.ts`).
- Un plafond `maxCandidates` (6000 par défaut) borne la mémoire ; au-delà, la
  recherche est **tronquée** et un avertissement est journalisé.

**Suffisant** pour des centaines à quelques milliers de fragments (usage d'une
collectivité). **Ne tient pas** au-delà : tout le pool est scoré à chaque requête.

## Quand migrer

Indices qu'il faut passer à une base vectorielle :

- Le corpus dépasse ~5 000–10 000 fragments (`KnowledgeChunk`).
- L'avertissement `corpus > 6000 fragments : recherche tronquée` apparaît.
- La latence de `retrieve()` devient sensible (> 200 ms).

## Voie recommandée : pgvector (PostgreSQL)

Le projet prévoit déjà PostgreSQL en production (`docker-compose.postgres.yml`).
`pgvector` ajoute un type `vector` et une recherche ANN indexée (`<=>`).

### Étapes

1. **Basculer la datasource** sur PostgreSQL (`prisma/schema.prisma` →
   `provider = "postgresql"`, `DATABASE_URL=postgres://…`).
2. **Activer l'extension** et ajouter une colonne vectorielle (migration SQL
   manuelle, Prisma ne typant pas encore `vector` nativement) :

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ALTER TABLE "KnowledgeChunk" ADD COLUMN embedding_vec vector(768);
   CREATE INDEX knowledge_chunk_embedding_idx
     ON "KnowledgeChunk" USING hnsw (embedding_vec vector_cosine_ops);
   ```

   > La dimension dépend du modèle d'embedding (`nomic-embed-text` = 768,
   > `text-embedding-3-small` = 1536, repli local `hash` = 384). Conserver le
   > tag de modèle (`KnowledgeChunk.model`) pour ne comparer que des vecteurs
   > du même espace, et réindexer en cas de changement de modèle.

3. **Écrire le vecteur** lors de l'ingestion (en plus du JSON, ou à la place) :
   `embedding_vec` reçoit le tableau de flottants.
4. **Remplacer la recherche** par une requête SQL paramétrée (`prisma.$queryRaw`)
   triant par distance cosinus, filtrée par `model` et périmètre :

   ```sql
   SELECT id, "documentId", source
   FROM "KnowledgeChunk"
   WHERE model = $1 AND ("projectId" IS NULL OR "projectId" = $2)
   ORDER BY embedding_vec <=> $3::vector
   LIMIT $4;
   ```

   La logique applicative (dédup par document, phase 2 pour le contenu) reste
   identique ; seul le scoring passe en base.

### Encapsulation

`retrieve()` est le **seul** point d'entrée de la récupération (tout le reste
appelle `retrieve` / `buildKnowledgeBlock`). Le passage à pgvector se fait donc
dans un seul fichier (`lib/rag/retrieve.ts`) + l'ingestion (`lib/rag/ingest.ts`),
sans toucher aux appelants (contexte, fournisseur, rapport, reformulation).

## Alternatives

- **SQLite + sqlite-vec** : garde l'on-premise sans Postgres, mais extension
  native à compiler/charger — plus fragile à déployer.
- **Base vectorielle dédiée** (Qdrant, Weaviate en local) : performante, mais
  ajoute un service à exploiter — à réserver aux très gros volumes.
