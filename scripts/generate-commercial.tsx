/**
 * Génère deux PDF commerciaux dans le dossier ./commercial :
 *  1. Plaquette commerciale (valeur, fonctionnement, usage)
 *  2. Grille tarifaire (offres et options)
 *
 * Lancer :  npx tsx scripts/generate-commercial.tsx
 */
import React from "react"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToFile,
} from "@react-pdf/renderer"

// ── Palette (alignée sur le rapport produit) ──────────────────
const PRIMARY = "#4F46E5"
const INK = "#18181b"
const MUTED = "#71717a"
const BORDER = "#e4e4e7"
const EMERALD = "#059669"
const AMBER = "#d97706"
const INDIGO_BG = "#eef2ff"

const s = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 52,
    paddingHorizontal: 46,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: INK,
    lineHeight: 1.5,
  },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: PRIMARY,
    color: "#fff",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 6,
    marginRight: 8,
  },
  brand: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 14, lineHeight: 1.15 },
  tagline: { fontSize: 11, color: PRIMARY, marginTop: 4, fontFamily: "Helvetica-Bold" },
  lead: { fontSize: 10.5, color: MUTED, marginTop: 6 },
  section: { marginTop: 16 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", color: PRIMARY, marginBottom: 6 },
  para: { marginBottom: 4 },
  bullet: { flexDirection: "row", marginBottom: 3 },
  dot: { width: 12, color: PRIMARY, fontFamily: "Helvetica-Bold" },
  bulletText: { flexGrow: 1, flexBasis: 0 },
  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
  },
  step: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 10,
    width: "47%",
    marginBottom: 10,
  },
  stepNum: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    marginBottom: 2,
  },
  stepTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginBottom: 2 },
  pill: {
    fontSize: 8,
    color: "#fff",
    backgroundColor: PRIMARY,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  priceTag: { fontSize: 19, fontFamily: "Helvetica-Bold", color: INK, lineHeight: 1.15 },
  priceUnit: { fontSize: 9, color: MUTED, marginTop: 1 },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 46,
    right: 46,
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
})

function Brand() {
  return (
    <View style={s.brandRow}>
      <Text style={s.logo}>BE</Text>
      <Text style={s.brand}>Beyond Expertise</Text>
    </View>
  )
}

function Footer() {
  return (
    <Text style={s.footer} fixed>
      © 2026 Beyond Expertise — éditeur logiciel · AI Pré-Cadrage · Document
      commercial — tarifs indicatifs HT
    </Text>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bullet}>
      <Text style={s.dot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  )
}

function B({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontFamily: "Helvetica-Bold" }}>{children}</Text>
}

