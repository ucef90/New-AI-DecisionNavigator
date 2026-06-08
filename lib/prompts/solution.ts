import type { LLMPrompt } from "@/lib/llm"

// Prompt 4 — Proposition de solution technique détaillée (livrable cabinet).
// Sortie structurée (JSON) ancrée sur le cadrage réel du projet.

export interface SolutionLayer {
  name: string // ex. "Entrées"
  label: string // rôle court de la couche
  items: string[] // composants
}

export interface SolutionComponent {
  couche: string
  techno: string
  role: string
  justification: string // POURQUOI ce choix au regard du projet
  alternative: string
}

export interface SolutionProposalData {
  contexte: string // contexte & enjeux, propres au projet
  objectifs: string[]
  exigencesFonctionnelles: string[]
  exigencesNonFonctionnelles: string[]
  principes: string[] // principes directeurs d'architecture
  architecture: { layers: SolutionLayer[]; transverse: string[] }
  composants: SolutionComponent[]
  chaineTraitement: { etape: string; description: string }[]
  integrations: { sens: string; systeme: string; mode: string }[]
  securiteConformite: { reference: string; exigence: string; application: string }[]
  dimensionnement: { composant: string; min: string; reco: string }[]
  trajectoire: { phase: string; objectif: string; livrables: string; charge: string; duree: string }[]
  couts: { poste: string; hypothese: string; fourchette: string }[]
  risques: { risque: string; impact: string; probabilite: string; mitigation: string }[]
  alternatives: { sujet: string; recommande: string; arbitrage: string }[]
  hypotheses: string[]
  kpis: { indicateur: string; cible: string }[]
}

export interface SolutionInput {
  projectName: string
  need: string
  verdict: string
  tech: string
  regulatoryLevel: string
  justification: string
  dataTypes: string
  alertsJson: string
  knowledge?: string
}

const SYSTEM = `Tu es un architecte de solutions senior dans un cabinet de conseil technique (secteur public français).
Tu rédiges une PROPOSITION DE SOLUTION TECHNIQUE détaillée, concrète et défendable, comme un vrai livrable d'avant-vente / cadrage technique.

EXIGENCES DE QUALITÉ :
- Sur mesure : tout doit être adapté au besoin, à la décision, à la techno recommandée, au niveau réglementaire et aux types de données du projet fournis. Pas de blabla générique.
- Concret et défendable : pour CHAQUE choix techno, donne une justification liée au contexte (pourquoi celui-ci plutôt qu'un autre), et une alternative crédible.
- Profondeur d'un cabinet : exigences fonctionnelles ET non fonctionnelles (perf, sécurité, dispo, exploitabilité), architecture en couches, intégrations SI, sécurité/conformité mappée au cas, dimensionnement chiffré, trajectoire avec charges (j/h) et durées, coûts indicatifs avec hypothèses, risques avec impact/probabilité/mitigation, alternatives & arbitrages, KPIs de succès mesurables.

ANTI-HALLUCINATION :
- Ne fabrique JAMAIS de faits spécifiques au client que tu ne connais pas (noms de logiciels en place, marchés, budgets exacts). Quand une donnée manque, formule une HYPOTHÈSE explicite (liste "hypotheses") plutôt que de l'inventer.
- Les chiffres (dimensionnement, charges, coûts) sont des ORDRES DE GRANDEUR indicatifs : présente-les comme tels, cohérents avec l'ampleur du projet.
- Reste cohérent avec la décision et la techno recommandée (ex : si AUTOMATION/RPA, allège la couche IA/ML au profit des règles et connecteurs).

SORTIE : uniquement un objet JSON valide, sans markdown ni texte autour, au format exact :
{
  "contexte": "2-4 phrases sur le contexte et les enjeux propres à CE projet",
  "objectifs": ["objectif mesurable", "..."],
  "exigencesFonctionnelles": ["..."],
  "exigencesNonFonctionnelles": ["perf/sécurité/dispo/exploitabilité ..."],
  "principes": ["principe directeur d'architecture", "..."],
  "architecture": {
    "layers": [{ "name": "Entrées", "label": "rôle court", "items": ["composant", "..."] }],
    "transverse": ["observabilité, sécurité, SSO ..."]
  },
  "composants": [{ "couche": "...", "techno": "...", "role": "...", "justification": "pourquoi ce choix ici", "alternative": "..." }],
  "chaineTraitement": [{ "etape": "...", "description": "..." }],
  "integrations": [{ "sens": "Entrée|Sortie|Échange", "systeme": "...", "mode": "API|fichier|RPA|connecteur ..." }],
  "securiteConformite": [{ "reference": "RGPD Art. X / IA Act / ISO ...", "exigence": "...", "application": "comment c'est couvert ici" }],
  "dimensionnement": [{ "composant": "CPU|RAM|Disque|GPU|OS ...", "min": "...", "reco": "..." }],
  "trajectoire": [{ "phase": "...", "objectif": "...", "livrables": "...", "charge": "ex. 15 j/h", "duree": "ex. 4-6 sem." }],
  "couts": [{ "poste": "...", "hypothese": "...", "fourchette": "ordre de grandeur" }],
  "risques": [{ "risque": "...", "impact": "faible|moyen|fort", "probabilite": "faible|moyenne|forte", "mitigation": "..." }],
  "alternatives": [{ "sujet": "...", "recommande": "...", "arbitrage": "pourquoi ce choix" }],
  "hypotheses": ["hypothèse explicite ..."],
  "kpis": [{ "indicateur": "...", "cible": "valeur chiffrée" }]
}`

