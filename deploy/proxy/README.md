# Reverse proxy partagé du VPS

Point d'entrée HTTPS **unique** du serveur (ports 80/443). Il aiguille le trafic
vers le bon site selon le nom de domaine, via le réseau Docker externe `web`.

Les sites restent **totalement isolés** entre eux : conteneurs, bases et secrets
séparés. Le proxy ne fait que router — il ne partage aucune donnée.

```
Internet :443 ─► Caddy (ce proxy)
                   ├─ ia-decision.com      → app:3000          (AI Pré-Cadrage)
                   └─ beyond-expertise.com → beyond-site:3000  (Site Beyond Expertise 2026)
```

## Démarrage (une fois)

```bash
# Le réseau partagé doit exister
docker network create web 2>/dev/null || true

cd deploy/proxy
cp .env.example .env
nano .env            # renseigner ACME_EMAIL
docker compose up -d
docker compose logs -f caddy   # voir l'émission des certificats
```

## Ajouter un nouveau site

1. Le service du site rejoint le réseau externe `web` avec un **nom unique**
   (pas `app`), sans publier 80/443.
2. Ajouter un bloc dans `Caddyfile` :
   ```
   mon-domaine.com {
       encode zstd gzip
       reverse_proxy nom-du-service:PORT
   }
   ```
3. Recharger le proxy : `docker compose up -d` (dans `deploy/proxy/`).
4. Faire pointer le DNS du domaine → IP du VPS (A + AAAA).

## Prérequis par site

- Ne publie **pas** 80/443, n'embarque **pas** de proxy.
- Service web sur le réseau externe `web`, nom de service unique.
- DNS du domaine pointant vers le VPS.