// ════════════════════════════════════════════════════════════
// PDF 1 — Plaquette commerciale
// ════════════════════════════════════════════════════════════
function Brochure() {
  return (
    <Document
      title="AI Pré-Cadrage — Plaquette commerciale"
      author="Beyond Expertise"
    >
      {/* Page 1 */}
      <Page size="A4" style={s.page}>
        <Brand />
        <Text style={s.h1}>AI Pré-Cadrage</Text>
        <Text style={s.tagline}>
          Décider vite et bien si un besoin se prête à l&apos;intelligence
          artificielle.
        </Text>
        <Text style={s.lead}>
          AI Pré-Cadrage est l&apos;outil d&apos;aide à la décision qui guide les
          chefs de projet du secteur public, de l&apos;expression d&apos;un besoin
          jusqu&apos;à une recommandation argumentée : faut-il faire de l&apos;IA,
          avec quelle technologie, et sous quelles obligations réglementaires ?
        </Text>

        <View style={s.section}>
          <Text style={s.h2}>Le constat</Text>
          <Bullet>
            <B>L&apos;IA est partout, mais mal cadrée.</B> Beaucoup de projets
            partent d&apos;une solution (« il nous faut un chatbot ») plutôt que
            d&apos;un vrai besoin métier — avec un risque d&apos;investissement
            inutile.
          </Bullet>
          <Bullet>
            <B>La frontière IA / automatisation est floue.</B> Un processus stable
            et répétitif relève souvent d&apos;une automatisation classique, plus
            robuste et moins coûteuse que l&apos;IA.
          </Bullet>
          <Bullet>
            <B>La conformité est complexe.</B> RGPD, règlement IA européen, CNIL,
            ISO : les obligations sont difficiles à anticiper et lourdes de
            conséquences si elles sont oubliées.
          </Bullet>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>La solution</Text>
          <Text style={s.para}>
            En moins de 15 minutes, l&apos;outil transforme un besoin exprimé en
            langage courant en une <B>décision claire et défendable</B> :
          </Text>
          <Bullet>
            <B>Un verdict</B> : GO, POC, Étude, Automatisation ou NO GO, avec un
            score d&apos;évaluation sur 6 axes.
          </Bullet>
          <Bullet>
            <B>Une technologie recommandée</B> : RPA, Machine Learning, LLM, RAG,
            OCR ou agent — selon la nature réelle du besoin.
          </Bullet>
          <Bullet>
            <B>Les obligations réglementaires</B> applicables (RGPD, IA Act, CNIL,
            ISO), avec les actions concrètes à mener.
          </Bullet>
          <Bullet>
            <B>Un rapport PDF</B> complet et synthétique, prêt à partager avec la
            DSI, le DPO ou la direction.
          </Bullet>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>La valeur ajoutée</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              [
                "Des décisions objectives",
                "Un moteur d'analyse déterministe et transparent : mêmes réponses, même verdict. Fini les choix « au feeling ».",
              ],
              [
                "Du temps gagné",
                "Un pré-cadrage structuré en minutes, là où il fallait des réunions et des semaines d'allers-retours.",
              ],
              [
                "La conformité maîtrisée",
                "Les risques réglementaires sont identifiés dès le départ, avec les bons réflexes (AIPD, supervision humaine…).",
              ],
              [
                "La souveraineté",
                "Un mode 100 % local (on-premise) où les données ne quittent jamais vos serveurs — idéal pour le secteur public.",
              ],
            ].map(([t, d]) => (
              <View key={t} style={[s.card, { width: "47%" }]}>
                <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                  {t}
                </Text>
                <Text style={{ color: MUTED, fontSize: 9 }}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer />
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={s.page}>
        <Brand />

        <View style={{ marginTop: 8 }}>
          <Text style={s.h2}>Comment ça marche — 4 étapes</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {[
              [
                "1",
                "Contexte & documents",
                "Importez vos documents (note de cadrage, fiche projet…). L'outil les lit pour comprendre le besoin et pré-remplir le questionnaire.",
              ],
              [
                "2",
                "Questionnaire guidé",
                "Un parcours adaptatif (les questions hors-sujet se masquent) qualifie le besoin : nature, données, faisabilité, organisation.",
              ],
              [
                "3",
                "Décision & analyse",
                "Verdict, score sur 6 axes, profil technologique, niveau de risque réglementaire et feuille de route — instantanément.",
              ],
              [
                "4",
                "Rapport & partage",
                "Un rapport PDF d'une à deux pages, rédigé par l'IA et ancré sur votre référentiel interne, prêt à diffuser.",
              ],
            ].map(([n, t, d]) => (
              <View key={n} style={s.step}>
                <Text style={s.stepNum}>{n}</Text>
                <Text style={s.stepTitle}>{t}</Text>
                <Text style={{ color: MUTED, fontSize: 9 }}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Fonctionnalités clés</Text>
          <Bullet>
            <B>Questionnaire adaptatif</B> — 26 questions réparties en thèmes, qui
            s&apos;ajustent au contexte de chaque projet.
          </Bullet>
          <Bullet>
            <B>Moteur de décision déterministe</B> — règles métier explicites
            (faisabilité, données, réglementation) pour des verdicts reproductibles.
          </Bullet>
          <Bullet>
            <B>Base de connaissances (RAG)</B> — l&apos;outil s&apos;enrichit de vos
            documents, décisions et analyses passées pour des réponses ancrées.
          </Bullet>
          <Bullet>
            <B>Assistant conversationnel</B> — un chatbot intégré répond aux
            questions sur l&apos;IA, la conformité et vos projets.
          </Bullet>
          <Bullet>
            <B>Analyse de réponses fournisseurs</B> — évalue une proposition
            (maturité, points de vigilance, questions à poser).
          </Bullet>
          <Bullet>
            <B>Tableau de bord</B> — vue d&apos;ensemble des projets, décisions et
            risques réglementaires.
          </Bullet>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Deux modes de déploiement</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={[s.card, { width: "48%", backgroundColor: INDIGO_BG, borderColor: PRIMARY }]}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
                SaaS (cloud)
              </Text>
              <Text style={{ color: MUTED, fontSize: 9 }}>
                Accessible immédiatement, sans installation. Mises à jour
                automatiques, hébergement géré, moteur IA cloud (Claude) pour des
                analyses de haute qualité.
              </Text>
            </View>
            <View style={[s.card, { width: "48%" }]}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
                On-premise (souverain)
              </Text>
              <Text style={{ color: MUTED, fontSize: 9 }}>
                Installé sur vos serveurs. Les données ne sortent jamais de votre
                système d&apos;information. Moteur IA local (Ollama) — 100 %
                souverain, idéal pour les données sensibles.
              </Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Pour qui ?</Text>
          <Text style={s.para}>
            Chefs de projet, DSI, directions métier et décideurs des{" "}
            <B>collectivités territoriales, administrations et établissements
            publics</B> qui veulent investir dans l&apos;IA à bon escient, en
            maîtrisant le risque et la conformité.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}

// ════════════════════════════════════════════════════════════
// PDF 2 — Grille tarifaire
// ════════════════════════════════════════════════════════════
interface Offer {
  name: string
  tag: string
  price: string
  unit: string
  audience: string
  features: string[]
  highlight?: boolean
}

const OFFERS: Offer[] = [
  {
    name: "Essentiel",
    tag: "SaaS",
    price: "290 €",
    unit: "/ mois  (ou 2 900 € / an)",
    audience: "Un service ou une petite structure",
    features: [
      "Jusqu'à 5 utilisateurs",
      "Pré-cadrage illimité",
      "Décisions, rapports PDF, tableau de bord",
      "Base de connaissances (RAG)",
      "Assistant conversationnel",
      "Support par email",
    ],
  },
  {
    name: "Pro",
    tag: "SaaS",
    price: "690 €",
    unit: "/ mois  (ou 6 900 € / an)",
    audience: "Une direction ou une collectivité",
    features: [
      "Jusqu'à 25 utilisateurs",
      "Tout l'offre Essentiel",
      "Analyse de réponses fournisseurs",
      "Moteur IA cloud (Claude) inclus",
      "Support prioritaire",
      "Mises à jour des référentiels",
    ],
    highlight: true,
  },
  {
    name: "Souverain",
    tag: "On-premise",
    price: "à partir de 14 000 €",
    unit: "licence + 2 800 € / an de maintenance",
    audience: "Données sensibles, exigence de souveraineté",
    features: [
      "Installé sur vos serveurs",
      "Utilisateurs illimités",
      "Données 100 % internes (aucun cloud)",
      "Moteur IA local (Ollama)",
      "Maintenance & mises à jour",
    ],
  },
  {
    name: "Sur-mesure",
    tag: "Entreprise",
    price: "Sur devis",
    unit: "selon le périmètre",
    audience: "Grand compte, besoins spécifiques",
    features: [
      "Utilisateurs illimités",
      "Intégration au SI métier",
      "Référentiel & moteur IA dédiés",
      "Accompagnement & SLA personnalisés",
    ],
  },
]

const ADDONS: [string, string][] = [
  ["Formation & prise en main", "900 € / jour"],
  ["Accompagnement au déploiement", "sur devis"],
  ["Intégration au SI métier (Iodas, GED…)", "sur devis"],
  ["Personnalisation du référentiel (RAG)", "à partir de 1 500 €"],
  ["Hébergement infogéré (VPS dédié)", "à partir de 90 € / mois"],
  ["Clé IA cloud (Anthropic) à l'usage", "refacturée au coût réel"],
]

function OfferCard({ o }: { o: Offer }) {
  return (
    <View
      style={[
        s.card,
        {
          width: "47%",
          marginBottom: 12,
          backgroundColor: o.highlight ? INDIGO_BG : "#fff",
          borderColor: o.highlight ? PRIMARY : BORDER,
        },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold" }}>{o.name}</Text>
        <Text style={s.pill}>{o.tag}</Text>
      </View>
      <Text style={{ color: MUTED, fontSize: 8.5, marginTop: 2, marginBottom: 6 }}>
        {o.audience}
      </Text>
      <Text style={s.priceTag}>{o.price}</Text>
      <Text style={[s.priceUnit, { marginBottom: 8 }]}>{o.unit}</Text>
      {o.features.map((f) => (
        <View key={f} style={[s.bullet, { marginBottom: 2 }]}>
          <Text style={s.dot}>•</Text>
          <Text style={[s.bulletText, { fontSize: 9 }]}>{f}</Text>
        </View>
      ))}
    </View>
  )
}

function Pricing() {
  return (
    <Document title="AI Pré-Cadrage — Grille tarifaire" author="Beyond Expertise">
      <Page size="A4" style={s.page}>
        <Brand />
        <Text style={s.h1}>Grille tarifaire</Text>
        <Text style={s.tagline}>AI Pré-Cadrage — offres et options</Text>
        <Text style={s.lead}>
          Deux modèles au choix : un <B>abonnement SaaS</B> (sans installation,
          mises à jour incluses) ou une <B>licence on-premise</B> (souveraine,
          installée chez vous). Tarifs indicatifs HT, à ajuster selon le périmètre.
        </Text>

        <View style={[s.section, { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }]}>
          {OFFERS.map((o) => (
            <OfferCard key={o.name} o={o} />
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Options & services</Text>
          <View style={[s.card, { padding: 0 }]}>
            {ADDONS.map(([label, price], i) => (
              <View
                key={label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderTopWidth: i === 0 ? 0 : 0.5,
                  borderTopColor: BORDER,
                }}
              >
                <Text style={{ fontSize: 9.5 }}>{label}</Text>
                <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: PRIMARY }}>
                  {price}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Comment choisir ?</Text>
          <Bullet>
            <B>Vous voulez démarrer vite, sans infrastructure</B> — choisissez le{" "}
            SaaS (Essentiel ou Pro). Idéal pour évaluer l&apos;outil et monter en
            charge progressivement.
          </Bullet>
          <Bullet>
            <B>Vos données sont sensibles ou la souveraineté est imposée</B> —
            choisissez l&apos;offre Souverain (on-premise) : tout reste chez vous.
          </Bullet>
          <Bullet>
            <B>Besoin d&apos;intégration au SI ou d&apos;un cadre spécifique</B> —
            l&apos;offre Sur-mesure s&apos;adapte à votre contexte.
          </Bullet>
          <Text style={{ color: MUTED, fontSize: 9, marginTop: 6 }}>
            Remises possibles : engagement annuel, multi-sites, secteur public
            (groupements de commandes). Période d&apos;essai et démonstration sur
            demande.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}

// ── Génération ────────────────────────────────────────────────
async function main() {
  const outDir = join(process.cwd(), "commercial")
  mkdirSync(outDir, { recursive: true })

  const brochurePath = join(outDir, "AI-Precadrage-Plaquette-Commerciale.pdf")
  const pricingPath = join(outDir, "AI-Precadrage-Grille-Tarifaire.pdf")

  await renderToFile(<Brochure />, brochurePath)
  await renderToFile(<Pricing />, pricingPath)

  console.log("PDF générés :")
  console.log("  -", brochurePath)
  console.log("  -", pricingPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