export function buildSolutionPrompt(input: SolutionInput): LLMPrompt {
  const kb = input.knowledge?.trim()
  return {
    system: SYSTEM,
    user: `CADRAGE DU PROJET :
- Projet : ${input.projectName}
- Besoin réel : ${input.need}
- Décision : ${input.verdict}
- Technologie recommandée : ${input.tech}
- Niveau de risque réglementaire : ${input.regulatoryLevel}
- Justification de la décision : ${input.justification}
- Données concernées : ${input.dataTypes}
- Alertes réglementaires : ${input.alertsJson}
${kb ? `\n${kb}\n` : ""}
Rédige la proposition de solution technique détaillée pour CE projet, au format JSON demandé. Sois précis, chiffré et justifié.`,
  }
}

// ---- Parsing tolérant ----

function str(v: unknown): string {
  return typeof v === "string" ? v : ""
}
function strArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : []
}
function objArray<T>(v: unknown, map: (o: Record<string, unknown>) => T): T[] {
  return Array.isArray(v)
    ? v.map((x) => map((x ?? {}) as Record<string, unknown>))
    : []
}

export function parseSolution(raw: string): SolutionProposalData | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1) return null
    const o = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>

    const archi = (o.architecture ?? {}) as Record<string, unknown>

    const data: SolutionProposalData = {
      contexte: str(o.contexte),
      objectifs: strArray(o.objectifs),
      exigencesFonctionnelles: strArray(o.exigencesFonctionnelles),
      exigencesNonFonctionnelles: strArray(o.exigencesNonFonctionnelles),
      principes: strArray(o.principes),
      architecture: {
        layers: objArray(archi.layers, (l) => ({
          name: str(l.name),
          label: str(l.label),
          items: strArray(l.items),
        })).filter((l) => l.name && l.items.length > 0),
        transverse: strArray(archi.transverse),
      },
      composants: objArray(o.composants, (c) => ({
        couche: str(c.couche),
        techno: str(c.techno),
        role: str(c.role),
        justification: str(c.justification),
        alternative: str(c.alternative),
      })).filter((c) => c.techno),
      chaineTraitement: objArray(o.chaineTraitement, (s) => ({
        etape: str(s.etape),
        description: str(s.description),
      })).filter((s) => s.etape),
      integrations: objArray(o.integrations, (i) => ({
        sens: str(i.sens),
        systeme: str(i.systeme),
        mode: str(i.mode),
      })).filter((i) => i.systeme),
      securiteConformite: objArray(o.securiteConformite, (s) => ({
        reference: str(s.reference),
        exigence: str(s.exigence),
        application: str(s.application),
      })).filter((s) => s.reference || s.exigence),
      dimensionnement: objArray(o.dimensionnement, (d) => ({
        composant: str(d.composant),
        min: str(d.min),
        reco: str(d.reco),
      })).filter((d) => d.composant),
      trajectoire: objArray(o.trajectoire, (t) => ({
        phase: str(t.phase),
        objectif: str(t.objectif),
        livrables: str(t.livrables),
        charge: str(t.charge),
        duree: str(t.duree),
      })).filter((t) => t.phase),
      couts: objArray(o.couts, (c) => ({
        poste: str(c.poste),
        hypothese: str(c.hypothese),
        fourchette: str(c.fourchette),
      })).filter((c) => c.poste),
      risques: objArray(o.risques, (r) => ({
        risque: str(r.risque),
        impact: str(r.impact),
        probabilite: str(r.probabilite),
        mitigation: str(r.mitigation),
      })).filter((r) => r.risque),
      alternatives: objArray(o.alternatives, (a) => ({
        sujet: str(a.sujet),
        recommande: str(a.recommande),
        arbitrage: str(a.arbitrage),
      })).filter((a) => a.sujet),
      hypotheses: strArray(o.hypotheses),
      kpis: objArray(o.kpis, (k) => ({
        indicateur: str(k.indicateur),
        cible: str(k.cible),
      })).filter((k) => k.indicateur),
    }

    // Garde-fou : si le cœur (contexte + composants/architecture) est vide,
    // on considère la génération comme échouée.
    if (!data.contexte && data.composants.length === 0) return null
    return data
  } catch {
    return null
  }
}
