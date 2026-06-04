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

    // Prompt 2 — analyse fournisseur (attend du JSON avec fitScore)
    if (p.includes("fitscore") || p.includes("redflags")) {
      return JSON.stringify({
        vendorName: "Non identifié",
        solutionType: "Solution IA générique (stub)",
        fitScore: 3,
        fitJustification:
          "La solution couvre partiellement le besoin exprimé. Plusieurs points restent à clarifier avant décision.",
        redFlags: [
          {
            severity: "medium",
            claim: "Performances annoncées sans méthodologie de mesure.",
            concern:
              "Aucune donnée chiffrée ni protocole de test n'est fourni pour étayer les performances.",
          },
        ],
        hiddenDependencies: [
          "Dépendance à un service cloud tiers",
          "Coûts de maintenance annuels non détaillés",
        ],
        questionsToAsk: [
          {
            question: "Où sont hébergées les données traitées par la solution ?",
            why: "Vérifier la conformité RGPD (hébergement UE) et l'absence de transfert hors UE.",
          },
          {
            question:
              "Sur quelles données la solution a-t-elle été entraînée et évaluée ?",
            why: "Évaluer la représentativité et les biais potentiels du modèle.",
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
        regulatoryGaps: [
          "Analyse d'impact (AIPD) non mentionnée",
          "Modalités d'information des personnes concernées absentes",
        ],
        recommendation: "CAUTION",
        recommendationReason:
          "Solution potentiellement adaptée mais plusieurs zones d'ombre à lever avant tout engagement.",
      })
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
