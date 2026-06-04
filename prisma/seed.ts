import { db } from "@/lib/db"
import { generateDecision } from "@/lib/engine/generate"
import { generateReport } from "@/lib/report/generate"
import type { Prisma } from "@prisma/client"

const USER_ID = "demo-user"

interface Demo {
  id: string
  name: string
  direction: string
  description: string
  q1Reformulation?: string
  answers: Record<string, string | string[]>
}

// Données de démonstration (Projets 1-3 de la SPEC).
// Les décisions sont CALCULÉES par le moteur, pas codées en dur.
const DEMOS: Demo[] = [
  {
    id: "demo-project-mdph",
    name: "Automatisation boîtes mails MDPH",
    direction: "MDPH",
    description:
      "Tri et traitement assisté des 500 emails quotidiens reçus par les agents MDPH.",
    q1Reformulation:
      "Le tri manuel d'un volume élevé d'emails mobilise fortement les agents et ralentit le traitement des demandes des usagers.",
    answers: {
      Q1: "On reçoit 500 emails par jour et les agents passent 3h à les trier manuellement, ce qui retarde les réponses aux usagers.",
      Q2: "daily_multiple",
      Q3: ["agents", "users"],
      Q4: "variable",
      Q5: "high_complex",
      Q6: "yes_scattered",
      Q7: ["social", "identity"],
      Q8: "auto_with_human",
      Q9: "to_check",
      Q10: "partial",
      QR1: "yes_france",
      QR2: "no",
      QR3: "yes_always",
    },
  },
  {
    id: "demo-project-pmi",
    name: "IA traduction interprétariat PMI",
    direction: "PMI",
    description:
      "Aider la communication avec les familles non francophones lors des consultations PMI.",
    answers: {
      Q1: "Les familles non francophones n'arrivent pas à communiquer correctement lors des consultations, ce qui nuit au suivi médical.",
      Q2: "daily",
      Q3: ["users"],
      Q4: "complex",
      Q5: "low_complex",
      Q6: "no",
      Q7: ["health"],
      Q8: "assist_only",
      Q9: "unknown",
      Q10: "not_asked",
      QR1: "unknown",
      QR2: "no",
    },
  },
  {
    id: "demo-project-lad",
    name: "LAD MDPH — lecture automatique de documents",
    direction: "MDPH",
    description:
      "Saisie automatique des dossiers papier MDPH dans le système d'information.",
    answers: {
      Q1: "Les dossiers papier MDPH doivent être saisis manuellement dans le SI, c'est long et source d'erreurs pour les agents.",
      Q2: "daily_multiple",
      Q3: ["agents", "users"],
      Q4: "mostly_stable",
      Q5: "high_simple",
      Q6: "yes_structured",
      Q7: ["health", "social", "identity"],
      Q8: "auto_with_human",
      Q9: "yes_api",
      Q10: "ready",
      QR1: "yes_france",
      QR2: "yes_planned",
      QR3: "yes_always",
    },
  },
  {
    id: "demo-project-ar",
    name: "Génération des accusés de réception",
    direction: "Courrier / MDPH",
    description:
      "À chaque dossier reçu, envoyer un accusé de réception standardisé à l'usager.",
    answers: {
      // Processus stable + répétitif simple → règle R2 : AUTOMATISATION (RPA), pas d'IA.
      Q1: "À chaque dossier reçu, un agent saisit toujours les mêmes informations et envoie un accusé de réception identique ; la tâche est répétitive et suit des règles fixes.",
      Q2: "daily_multiple",
      Q3: ["agents"],
      Q4: "stable",
      Q5: "high_simple",
      Q6: "yes_structured",
      Q7: ["identity"],
      Q8: "assist_only",
      Q9: "yes_api",
      Q10: "ready",
      QR1: "yes_france",
    },
  },
]

async function main() {
  await db.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
      email: "chef.projet@cd93.fr",
      name: "Chef de projet (démo)",
      role: "ADMIN",
    },
  })

  await db.project.deleteMany({ where: { id: { in: DEMOS.map((d) => d.id) } } })

  for (const demo of DEMOS) {
    await db.project.create({
      data: {
        id: demo.id,
        userId: USER_ID,
        name: demo.name,
        direction: demo.direction,
        description: demo.description,
        status: "DONE",
        answers: {
          create: Object.entries(demo.answers).map(([questionKey, value]) => ({
            questionKey,
            value: value as Prisma.InputJsonValue,
            llmReformulation:
              questionKey === "Q1" ? (demo.q1Reformulation ?? null) : null,
          })),
        },
      },
    })

    const result = await generateDecision(demo.id)
    await generateReport(demo.id)
    console.log(
      `✓ ${demo.name} → ${result?.verdict} / ${result?.techRecommendation ?? "—"} / ${result?.regulatoryLevel}`,
    )
  }

  console.log("Seed terminé.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
