# Déploiement sur VPS OVH — ia-decision.com

Guide pas-à-pas pour héberger AI Pré-Cadrage sur le VPS OVH, avec HTTPS
automatique et le domaine **ia-decision.com**.

| Élément | Valeur |
|---|---|
| VPS | VPS-2 2026 — 6 vCores, 12 Go RAM, 100 Go (Gravelines, FR) |
| OS | Ubuntu 26.04 |
| IPv4 | `164.132.41.177` |
| IPv6 | `2001:41d0:305:2100::1:3050` |
| Domaine | `ia-decision.com` (DNS chez GoDaddy) |

---

## 1. DNS chez GoDaddy

Objectif : faire pointer le domaine vers le VPS. Dans **GoDaddy → Mon domaine →
DNS** :

1. **Désactiver le « Website Builder »** s'il est actif (sinon l'enregistrement
   `A @ → WebsiteBuilder Site` est verrouillé) : Produits → Website Builder →
   le déconnecter du domaine.
2. **Supprimer** l'enregistrement `A  @  WebsiteBuilder Site`.
3. **Ajouter** :

   | Type | Nom | Valeur | TTL |
   |---|---|---|---|
   | A | @ | `164.132.41.177` | 1 h |
   | AAAA | @ | `2001:41d0:305:2100::1:3050` | 1 h |

4. **Garder** `CNAME  www → ia-decision.com` (le `www` suivra l'apex).
5. Les enregistrements `NS`, `SOA`, `_dmarc`, `cname pay …` peuvent rester.

> Propagation : jusqu'à ~1 h. Vérifier : `dig +short ia-decision.com` doit
> renvoyer `164.132.41.177`.

---

## 2. Connexion et sécurisation rapide

```bash
ssh ubuntu@164.132.41.177        # ou root@… selon l'image OVH
sudo apt update && sudo apt -y upgrade

# Pare-feu : SSH + HTTP + HTTPS uniquement
sudo apt -y install ufw
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Un peu de swap (sécurité mémoire si Ollama charge un modèle)
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. Installer Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# se déconnecter/reconnecter pour appliquer le groupe, puis :
docker --version && docker compose version
```

---

## 4. Récupérer le code et configurer

```bash
git clone https://github.com/ucef90/New-AI-DecisionNavigator.git
cd New-AI-DecisionNavigator

cp .env.prod.example .env
# Générer le secret de session
echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env
nano .env   # renseigner ACME_EMAIL, ADMIN_EMAIL, ADMIN_PASSWORD, et la clé LLM
```

Variables clés à remplir dans `.env` :
- `ACME_EMAIL` : ton email (certificats Let's Encrypt).
- `AUTH_SECRET` : déjà ajouté par la commande ci-dessus.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` : l'admin créé au 1er login.
- **Profil A (recommandé)** : `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=…`
- **Profil B (souverain)** : `LLM_PROVIDER=ollama` (puis pull du modèle, étape 6).

---

## 5. Lancer

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f caddy   # voir l'émission du certificat
```

Caddy obtient automatiquement le certificat HTTPS pour `ia-decision.com` dès que
le DNS pointe sur le VPS. Le site est alors accessible sur
**https://ia-decision.com** (et `www` redirige vers l'apex).

---

## 6. Modèles Ollama (embeddings, et LLM si Profil B)

```bash
# Embeddings (RAG) — recommandé dans tous les cas (léger, rapide en CPU)
docker compose -f docker-compose.prod.yml exec ollama ollama pull nomic-embed-text

# LLM local — uniquement si Profil B (souverain) ; lent en CPU
docker compose -f docker-compose.prod.yml exec ollama ollama pull qwen2.5:3b
```

Puis, dans l'app : **Paramètres** → vérifier le fournisseur LLM / embeddings, et
**Connaissances → « Charger le référentiel »** pour amorcer le corpus RAG.

---

## 7. Première connexion

1. Ouvrir **https://ia-decision.com/auth/signin**.
2. Se connecter avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` (le compte admin est créé
   automatiquement au premier login).
3. **Changer le mot de passe** ensuite (et idéalement créer des comptes dédiés).

---

## 8. Vérifications

```bash
curl -s https://ia-decision.com/api/health
# → {"ok":true,"db":"ok","llm":"…","embedding":"…","knowledge":{…}}
```

---

## 9. Mises à jour

```bash
cd New-AI-DecisionNavigator
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Le schéma de base est appliqué automatiquement au démarrage du conteneur.

---

## 10. Sauvegardes

- **Données applicatives** : volume Docker `app_data` (base SQLite). Sauvegarde :
  ```bash
  docker run --rm -v newaidecisionnavigator_app_data:/data -v $PWD:/backup \
    busybox tar czf /backup/backup-$(date +%F).tgz -C /data .
  ```
- **Snapshot OVH** : activer le *Backup automatisé* / *Snapshot* dans l'espace
  client OVH pour une restauration complète de la machine.

---

## Notes de capacité (ce VPS)

- App + SQLite + embeddings locaux : confortable.
- **Profil A** (LLM Anthropic) : fluide, recommandé pour plusieurs utilisateurs.
- **Profil B** (LLM Ollama, CPU sans GPU) : fonctionne mais générations lentes —
  réserver à un faible trafic ; augmenter le délai dans Paramètres (ex. 300 s).
- Montée en charge / RAG volumineux : voir `docs/RAG-SCALING.md` (PostgreSQL +
  pgvector).
