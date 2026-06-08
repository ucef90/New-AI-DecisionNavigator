import { CaretDown, Info, Check, Warning, X } from "@phosphor-icons/react/dist/ssr"

// Présentation du Framework Méthodologique en 6 socles (Beyond Expertise).
// Page de référence accessible depuis la barre de navigation.

type Accent = { badge: string; dot: string; pill: string }

const ACCENTS: Accent[] = [
  { badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300", dot: "bg-blue-500", pill: "bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", pill: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300", dot: "bg-orange-500", pill: "bg-orange-500/12 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300", dot: "bg-violet-500", pill: "bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  { badge: "bg-green-500/15 text-green-700 dark:text-green-300", dot: "bg-green-500", pill: "bg-green-500/12 text-green-700 dark:text-green-300 border-green-500/30" },
  { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300", dot: "bg-amber-500", pill: "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30" },
]

interface Socle {
  num: number
  titre: string
  soustitre: string
  question: string
  pourquoi: string
  objectif: string
  logique: string
  questions: string[]
  entrees: string[]
  sorties: string[]
  go: string
  conditionnel: string
  nogo: string
  pieges: string[]
  duree: string
  profils: string
}

const CHAIN = ["Comprendre", "Qualifier", "Analyser", "Mesurer", "Visualiser", "Encadrer"]

const SOCLES: Socle[] = [
  {
    num: 1,
    titre: "Comprendre le vrai problème métier",
    soustitre: "Analyse métier — Avant toute technologie",
    question: "Quel est le vrai problème ? Quelle valeur existe réellement ?",
    pourquoi:
      "La demande initiale est presque toujours formulée en termes de solution. Le chef de projet doit la traduire en problème métier pur — sans technologie implicite, sans outil présupposé. Ce socle force cette traduction. Sans lui, tout le reste est construit sur du sable.",
    objectif:
      "Transformer une demande vague ou technologique en besoin métier documenté et quantifié. Produire une baseline mesurée qui servira de référence pour démontrer l'impact du projet.",
    logique:
      "Ce socle ralentit volontairement l'équipe au démarrage pour accélérer l'ensemble du projet sur sa durée. Chaque heure investie ici évite 10 heures de corrections en phase de développement.",
    questions: [
      "Quel est le problème métier réel — formulé sans technologie ?",
      "Quelles tâches sont chronophages, répétitives et sans valeur ajoutée ?",
      "Quel est l'impact quantifié du problème (ETP, coûts, délais, erreurs) ?",
      "Qui sont les acteurs impactés — y compris ceux absents de la réunion ?",
      "Quelle est la baseline mesurée aujourd'hui (volume, délai, taux d'erreur) ?",
      "Quelle est la définition du succès dans 18 mois ?",
    ],
    entrees: ["Aucun — point de départ absolu du framework"],
    sorties: ["Fiche de qualification projet", "Besoin métier reformulé", "Inventaire des irritants", "Cartographie AS-IS", "KPI baseline mesurée", "Acteurs et impacts", "Contraintes et hypothèses"],
    go: "Besoin clair et quantifié · baseline établie · sponsors identifiés · valeur démontrée",
    conditionnel: "Besoin partiellement défini — organiser des ateliers complémentaires avec les métiers",
    nogo: "Problème flou · aucune mesure · pas de sponsor · aucune valeur démontrée",
    pieges: [
      "Accepter une formulation technologique sans la challenger.",
      "Remplir les tableaux sans aller sur le terrain observer le processus réel.",
      "Ne pas quantifier les irritants — une liste sans mesure d'impact n'est pas actionnable.",
    ],
    duree: "3h00",
    profils: "Chef de projet + Métier",
  },
  {
    num: 2,
    titre: "IA ou Automatisation ?",
    soustitre: "Qualification technologique — Avant tout choix d'outil",
    question: "Faut-il de l'IA, de l'automatisation, ou les deux ? Pourquoi ?",
    pourquoi:
      "Mettre de l'IA sur une tâche automatisable est un gaspillage. Mettre de l'automatisation sur une tâche qui nécessite de la compréhension est une erreur. Ce socle force à analyser chaque tâche individuellement et à choisir le bon niveau de complexité.",
    objectif:
      "Analyser chaque tâche du processus pour déterminer si elle nécessite de l'intelligence ou si une règle fixe suffit. Produire une architecture logique cible cohérente et identifier les dépendances bloquantes.",
    logique:
      "La question n'est pas « IA ou pas IA » — c'est « quel niveau d'intelligence pour quelle tâche ». Un processus de 6 tâches peut en avoir 2 automatisables, 3 nécessitant de l'IA et 1 devant rester humaine.",
    questions: [
      "Quelles tâches appliquent des règles fixes et prévisibles ?",
      "Quelles tâches nécessitent de comprendre du contexte ou un document ?",
      "Quelles tâches nécessitent un raisonnement ou une interprétation ?",
      "Quelles décisions ne peuvent jamais être déléguées à une machine ?",
      "Quels besoins d'intelligence existent : OCR, classification, LLM, RAG, scoring ?",
    ],
    entrees: ["Besoin métier reformulé (Socle 1)", "Cartographie AS-IS détaillée (Socle 1)", "Inventaire des irritants (Socle 1)"],
    sorties: ["Tableau IA vs automatisation par tâche", "Architecture hybride en couches", "Matrice technologique", "Dépendances bloquantes", "Décision technologique argumentée", "Recommandations souveraineté données"],
    go: "Architecture cohérente · technologies matures · cas d'usage IA réels · dépendances maîtrisables",
    conditionnel: "Architecture partielle — auditer les APIs et données disponibles avant de continuer",
    nogo: "Aucun besoin IA réel · automatisation suffit · complexité injustifiée · aucun cas d'usage",
    pieges: [
      "Appliquer de l'IA partout par réflexe ou effet de mode.",
      "Sous-dimensionner en pensant qu'une automatisation simple suffira sur des tâches complexes.",
      "Oublier que certaines décisions à portée légale ne peuvent jamais être automatisées.",
    ],
    duree: "2h00",
    profils: "Chef de projet + DSI + Métier",
  },
  {
    num: 3,
    titre: "Questionnaire de Cadrage IA",
    soustitre: "Analyse systémique — 21 dimensions",
    question: "Le projet est-il réellement viable ? Quelles dimensions couvrir ?",
    pourquoi:
      "Un projet peut être techniquement faisable et réglementairement bloqué. Ou organisationnellement prêt et techniquement incomplet. Ce socle examine les 21 dimensions du projet simultanément pour détecter les incohérences et les zones de flou.",
    objectif:
      "Analyser exhaustivement le projet sur 21 dimensions : données, workflow, SI, réglementation, risques, gouvernance, maturité, faisabilité. Identifier les 5 actions immédiates à lancer en parallèle.",
    logique:
      "La plupart des problèmes qui émergent en développement étaient visibles en cadrage — mais personne n'avait posé les questions. Ce socle pose toutes les questions inconfortables.",
    questions: [
      "Les données existent-elles, sont-elles accessibles et de qualité suffisante ?",
      "Les workflows sont-ils documentés et les règles métier formalisées ?",
      "Quels SI sont concernés et avec quelles contraintes d'intégration ?",
      "Quelles obligations RGPD, EU AI Act, CSE s'appliquent ?",
      "Quels risques subsistent et quel est leur niveau de criticité (P×I) ?",
      "Le niveau de maturité du projet est-il suffisant pour avancer ?",
    ],
    entrees: ["Architecture hybride (Socle 2)", "Besoin métier reformulé (Socle 1)", "Décision technologique (Socle 2)"],
    sorties: ["Analyse complète 21 dimensions", "Matrice des risques (P×I)", "Grille de maturité 8 axes", "Matrice de faisabilité 4 dimensions", "Points critiques et opportunités", "5 actions immédiates"],
    go: "Prérequis identifiés et adressables · risques maîtrisables · faisabilité confirmée sur 4 dimensions",
    conditionnel: "Prérequis manquants mais surmontables — plan d'action avec délais avant le POC",
    nogo: "Blocage RGPD rédhibitoire · données inexistantes · SI totalement incompatible",
    pieges: [
      "Remplir les tableaux mécaniquement sans creuser les réponses vagues.",
      "Ne pas confronter les hypothèses à la réalité terrain.",
      "Ignorer les contraintes réglementaires en pensant les traiter « plus tard ».",
    ],
    duree: "4h00",
    profils: "Chef de projet + DPO + DSI",
  },
  {
    num: 4,
    titre: "Scoring et Maturité Projet IA",
    soustitre: "Objectivation quantitative — Aide à la décision",
    question: "Quel est le niveau de maturité du projet, mesuré objectivement ?",
    pourquoi:
      "Les analyses qualitatives sont indispensables mais insuffisantes pour décider. Le scoring transforme les analyses en scores comparables sur 11 axes, produit un radar visuel et aboutit à une recommandation formelle défendable en comité de pilotage.",
    objectif:
      "Transformer les analyses qualitatives des Socles 1 à 3 en indicateurs décisionnels chiffrés. Mesurer la maturité sur 11 axes, identifier les leviers d'amélioration et produire une décision go/no-go argumentée.",
    logique:
      "Un score sans justification est arbitraire. Ici chaque score est argumenté. L'impact de chaque amélioration est chiffré en points. Le décideur sait exactement quoi faire pour progresser.",
    questions: [
      "Quel score obtient chaque dimension sur une échelle de 1 à 5 ?",
      "Quels axes sont en dessous du seuil minimum acceptable (3/5) ?",
      "Quel est le score global en pourcentage sur 55 ?",
      "Quelles actions feraient progresser le score significativement ?",
      "Quelle décision le score recommande-t-il formellement ?",
    ],
    entrees: ["Grille de maturité (Socle 3)", "Matrice des risques (Socle 3)", "Analyse 21 dimensions (Socle 3)"],
    sorties: ["Score global sur 55 (11 axes)", "Radar de maturité visuel", "Jauges de progression par axe", "Matrice de faisabilité consolidée", "Recommandation GO/NO GO formelle", "Conditions du POC"],
    go: "Score ≥ 80 % — industrialisation directe envisageable",
    conditionnel: "Score 40–80 % — POC ciblé avec les conditions définies",
    nogo: "Score < 40 % — projet immature · reprendre le cadrage",
    pieges: [
      "Attribuer des scores sans justification — un score non argumenté n'a aucune valeur.",
      "Utiliser le scoring pour valider une décision déjà prise — c'est un outil d'objectivation.",
      "Ignorer les axes à score faible au lieu de les adresser.",
    ],
    duree: "2h00",
    profils: "Chef de projet + Sponsor",
  },
  {
    num: 5,
    titre: "Cartographie IA Complète",
    soustitre: "Vision systémique — flux, dépendances, gouvernance",
    question: "Comment fonctionne le système dans sa totalité ?",
    pourquoi:
      "Les tableaux et les scores décrivent le projet. Les cartographies le montrent. Un développeur ne peut pas construire ce qu'il ne peut pas visualiser. Un décideur ne peut pas valider ce qu'il ne comprend pas.",
    objectif:
      "Produire des cartographies systémiques qui rendent visibles les flux, dépendances, décisions, la gouvernance et les risques. Document de référence pour l'équipe de développement, les auditeurs et les décideurs.",
    logique:
      "Une cartographie n'est pas un schéma esthétique. C'est un outil de décision : elle montre comment le système fonctionnera, mais aussi où sont les risques, qui supervise quoi et comment les données circulent.",
    questions: [
      "Comment fonctionne le processus actuel (AS-IS) — étape par étape ?",
      "Comment fonctionnera le processus cible — couche par couche ?",
      "Comment les données circulent-elles entre les systèmes ?",
      "Quels SI sont connectés et avec quels statuts ?",
      "Qui supervise quoi dans la structure de gouvernance ?",
    ],
    entrees: ["Architecture hybride (Socle 2)", "Score et recommandation (Socle 4)", "Analyse SI et dépendances (Socle 3)", "Matrice des risques (Socles 3 et 4)"],
    sorties: ["Workflow AS-IS dessiné", "Workflow cible en couches", "Cartographie des données et flux", "Dépendances SI", "Composants IA", "Cartographie gouvernance", "Circuit de supervision", "Synthèse visuelle globale"],
    go: "Architecture cohérente · gouvernance visible · dépendances critiques résolues",
    conditionnel: "Dépendances partielles — valider APIs et environnements de test avant le POC",
    nogo: "Dépendances bloquantes non résolues · architecture incohérente · gouvernance absente",
    pieges: [
      "Produire des schémas esthétiques sans valeur décisionnelle.",
      "Simplifier excessivement pour cacher la complexité — une cartographie honnête montre les problèmes.",
      "Cartographier le processus officiel plutôt que le processus réel pratiqué sur le terrain.",
    ],
    duree: "3h00",
    profils: "Chef de projet + DSI + Architecte",
  },
  {
    num: 6,
    titre: "Gouvernance, Risques et Conformité IA",
    soustitre: "Cadre opérationnel — Dernier verrou avant déploiement",
    question: "Le projet est-il conforme, sécurisé et pérenne ?",
    pourquoi:
      "Un projet IA techniquement réussi peut être illégal, non conforme ou rejeté par les agents s'il n'est pas correctement encadré. Ce socle lève le dernier verrou avant le déploiement en production.",
    objectif:
      "Transformer les analyses en cadre de gouvernance opérationnel : qui décide quoi, comment gérer les incidents, comment rester conforme RGPD et EU AI Act, comment le système se maintient dans la durée.",
    logique:
      "La gouvernance n'est pas une contrainte administrative. C'est la garantie que le système IA fonctionne de façon sûre, équitable et durable. Sans elle, un incident peut paralyser le service.",
    questions: [
      "La charte IA est-elle rédigée et signée par toutes les parties ?",
      "Le comité de gouvernance IA est-il constitué et opérationnel ?",
      "L'AIPD est-elle finalisée et validée par le DPO ?",
      "Le CSE a-t-il été informé et consulté (L.2312-38) ?",
      "Le plan de continuité est-il documenté et testé ?",
    ],
    entrees: ["Toutes les cartographies (Socle 5)", "Analyse risques (Socles 3 et 4)", "Analyse réglementaire (Socle 3)"],
    sorties: ["Charte IA (7 principes)", "Comité gouvernance IA", "Analyse RGPD complète", "Conformité EU AI Act", "AIPD structurée", "Plan gestion des risques", "Procédures opérationnelles", "Plan de continuité (RTO/RPO)", "Plan d'action"],
    go: "Charte signée · AIPD validée · CSE consulté · comité constitué · plan continuité testé",
    conditionnel: "Éléments en cours — déploiement limité au POC jusqu'à validation complète",
    nogo: "AIPD bloquée · CSE non consulté · gouvernance absente · conformité EU AI Act non établie",
    pieges: [
      "Traiter la gouvernance comme une formalité administrative à remplir après coup.",
      "Sous-estimer l'obligation de consultation du CSE — c'est une obligation légale.",
      "Déployer en production sans AIPD finalisée — c'est une violation du RGPD.",
    ],
    duree: "3h00",
    profils: "Chef de projet + DPO + DRH",
  },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

export function FrameworkMethod() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-muted/30 p-5">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold text-foreground">Un mauvais cadrage métier produit presque toujours un mauvais projet IA.</span>{" "}
          La technologie ne corrige pas le flou — elle l'amplifie. Chaque socle produit un artefact qui devient l'entrée du suivant, jusqu'à une décision formelle{" "}
          <span className="font-semibold text-foreground">GO / NO GO / CONDITIONNEL</span> argumentée sur 6 dimensions.
        </p>
      </div>

      {/* Chaîne logique */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border p-3 text-xs">
        <span className="mr-1 font-medium text-muted-foreground">Logique →</span>
        {CHAIN.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            <span className={`rounded-md border px-2.5 py-1 font-medium ${ACCENTS[i].pill}`}>{step}</span>
            <span className="text-muted-foreground">→</span>
          </span>
        ))}
        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
          GO / NO GO
        </span>
      </div>

      {/* Socles */}
      <div className="space-y-3">
        {SOCLES.map((s) => {
          const a = ACCENTS[s.num - 1]
          return (
            <details key={s.num} className="group rounded-xl border bg-card">
              <summary className="flex cursor-pointer list-none items-start gap-3 p-5">
                <span className={`mt-0.5 shrink-0 rounded-md px-2.5 py-1 font-mono text-xs font-medium ${a.badge}`}>
                  Socle {s.num}
                </span>
                <div className="flex-1">
                  <p className="text-base font-semibold leading-tight">{s.titre}</p>
                  <p className="text-xs text-muted-foreground">{s.soustitre}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                    <Info className="size-3.5 opacity-60" aria-hidden />
                    {s.question}
                  </span>
                </div>
                <CaretDown className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
              </summary>

              <div className="space-y-5 border-t p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Durée atelier</p>
                    <p className="text-lg font-semibold">{s.duree}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Profils requis</p>
                    <p className="text-sm">{s.profils}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Socle</p>
                    <p className="text-sm font-semibold">#{s.num} / 6</p>
                  </div>
                </div>

                <Field label="Pourquoi ce socle existe">{s.pourquoi}</Field>
                <Field label="Objectif">{s.objectif}</Field>
                <Field label="Logique interne">
                  <span className="block border-l-2 border-border pl-3 italic">{s.logique}</span>
                </Field>

                <Field label="Questions posées lors de l'atelier">
                  <ul className="space-y-1.5">
                    {s.questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${a.dot}`} />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Entrées requises">
                    <div className="flex flex-wrap gap-1.5">
                      {s.entrees.map((e, i) => (
                        <span key={i} className="rounded border bg-muted/40 px-2 py-0.5 text-xs">{e}</span>
                      ))}
                    </div>
                  </Field>
                  <Field label="Artefacts produits">
                    <div className="flex flex-wrap gap-1.5">
                      {s.sorties.map((o, i) => (
                        <span key={i} className="rounded border bg-muted/40 px-2 py-0.5 text-xs">{o}</span>
                      ))}
                    </div>
                  </Field>
                </div>

                <Field label="Logique de décision">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                      <p className="flex items-center gap-1 text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300"><Check className="size-3.5" />GO</p>
                      <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-300/90">{s.go}</p>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                      <p className="flex items-center gap-1 text-xs font-bold uppercase text-amber-700 dark:text-amber-300"><Warning className="size-3.5" />Conditionnel</p>
                      <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/90">{s.conditionnel}</p>
                    </div>
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5">
                      <p className="flex items-center gap-1 text-xs font-bold uppercase text-rose-700 dark:text-rose-300"><X className="size-3.5" />No Go</p>
                      <p className="mt-1 text-xs text-rose-700/90 dark:text-rose-300/90">{s.nogo}</p>
                    </div>
                  </div>
                </Field>

                <Field label="Pièges à éviter">
                  <ul className="space-y-1.5">
                    {s.pieges.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-md border border-rose-500/15 bg-rose-500/5 px-3 py-2">
                        <Warning className="mt-0.5 size-4 shrink-0 text-rose-500/70" aria-hidden />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </Field>
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
