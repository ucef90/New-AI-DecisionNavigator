import { test } from "node:test"
import assert from "node:assert/strict"

import {
  runEngine,
  computeRegulatoryLevel,
  computeConfidence,
  computeScore,
} from "@/lib/engine"
import type { AnswerMap } from "@/lib/questions"

// Base de réponses « neutres » ; chaque test surcharge ce qui l'intéresse.
function answers(over: Partial<AnswerMap> = {}): AnswerMap {
  return {
    Q1: "Description suffisamment détaillée du besoin métier pour le test unitaire.",
    Q2: "daily",
    Q3: ["agents"],
    Q4: "mostly_stable",
    Q5: "high_simple",
    Q6: "yes_scattered",
    Q7: ["identity"],
    Q8: "assist_only",
    Q9: "to_check",
    Q10: "partial",
    ...over,
  } as AnswerMap
}

test("R2 — processus stable et répétitif → AUTOMATION / RPA", () => {
  const r = runEngine(answers({ Q4: "stable", Q5: "high_simple" }))
  assert.equal(r.verdict, "AUTOMATION")
  assert.equal(r.techRecommendation, "RPA")
  assert.ok(r.rulesTriggered.includes("R2"))
})

test("R1 — décision auto sur données sensibles → verdict plafonné à POC max", () => {
  const r = runEngine(
    answers({ Q7: ["health"], Q8: "auto_no_human", Q1: "x".repeat(200) }),
  )
  assert.ok(["POC", "STUDY", "NOGO", "AUTOMATION"].includes(r.verdict))
  assert.notEqual(r.verdict, "GO")
  assert.ok(r.rulesTriggered.includes("R1"))
})

test("R3 — pas de données → verdict plafonné à STUDY max", () => {
  const r = runEngine(answers({ Q6: "no" }))
  assert.ok(["STUDY", "NOGO"].includes(r.verdict))
  assert.ok(r.rulesTriggered.includes("R3"))
})

test("Niveau réglementaire — sensible + auto sans humain → HIGH", () => {
  assert.equal(
    computeRegulatoryLevel(answers({ Q7: ["health"], Q8: "auto_no_human" })),
    "HIGH",
  )
})

test("Niveau réglementaire — aucune donnée → MINIMAL", () => {
  assert.equal(computeRegulatoryLevel(answers({ Q7: ["none"] })), "MINIMAL")
})

test("Score — total borné à 18 et axes dans [1,3]", () => {
  const s = computeScore(answers(), "LOW")
  assert.ok(s.total >= 6 && s.total <= 18)
  for (const k of ["axe1", "axe2", "axe3", "axe4", "axe5", "axe6"] as const) {
    assert.ok(s[k] >= 1 && s[k] <= 3, `${k}=${s[k]} hors [1,3]`)
  }
})

test("Confiance — cas limite (réponses à clarifier) → low + borderline", () => {
  const c = computeConfidence(
    answers({ Q1: "court", Q6: "unknown", Q7: ["unknown"], Q9: "unknown" }),
    { axe1: 1, axe2: 2, axe3: 1, axe4: 2, axe5: 2, axe6: 2, total: 10 },
  )
  assert.equal(c.confidence, "low")
  assert.equal(c.borderline, true)
})

test("Confiance — besoin clair, loin de tout seuil → high", () => {
  // total 18 : distance 3 au seuil le plus proche (15) ; Q9 clair → aucun
  // axe « à clarifier » → confiance élevée.
  const c = computeConfidence(answers({ Q9: "yes_api" }), {
    axe1: 3,
    axe2: 3,
    axe3: 3,
    axe4: 3,
    axe5: 3,
    axe6: 3,
    total: 18,
  })
  assert.equal(c.confidence, "high")
  assert.equal(c.borderline, false)
})
