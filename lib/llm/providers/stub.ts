import type { LLMPrompt, LLMProvider } from "../provider"

/**
 * Provider déterministe — fonctionne SANS clé API.
 * Détecte le type de prompt (reformulation Q1, analyse fournisseur, rapport)
 * et renvoie une réponse canonique valide, pour que tout le parcours soit
 * testable de bout en bout en local et en CI.
 */
export class StubProvider implements LLMProvider {
  readonly name = "stub"

  async complete({ user }: LLMPrompt): Promise<string> {
    const p = user.toLowerCase()

    // Analyse de contexte (attend du JSON avec businessNeed)
    if (p.includes("businessneed")) {
      return this.analyzeContextDoc(user)
    }

    // Prompt 1 — reformulation du besoin (attend du JSON avec problemReformulated)
    if (p.includes("problemreformulated")) {
      return JSON.stringify({
        problemReformulated:
          "Le traitement manuel d'un volume important de cas ralentit le service et mobilise les agents sur des tâches répétitives.",
        isSolutionOriented: p.includes("ia") || p.includes("logiciel"),
        detectedSignals: this.detectSignals(user),
        clarifyingQuestion: null,
        confidence: "medium",
      })
    }

    // Prompt 2 — analyse fournisseur (basée sur le contenu du document)
    if (p.includes("fitscore") || p.includes("redflags")) {
      return this.analyzeVendorDoc(user)
    }

    // Prompt 3 — rapport final (attend du markdown)
    if (p.includes("rapport de pré-cadrage") || p.includes("markdown")) {
      return [
        "# Rapport de pré-cadrage IA",
        "**Date :** (généré en mode stub)",
        "",
        "## 1. Résumé du besoin",
        "Besoin de réduire le temps de traitement manuel d'un volume important de cas.",
        "",
        "## 2. Décision recommandée",
        "**[BADGE : POC]**",
        "Un POC permettra de valider la faisabilité avant tout déploiement à l'échelle.",
        "",
        "## 3. Technologie recommandée",
        "Un modèle de langage (LLM) peut aider à traiter automatiquement les cas variés.",
        "",
        "## 4. Obligations réglementaires",
        "- RGPD : vérifier la base légale et l'information des personnes.",
        "- IA Act : évaluer le niveau de risque.",
        "",
        "## 5. Questions à poser au fournisseur",
        "Voir l'analyse fournisseur dédiée.",
        "",
        "## 6. Prochaines étapes",
        "1. Cadrer le POC (responsable : chef de projet).",
        "2. Consulter la DSI sur l'intégration.",
        "3. Lancer l'AIPD si données sensibles (responsable : DPO).",
      ].join("\n")
    }

    // Réponse générique déterministe
    return JSON.stringify({
      stub: true,
      message: "Réponse déterministe (LLM_PROVIDER=stub).",
    })
  }

