# Architecture de solution — LAD MDPH

**Lecture Automatique de Documents pour Maison Départementale des Personnes Handicapées**

> Document de référence · Architecture & technologies · Déploiement on-premise souverain
> Exemple structuré pour un projet de type « POC → industrialisation » au sein d'une collectivité (CD93).

---

## 0. Résumé exécutif

| | |
|---|---|
| **Besoin** | Supprimer la saisie manuelle des dossiers papier MDPH dans le SI Métier (long, source d'erreurs). |
| **Solution** | Chaîne de traitement documentaire : numérisation → découpe → classification → extraction → contrôles → ventilation → versement en GED / création de la demande dans le SI Métier. |
| **Décision de cadrage** | **POC** recommandé avant industrialisation · Technologie **OCR/ICR + classification documentaire** · Risque réglementaire **moyen** (données de santé). |
| **Principe directeur** | **100 % on-premise**, aucune donnée de santé ne quitte le périmètre de la collectivité. Supervision humaine systématique. **Pas d'IA générative** sur les données usagers. |
| **Délai cible POC** | 8 à 12 semaines sur un périmètre restreint (1 type de flux, 1 équipe). |

---

## 1. Contexte & objectifs

### 1.1 Contexte métier
La MDPH reçoit un volume élevé de dossiers (demandes CERFA, certificats médicaux, justificatifs) au format papier ou numérisé. Chaque dossier est aujourd'hui **trié, identifié et saisi manuellement**, ce qui allonge les délais d'instruction et mobilise les agents sur des tâches répétitives à faible valeur ajoutée.

### 1.2 Objectifs
| # | Objectif | Indicateur cible |
|---|----------|------------------|
| O1 | Réduire le temps de tri/saisie | −70 % de temps agent sur le tri |
| O2 | Fiabiliser l'identification des pièces | ≥ 95 % de classification correcte (périmètre entraîné) |
| O3 | Réduire les délais d'instruction | −30 % sur le délai scan → dossier prêt |
| O4 | Garantir la conformité (RGPD / IA Act) | 100 % des décisions supervisées par un agent |
| O5 | Rester souverain | 0 transfert de données hors du périmètre MDPH |

### 1.3 Périmètre

**Inclus**
- Découpe automatique des plis numérisés et identification des pièces.
- Classification selon un plan de classement métier (taxonomie MDPH).
- Extraction de métadonnées (identité, domicile, dates, NIR, signatures…).
- Contrôles de recevabilité (complétude, cohérence, présence des pièces obligatoires).
- Ventilation vers les bannettes agents + versement en GED.
- Interface d'arbitrage humaine.

**Exclus (à ce stade)**
- Décision automatisée sur les droits des usagers (interdit : supervision humaine obligatoire).
- Entraînement de modèles sur des types de documents nouveaux/locaux (relève d'un lot ultérieur).
- IA générative sur les données usagers.

---

## 2. Vue fonctionnelle

### 2.1 Workflow cible

```
[1] Numérisation / dépôt        Scanner, bannette GED, messagerie, dossier partagé
        │
        ▼
[2] Ingestion                   Récupération des plis, conversion, normalisation image
        │
        ▼
[3] Découpe                     Séparation des pièces d'un pli multi-documents
        │
        ▼
[4] OCR / ICR                   Océrisation (texte imprimé + manuscrit)
        │
        ▼
[5] Classification              Typage de chaque pièce selon la taxonomie
        │
        ▼
[6] Extraction                  Métadonnées (identité, domicile, dates, NIR…)
        │
        ▼
[7] Contrôles                   Complétude, cohérence, pièces obligatoires
        │
        ▼
[8] Arbitrage (si besoin)       L'agent corrige les cas signalés "faible confiance"
        │
        ▼
[9] Ventilation + GED           Bannette agent, intercalaires, nommage, versement
        │
        ▼
[10] Création demande SI Métier  Via API éditeur (le cas échéant)
```

### 2.2 Règles métier (paramétrables)

| Domaine | Exemple de règle |
|---|---|
| Découpe | Une coupure mal placée impactant 2 pièces = 1 seule correction. |
| Classification | Regroupement possible de types proches sous un même intercalaire. |
| Extraction | Universalité d'une extraction (ex. signature/date sur tout courrier). |
| Contrôle | « S'il y a un CERFA de demande, il doit y avoir un justificatif d'identité + un certificat médical + un justificatif de domicile. » |
| Contrôle | « Certificat médical daté de moins de 12 mois, signé et tamponné (RPPS/ADELI). » |
| Ventilation | Routage par type de dossier / territoire vers la bonne bannette d'équipe. |
| Supervision | Les dossiers « ambigus » (faible score) ne sont pas ventilés automatiquement et passent en arbitrage. |

---

## 3. Architecture technique

### 3.1 Principes directeurs
1. **Souveraineté & on-premise** : déploiement dans une VM dédiée du SI de la collectivité ; les données restent dans le périmètre.
2. **Modularité** : chaque étape (découpe, OCR, classification, extraction, règles) est un service indépendant et remplaçable.
3. **Human-in-the-loop** : l'IA assiste, l'agent décide. Toute décision est traçable et révisable.
4. **Explicabilité** : pas de boîte noire ; chaque résultat porte un score de confiance et un journal.
5. **Sécurité par conception** : chiffrement, RBAC/SSO, flux réseau minimaux, journalisation.

### 3.2 Vue logique en couches

```
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE ENTRÉES                                                       │
│  Scanner · Bannette GED · Messagerie (Outlook) · Dossier partagé      │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE PLATEFORME (reverse proxy TLS + orchestration des règles)     │
│  Traefik (TLS, SSO)  ·  Moteur de règles métier (Apache NiFi)         │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE TRAITEMENT IA                                                 │
│  Découpe → OCR/ICR → Classification → Extraction → Contrôles          │
│  (services Python / FastAPI + modèles servis par TorchServe)          │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE DONNÉES                                                       │
│  PostgreSQL (config/états) · MongoDB (métadonnées/annotations)        │
│  Redis (file d'attente, sessions) · Object store (images chiffrées)   │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE RESTITUTION                                                   │
│  Front-end React (UI agents + interface d'arbitrage)                  │
│  Connecteurs sortie : GED Multigest/Efalia · API SI Métier            │
└─────────────────────────────────────────────────────────────────────┘

  COUCHE TRANSVERSE — Observabilité & sécurité
  Prometheus + Grafana (métriques) · ELK (logs) · Keycloak (SSO/RBAC)
```

### 3.3 Flux de traitement (séquence)
1. Le pli arrive en bannette → NiFi détecte et déclenche le pipeline.
2. Le service de **découpe** segmente le pli ; chaque pièce part en file Redis.
3. **OCR/ICR** océrise ; le texte + l'image normalisée alimentent la **classification**.
4. La **classification** type la pièce (score de confiance) ; l'**extraction** récupère les champs.
5. Le **moteur de contrôles** applique les règles ; chaque contrôle produit `ok` / `nok`.
6. Si confiance faible ou contrôle bloquant → mise en **arbitrage** (pas de ventilation auto).
7. Sinon → **ventilation** + intercalaires + nommage + **versement GED** + création demande SI Métier.
8. Métriques et journaux émis tout au long (Prometheus / ELK).

---

## 4. Stack technologique

> Choix alignés sur un déploiement on-premise souverain, conteneurisé, sans dépendance cloud obligatoire.

| Couche | Technologie | Rôle | Pourquoi ce choix | Alternative |
|--------|-------------|------|-------------------|-------------|
| Reverse proxy | **Traefik** | TLS, routage, intégration SSO | Léger, config dynamique, certificats auto | Nginx, HAProxy |
| Orchestration règles | **Apache NiFi** | Flux d'ingestion + règles métier | Visuel, traçable, connecteurs riches | Camunda, n8n |
| API backend | **Python · FastAPI** | Orchestration des services IA | Async, typé, écosystème ML natif | Flask, NestJS |
| Service de modèles | **PyTorch + TorchServe** | Servir les modèles de vision/NLP | Standard ML, scalable, versionné | ONNX Runtime, Triton |
| OCR / ICR | **PaddleOCR / docTR / Tesseract** | Texte imprimé + manuscrit | Open-source, multilingue, on-prem | ABBYY (commercial) |
| Découpe / classification | **Modèles vision (CNN/Transformer)** | Segmentation et typage des pièces | Spécialisé documentaire, explicable | LayoutLM, Donut |
| Extraction | **Règles + NER + gabarits CERFA** | Champs structurés (NIR, dates…) | Précision sur formulaires connus | LLM encadré (option) |
| Base relationnelle | **PostgreSQL** | Configuration, états, audit | Robuste, transactionnel, souverain | MySQL/MariaDB |
| Base documentaire | **MongoDB** | Métadonnées, annotations | Schéma souple par type de pièce | Elasticsearch |
| Cache / file | **Redis** | File d'attente, sessions | Rapide, simple, fiable | RabbitMQ |
| Recherche / logs | **Elasticsearch (ELK)** | Logs applicatifs et accès | Recherche + rétention ISO 27001 | Loki |
| Stockage fichiers | **Object store chiffré (MinIO)** | Images / PDF temporaires | S3-compatible, on-prem, chiffré | Volume chiffré LUKS |
| Front-end | **React + TypeScript** | UI agents + arbitrage | Écosystème mûr, composants riches | Vue, Angular |
| Authentification | **Keycloak (SSO/AD)** | RBAC, fédération AD | Standard, RBAC fin, on-prem | AD FS |
| Conteneurisation | **Docker + Docker Compose** | Orchestration des services | Reproductible, simple à exploiter | Kubernetes (si échelle) |
| Observabilité | **Prometheus + Grafana** | Métriques, alerting, dashboards | Standard de fait, on-prem | Zabbix |
| LLM (option, encadré) | **LLM local via Ollama** | Aide à la rédaction/résumé hors données sensibles | 100 % local, pas de fuite | — |

---

## 5. Modèle de données & taxonomie documentaire

### 5.1 Entités principales
| Entité | Description |
|---|---|
| `Pli` | Lot numérisé reçu (multi-documents). |
| `Piece` | Document unitaire issu de la découpe (type, score, pages). |
| `Extraction` | Champ extrait d'une pièce (clé, valeur, confiance, position). |
| `Controle` | Résultat binaire (`ok`/`nok`) d'une règle métier, niveau (bloquant/informatif). |
| `Dossier` | Regroupement logique d'un usager / d'une demande. |
| `Arbitrage` | Trace des corrections humaines (qui, quand, quoi). |
| `JournalIA` | Journal explicable des décisions du modèle. |

### 5.2 Taxonomie (extrait)
Plan de classement hiérarchique adaptable (agrégation/renommage possibles, **pas** d'ajout de type non entraîné) :
`Administratif` · `Justificatifs identité` · `Justificatifs de domicile` · `Dossier médical` (certificats, bilans) · `Évaluations` (GEVA, ESMS, scolaire) · `Notifications` · `Contestation` · `Fonds de compensation`.

### 5.3 Données extraites (exemples)
- **CERFA de demande (n°15692-01)** : sexe, nom, prénom, date de naissance, NIR, adresse, mesure de protection, signature/date (p.4), volets A→E.
- **Certificat médical** : identité, NIR, date, tampon, signature, RPPS/ADELI.
- **Justificatif de domicile / identité** : nom, adresse, date du document, date d'expiration, MRZ.

---

## 6. Approche IA / ML

- **Pipeline séquentiel** : découpe → classification → contrôles, chaque erreur isolée et corrigée une seule fois.
- **Modèles spécialisés** (pas de génératif sur données usagers) : vision documentaire + OCR/ICR + extraction par gabarits.
- **Score de confiance** affiché (élevé / faible) ; les pièces à faible score partent en arbitrage.
- **Mesure des performances** : taux de découpe, de classification, de contrôles (`ok`/`nok`), de ventilation — mesurés depuis l'interface d'arbitrage, hors pièces « hors périmètre ».
- **Supervision humaine** : l'IA n'attribue jamais de droits ; l'agent valide. Dispositif de recours/correction obligatoire.
- **Amélioration continue** : versionnage des modèles, tests de non-régression avant déploiement.

---

## 7. Intégrations

| Sens | Système | Mode |
|---|---|---|
| Entrée | Scanner / bannette GED | Dépôt fichier, watcher NiFi |
| Entrée | Messagerie (Outlook) | Connecteur (corps + pièces jointes) |
| Sortie | GED Efalia / Multigest | Versement pièces + intercalaires + nommage |
| Sortie | SI Métier MDPH | API éditeur (Iodas, Solis, Genesis…) ou RPA si pas d'API |
| Extension | API tierces / LLM local | Connecteurs configurables |

> Si l'API du SI Métier n'est pas disponible, prévoir une **automatisation RPA** transitoire (à cadrer avec l'intégrateur).

---

## 8. Sécurité & conformité

### 8.1 RGPD
| Référence | Application au projet |
|---|---|
| Art. 6.1.e | Base légale : mission d'intérêt public (instruction des demandes). |
| Art. 9.2.g | Données de santé : motif d'intérêt public important + garanties renforcées. |
| Art. 28 | Contrat de sous-traitance avec l'éditeur/intégrateur. |
| Art. 32 | Mesures de sécurité (chiffrement, traçabilité, RBAC). |
| **Art. 35** | **AIPD obligatoire avant lancement** (traitement à risque élevé). |

### 8.2 IA Act (UE 2024/1689)
- **Annexe III** : domaine « accès aux services sociaux » → système potentiellement **à haut risque**.
- **Art. 14** : **supervision humaine** documentée et effective.
- Documentation technique, qualité des données, traçabilité.

### 8.3 Normes & mesures
- **ISO/IEC 27001** (sécurité de l'information) ; **ISO/IEC 42001** (management de l'IA) recommandée.
- Chiffrement **TLS en transit** + **au repos** (disques/DB/object store).
- **RBAC + SSO** (Keycloak/AD) ; habilitations nominatives.
- **Hébergement souverain** : aucune donnée hors du périmètre ; Internet limité aux licences/MAJ/maintenance.
- **Journalisation** des accès et traitements ; rétention conforme (≈ 6 mois).

---

## 9. Infrastructure & déploiement

### 9.1 Dimensionnement (VM dédiée)
| Composant | Minimum | Recommandé |
|---|---|---|
| CPU | 12 vCPU | 24 vCPU |
| RAM | 32 Go | 64 Go |
| Disque | 1,5 To SSD NVMe | 2–4 To SSD NVMe |
| Réseau | 1 Gb/s | 1 Gb/s |
| OS | Debian 12 LTS | Ubuntu 22.04 LTS |

> Volumétrie indicative : configuration *minimum* pour une MDPH < 0,8 M pages/an.

### 9.2 Topologie de déploiement
- **Docker + Docker Compose** : un service par conteneur (Traefik, NiFi, FastAPI, TorchServe, OCR, PostgreSQL, MongoDB, Redis, MinIO, Keycloak, Prometheus, Grafana, ELK).
- **Réseaux Docker isolés** : `front` (Traefik), `app` (services), `data` (bases) — flux est-ouest contrôlés.
- **Sauvegarde** : dumps PostgreSQL/MongoDB chiffrés + volumes ; PRA documenté.
- **MCO** : télémaintenance encadrée, fenêtres de mise à jour planifiées.

### 9.3 Flux réseau
| Flux | Autorisé |
|---|---|
| Serveur ↔ instance Multigest (interne) | Oui |
| Serveur → Internet | **Restreint** : licences, MAJ Docker, télémaintenance |
| Poste agent → front-end (TLS) | Oui (via Traefik) |

---

## 10. Observabilité & KPI

| KPI | Cible |
|---|---|
| Temps moyen scan → GED | mesuré, en baisse continue |
| Taux d'automatisation (sans correction humaine) | suivi par type de flux |
| Taux de classification correcte | ≥ 95 % (périmètre entraîné) |
| Disponibilité des services | > 99 % |
| Délai d'arbitrage moyen | suivi agent |

Outillage : **Prometheus** (CPU, mémoire, latence), **Grafana** (dashboards), **ELK** (logs applicatifs/accès, alerting incidents 24 h).

---

## 11. Trajectoire de déploiement

| Phase | Contenu | Durée indicative |
|---|---|---|
| **0. Cadrage** | AIPD, plan de classement, règles cibles, accès | 2–3 sem. |
| **1. POC** | 1 flux, 1 équipe, périmètre restreint, mesure des perfs | 6–8 sem. |
| **2. Recette** | Tests fonctionnels + performance, formation agents | 2–3 sem. |
| **3. Industrialisation** | Montée en charge, intégration SI Métier, ventilation complète | 4–6 sem. |
| **4. Run** | MCO, amélioration continue, suivi KPI | continu |

---

## 12. Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Qualité de numérisation hétérogène | Baisse des perfs OCR | Normalisation image, contrôle qualité en entrée |
| Pièces « hors périmètre » | Non classées | Mise en arbitrage, pas d'erreur comptée |
| API SI Métier indisponible | Pas de création auto | RPA transitoire, planning éditeur |
| AIPD non réalisée | Blocage réglementaire | AIPD avant tout lancement (R6) |
| Dérive du modèle | Perte de fiabilité | Tests de non-régression, versionnage, monitoring |
| Dépendance éditeur | Réversibilité | Formats ouverts, export des données, doc d'architecture |

---

## 13. Hypothèses & prérequis
- Numérisation en place (scanner ou flux GED existant).
- VM dédiée conforme au dimensionnement, OS LTS supporté.
- Accès AD/SSO pour l'authentification des agents.
- AIPD menée et validée par le DPO **avant** mise en production.
- Engagement de sous-traitance (art. 28 RGPD) signé avec l'éditeur/intégrateur.

---

*Document d'exemple — architecture de solution LAD MDPH. À adapter au contexte réel de la collectivité après cadrage et AIPD.*