  /**
   * Analyse fournisseur déterministe mais basée sur le CONTENU du document :
   * détecte les signaux (on-premise, ISO 27001, OCR/LAD, RGPD, API, références…),
   * en déduit une description de la solution + architecture, une pertinence,
   * une note de fiabilité/maturité sur 20, des points de vigilance et des questions.
   */
  private analyzeVendorDoc(user: string): string {
    const lower = user.toLowerCase()
    const docStart = lower.indexOf("document fournisseur")
    const docEnd = lower.indexOf("analyse ce document")
    const doc = (
      docStart >= 0 ? user.slice(docStart, docEnd >= 0 ? docEnd : undefined) : user
    ).toLowerCase()
    const techMatch = user.match(/recommand[ée]\s*:\s*([^\n]+)/i)
    const tech = techMatch ? techMatch[1].trim() : "non défini"
    const has = (...ks: string[]) => ks.some((k) => doc.includes(k))

    // Garanties (signaux positifs)
    const positives: string[] = []
    if (has("on-premise", "on premise", "sur site", "environnement du client", "local"))
      positives.push("hébergement on-premise (données souveraines, pas de transfert externe)")
    if (has("iso 27001", "iso/iec 27001", "27001"))
      positives.push("certification ISO/IEC 27001")
    if (has("rgpd")) positives.push("conformité RGPD affichée")
    if (has("supervision humaine", "arbitrage", "valide", "human"))
      positives.push("supervision humaine prévue (l'agent garde la main)")
    if (has(" api", "apis", "interconnex", "intégr"))
      positives.push("interopérabilité (API / intégration au SI métier)")
    if (has("mdph", "plusieurs", "référence", "déjà utilis", "production", "milliers"))
      positives.push("références / déploiements existants en production")
    if (has("docker", "traçabilité", "journal", "audit", "monitoring"))
      positives.push("traçabilité, supervision et conteneurisation")

    // Technologies détectées
    const technos: string[] = []
    if (has("ocr", "lad", "lecture automat", "reconnaissance", "icr"))
      technos.push("lecture/reconnaissance automatique de documents (OCR/LAD)")
    if (has("classification", "classer", "typage", "découpe"))
      technos.push("découpe et classification des pièces")
    if (has("extraction", "extraire", "cerfa", "métadonn"))
      technos.push("extraction de données (CERFA, métadonnées)")
    if (has("contrôle", "recevabilité", "complétude", "cohérence"))
      technos.push("contrôles de recevabilité")
    if (has("génér", "réponse automat")) technos.push("génération de réponses")

    // Points de vigilance
    const redFlags: { severity: string; claim: string; concern: string }[] = []
    if (has("jusqu'à", "99%", "99 %", "performances", "taux de succès")) {
      redFlags.push({
        severity: "medium",
        claim: "Performances élevées annoncées (ex. « jusqu'à 99 % »).",
        concern:
          "La méthodologie de mesure et le protocole de test ne sont pas détaillés ; à étayer.",
      })
    }
    if (!has("prix", "coût", "tarif", "budget", "€", "licence")) {
      redFlags.push({
        severity: "medium",
        claim: "Coûts non chiffrés dans le document.",
        concern:
          "Le coût complet (licences, maintenance, infrastructure) n'est pas précisé.",
      })
    }
    if (has("standard") && has("limite", "ne peut", "non déplaç", "premium")) {
      redFlags.push({
        severity: "low",
        claim: "Modèle standard non réentraînable localement.",
        concern:
          "Les types de documents hors corpus ne sont pas pris en charge sans option Premium.",
      })
    }

    // Dépendances cachées
    const hidden: string[] = []
    if (!has("réversib", "export", "sortie de contrat"))
      hidden.push("Réversibilité et export des données en fin de contrat à confirmer")
    if (has("prestataire", "intégrateur", "tiers", "éditeur"))
      hidden.push("Dépendance à un intégrateur / éditeur pour le déploiement et la maintenance")

    // Écarts réglementaires
    const gaps: string[] = []
    if (!has("aipd", "analyse d'impact", "art. 35"))
      gaps.push("Analyse d'impact (AIPD) non mentionnée explicitement")
    if (!has("art. 22", "décision automatis"))
      gaps.push("Encadrement des décisions automatisées (RGPD Art. 22) à préciser")

    // Note de maturité /20 et adéquation /5
    let mat = 8 + positives.length * 2 - redFlags.length * 1.5
    mat = Math.max(4, Math.min(18, Math.round(mat)))
    const fit = Math.max(1, Math.min(5, Math.round(mat / 4)))
    const reco = mat >= 14 ? "PROCEED" : mat >= 9 ? "CAUTION" : "AVOID"
    const recoReason =
      reco === "PROCEED"
        ? "Solution mature et bien alignée : on peut avancer en levant les derniers points."
        : reco === "CAUTION"
          ? "Solution prometteuse mais plusieurs zones d'ombre à lever avant engagement."
          : "Trop d'incertitudes : approfondir ou écarter en l'état."

    const vendorName = has("multigest", "provence", "efalia", "atol")
      ? "Multigest.ai (Provence.ai / Efalia / ATOL CD)"
      : "Non identifié"
    const solutionType = technos.length
      ? technos[0].replace(/\s*\(.*\)/, "")
      : "Solution de traitement documentaire IA"

    const archParts = [
      has("on-premise", "on premise", "environnement du client", "local")
        ? "déploiement on-premise dans l'environnement du client"
        : "hébergement à préciser",
    ]
    if (has("docker", "conteneur")) archParts.push("conteneurisée (Docker)")
    if (has(" api", "intégr", "si métier")) archParts.push("intégration au SI métier via API")

    const result = {
      vendorName,
      solutionType,
      solutionSummary: `La solution propose ${
        technos.length ? technos.join(", ") : "un traitement documentaire automatisé"
      }. Architecture : ${archParts.join(", ")}.`,
      relevance: `Au regard du besoin (technologie recommandée : ${tech}), la solution ${
        technos.length >= 2
          ? "couvre les fonctions clés attendues"
          : "doit préciser son périmètre fonctionnel"
      }. ${
        positives.length >= 3
          ? "Les garanties de sécurité et de souveraineté constituent un bon point d'appui."
          : "Plusieurs garanties restent à confirmer."
      }`,
      fitScore: fit,
      fitJustification: `La solution ${
        fit >= 4 ? "répond bien" : fit >= 3 ? "répond partiellement" : "répond peu"
      } au besoin identifié${technos.length ? ` (${technos[0]})` : ""}.`,
      maturityScore: mat,
      maturityJustification: `${positives.length} garantie(s) identifiée(s)${
        positives.length ? " : " + positives.slice(0, 3).join(", ") : ""
      }. ${
        redFlags.length
          ? redFlags.length + " point(s) de vigilance à lever."
          : "Peu de zones d'ombre."
      }`,
      redFlags,
      hiddenDependencies: hidden,
      regulatoryGaps: gaps,
      recommendation: reco,
      recommendationReason: recoReason,
      questionsToAsk: [
        {
          question: "Où sont hébergées les données traitées par la solution ?",
          why: "Vérifier la conformité RGPD (hébergement UE) et l'absence de transfert hors UE.",
        },
        {
          question:
            "Sur quelles données la solution a-t-elle été entraînée et évaluée, et avec quels résultats mesurés ?",
          why: "Objectiver les performances annoncées et évaluer les biais.",
        },
        {
          question:
            "Un agent humain peut-il contester ou corriger une décision du système ?",
          why: "Conformité IA Act Art. 14 (supervision humaine) et RGPD Art. 22.",
        },
        {
          question:
            "Quel est le coût complet sur 3 ans (licences, maintenance, infrastructure) ?",
          why: "Identifier les coûts cachés non mentionnés dans la proposition.",
        },
        {
          question:
            "Quelles garanties de réversibilité et d'export des données en fin de contrat ?",
          why: "Éviter l'enfermement propriétaire (vendor lock-in).",
        },
      ],
    }
    return JSON.stringify(result)
  }

  /**
   * Analyse de contexte déterministe qui LIT réellement le document :
   * extrait les sections nommées (Contexte, Objectifs, Description, Bénéfices,
   * Problème…) d'une fiche projet, à défaut un extrait représentatif du texte.
   */
  private analyzeContextDoc(user: string): string {
    const descMatch = user.match(/DESCRIPTION FOURNIE\s*:\s*([^\n]+)/i)
    let desc = descMatch ? descMatch[1].trim() : ""
    if (desc === "(non renseignée)") desc = ""

    const docIdx = user.indexOf("DOCUMENTS DE CONTEXTE")
    let docRaw =
      docIdx >= 0
        ? user.slice(docIdx).replace(/^DOCUMENTS DE CONTEXTE\s*:?/i, "")
        : ""
    // Coupe les instructions de prompt qui suivent le document (schéma JSON).
    const cut = docRaw.indexOf("Analyse et réponds")
    if (cut >= 0) docRaw = docRaw.slice(0, cut)
    const hasDocs = docRaw.replace(/\[…\]/g, "").trim().length > 40
    const low = (desc + " " + docRaw).toLowerCase()
    const has = (...k: string[]) => k.some((x) => low.includes(x))

    // Extraction d'une section nommée du document ("Contexte du projet\n ...")
    const section = (...labels: string[]): string => {
      for (const lab of labels) {
        const re = new RegExp(
          `${lab}[^\\n:]{0,40}:?\\s*\\n?\\s*([\\s\\S]{30,500}?)(?:\\n\\s*\\n|\\n[A-ZÀ-Ÿ0-9][^\\n]{0,45}\\n|$)`,
          "i",
        )
        const m = docRaw.match(re)
        if (m && m[1]) {
          const t = m[1].replace(/\s+/g, " ").trim()
          if (t.length > 25) return t
        }
      }
      return ""
    }

    const ctx = section("contexte du projet", "contexte", "description détaillée du projet", "description détaillée")
    const obj = section("objectifs du projet", "objectifs", "objectif")
    const benef = section("bénéfices du projet", "bénéfices", "gains attendus")
    const probl = section("problème", "difficultés rencontrées", "enjeux")

    // Extrait représentatif si aucune section nommée
    const firstExcerpt = (): string => {
      const clean = docRaw
        .replace(/\[…\]/g, " ")
        .replace(/page \d+ sur \d+/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
      return clean.slice(0, 400)
    }

    const processes: string[] = []
    if (has("tri", "saisie", "instruction", "classement", "courrier", "email", "mail", "dossier", "numéris", "lad"))
      processes.push("traitement / instruction de dossiers ou de courriers")
    if (has("contrôle", "vérif", "recevabilité", "complétude"))
      processes.push("contrôles de recevabilité / vérification")
    if (has("réponse", "répondre", "relation usager", "interprétariat"))
      processes.push("réponse / relation usager")
    if (has("classification", "extraction", "découpe"))
      processes.push("classification / extraction de données")

    const dataPoints: string[] = []
    if (has("iodas", "solis", "genesis", "si métier")) dataPoints.push("SI métier (Iodas / Solis…)")
    if (has("outlook", "messagerie", "mail")) dataPoints.push("messagerie / emails")
    if (has("multigest", "ged", "numéris", "scan")) dataPoints.push("GED / documents numérisés")
    if (has("cerfa", "formulaire", "dossier")) dataPoints.push("formulaires / dossiers (CERFA…)")
    if (has("santé", "social", "handicap", "médical")) dataPoints.push("données sensibles (santé / social)")

    const stakes: string[] = []
    if (has("délai", "retard", "long", "instruction")) stakes.push("délais d'instruction")
    if (has("charge", "chronophage", "répétit", "manuel", "volume")) stakes.push("charge de travail des agents")
    if (has("rgpd", "confidentialité", "données personnelles", "santé", "éthique")) stakes.push("confidentialité / conformité RGPD")
    if (has("erreur", "fiabilit", "qualité")) stakes.push("fiabilité / qualité du traitement")
    if (has("coût", "budget", "prestataire", "rationalis")) stakes.push("maîtrise des coûts")

    // Synthèse : priorité au contenu réel du document
    let summary = ""
    if (ctx) summary = ctx
    else if (hasDocs) summary = firstExcerpt()
    else if (desc) summary = desc
    else summary = "Contexte à préciser : aucun document ni description exploitable."
    if (obj) summary += ` Objectifs : ${obj}`
    if (benef && summary.length < 350) summary += ` Bénéfices attendus : ${benef}`

    const businessNeed =
      ctx || probl || obj || desc ||
      "Réduire la charge et les délais liés au traitement manuel décrit dans les documents."

    return JSON.stringify({
      summary: summary.slice(0, 700),
      businessNeed: businessNeed.slice(0, 400),
      processes,
      dataPoints,
      stakes,
      detectedSignals: this.detectSignals(low),
    })
  }

  private detectSignals(text: string): string[] {
    const keywords = [
      "ia",
      "intelligence artificielle",
      "automatisation",
      "logiciel",
      "chatbot",
      "ocr",
      "rpa",
      "machine learning",
    ]
    const lower = text.toLowerCase()
    return keywords.filter((k) => lower.includes(k))
  }
}
