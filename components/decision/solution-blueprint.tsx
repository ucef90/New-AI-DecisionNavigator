import type { TechType, Verdict } from "@prisma/client"
import { CaretRight, Info } from "@phosphor-icons/react/dist/ssr"

import { TECH_SHORT } from "@/lib/decision/labels"

// Bloc « proposition de solution » — EXEMPLE générique d'architecture cible,
// présenté en sections dépliables (HTML natif <details>, accessible, sans JS).

function Section({
  title,
  children,
  open = false,
}: {
  title: string
  children: React.ReactNode
  open?: boolean
}) {
  return (
    <details open={open} className="group border-t py-3 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
        <CaretRight
          className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90"
          aria-hidden
        />
        {title}
      </summary>
      <div className="mt-3 space-y-3 pl-5 text-sm text-muted-foreground">
        {children}
      </div>
    </details>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b px-2 py-1.5 text-left font-medium text-foreground">
      {children}
    </th>
  )
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-b px-2 py-1.5 align-top">{children}</td>
}

const STACK: [string, string, string, string][] = [
  ["Reverse proxy", "Traefik", "TLS, routage, SSO", "Nginx, HAProxy"],
  ["Orchestration règles", "Apache NiFi", "Ingestion + règles métier", "Camunda, n8n"],
  ["API backend", "Python · FastAPI", "Orchestration des services", "Flask, NestJS"],
  ["Service modèles", "PyTorch · TorchServe", "Servir les modèles IA", "ONNX, Triton"],
  ["OCR / ICR", "PaddleOCR · docTR", "Texte imprimé + manuscrit", "ABBYY"],
  ["Base relationnelle", "PostgreSQL", "Config, états, audit", "MySQL"],
  ["Base documentaire", "MongoDB", "Métadonnées, annotations", "Elasticsearch"],
  ["Cache / file", "Redis", "File d'attente, sessions", "RabbitMQ"],
  ["Stockage fichiers", "MinIO (chiffré)", "PDF / images temporaires", "Volume LUKS"],
  ["Front-end", "React · TypeScript", "UI agents + arbitrage", "Vue, Angular"],
  ["Auth", "Keycloak (SSO/AD)", "RBAC, fédération AD", "AD FS"],
  ["Conteneurs", "Docker Compose", "Orchestration services", "Kubernetes"],
  ["Observabilité", "Prometheus · Grafana · ELK", "Métriques, logs, alerting", "Zabbix"],
  ["LLM (option)", "LLM local (Ollama)", "Aide hors données sensibles", "—"],
]

const ARCHI_ASCII = `Entrées        Scanner · Bannette GED · Messagerie · Dossier partagé
   │
Plateforme     Traefik (TLS/SSO) · NiFi (règles métier)
   │
Traitement IA  Découpe → OCR/ICR → Classification → Extraction → Contrôles
   │
Données        PostgreSQL · MongoDB · Redis · MinIO (chiffré)
   │
Restitution    Front React (arbitrage) · GED Multigest · API SI Métier
   │
Transverse     Prometheus/Grafana · ELK · Keycloak (SSO/RBAC)`

export function SolutionBlueprint({
  tech,
  verdict,
}: {
  tech: TechType | null
  verdict: Verdict
}) {
  const isAutomation = verdict === "AUTOMATION" || tech === "RPA"

  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold">
            Proposition de solution (exemple)
          </h3>
          <p className="text-sm text-muted-foreground">
            Architecture cible, stack, sécurité, déploiement — à adapter au
            contexte réel.
          </p>
        </div>
        <CaretRight
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
          aria-hidden
        />
      </summary>

      <div className="border-t px-5 pb-5 pt-4">
        {/* Avertissement */}
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <Info
            className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <p className="text-foreground/90">
            <span className="font-medium">Exemple indicatif.</span> Cette
            proposition est générique{tech ? ` (profil orienté ${TECH_SHORT[tech]})` : ""}
            . Elle doit être adaptée au contexte réel après cadrage et AIPD.
            {isAutomation
              ? " Profil automatisation : la couche IA/ML est allégée au profit du moteur de règles et des connecteurs."
              : ""}
          </p>
        </div>

        <Section title="1. Principes directeurs" open>
          <ul className="list-disc space-y-1 pl-4">
            <li>Souveraineté : 100 % on-premise, aucune donnée hors du périmètre.</li>
            <li>Modularité : chaque étape est un service indépendant remplaçable.</li>
            <li>Human-in-the-loop : l'IA assiste, l'agent décide et corrige.</li>
            <li>Explicabilité : score de confiance + journal pour chaque résultat.</li>
            <li>Sécurité par conception : chiffrement, RBAC/SSO, flux minimaux.</li>
          </ul>
        </Section>

        <Section title="2. Vue logique en couches">
          <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed text-foreground">
            {ARCHI_ASCII}
          </pre>
        </Section>

        <Section title="3. Flux de traitement séquencé">
          <ol className="list-decimal space-y-1 pl-4">
            <li>Réception du pli en bannette → déclenchement NiFi.</li>
            <li>Découpe du pli en pièces unitaires.</li>
            <li>OCR/ICR (texte imprimé + manuscrit).</li>
            <li>Classification typée (score de confiance).</li>
            <li>Extraction des métadonnées (identité, dates, NIR…).</li>
            <li>Contrôles de recevabilité (ok / nok).</li>
            <li>Arbitrage humain si confiance faible ou contrôle bloquant.</li>
            <li>Ventilation + intercalaires + versement GED + création SI Métier.</li>
          </ol>
        </Section>

        <Section title="4. Stack technologique">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Couche</Th>
                  <Th>Techno</Th>
                  <Th>Rôle</Th>
                  <Th>Alternative</Th>
                </tr>
              </thead>
              <tbody>
                {STACK.map(([couche, t, role, alt]) => (
                  <tr key={couche}>
                    <Td>{couche}</Td>
                    <Td>
                      <span className="font-medium text-foreground">{t}</span>
                    </Td>
                    <Td>{role}</Td>
                    <Td>{alt}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="5. Intégrations">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Sens</Th>
                <Th>Système</Th>
                <Th>Mode</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Entrée</Td>
                <Td>Scanner / bannette GED</Td>
                <Td>Watcher NiFi</Td>
              </tr>
              <tr>
                <Td>Entrée</Td>
                <Td>Messagerie (Outlook)</Td>
                <Td>Connecteur corps + PJ</Td>
              </tr>
              <tr>
                <Td>Sortie</Td>
                <Td>GED Efalia / Multigest</Td>
                <Td>Versement + intercalaires</Td>
              </tr>
              <tr>
                <Td>Sortie</Td>
                <Td>SI Métier MDPH</Td>
                <Td>API éditeur ou RPA</Td>
              </tr>
              <tr>
                <Td>Extension</Td>
                <Td>LLM local</Td>
                <Td>Connecteur (hors données sensibles)</Td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="6. Sécurité & conformité">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Référence</Th>
                <Th>Application</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>RGPD Art. 6.1.e</Td>
                <Td>Base légale : mission d'intérêt public.</Td>
              </tr>
              <tr>
                <Td>RGPD Art. 9.2.g</Td>
                <Td>Données de santé : intérêt public + garanties renforcées.</Td>
              </tr>
              <tr>
                <Td>RGPD Art. 28</Td>
                <Td>Contrat de sous-traitance éditeur/intégrateur.</Td>
              </tr>
              <tr>
                <Td>RGPD Art. 32</Td>
                <Td>Chiffrement, traçabilité, RBAC.</Td>
              </tr>
              <tr>
                <Td>RGPD Art. 35</Td>
                <Td>AIPD obligatoire avant lancement.</Td>
              </tr>
              <tr>
                <Td>IA Act Art. 14 + Annexe III</Td>
                <Td>Haut risque (services sociaux) : supervision humaine.</Td>
              </tr>
              <tr>
                <Td>ISO 27001 / 42001</Td>
                <Td>Sécurité de l'information / management de l'IA.</Td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="7. Infrastructure & déploiement">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Composant</Th>
                <Th>Minimum</Th>
                <Th>Recommandé</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>CPU</Td>
                <Td>12 vCPU</Td>
                <Td>24 vCPU</Td>
              </tr>
              <tr>
                <Td>RAM</Td>
                <Td>32 Go</Td>
                <Td>64 Go</Td>
              </tr>
              <tr>
                <Td>Disque</Td>
                <Td>1,5 To SSD</Td>
                <Td>2–4 To SSD NVMe</Td>
              </tr>
              <tr>
                <Td>OS</Td>
                <Td>Debian 12 LTS</Td>
                <Td>Ubuntu 22.04 LTS</Td>
              </tr>
            </tbody>
          </table>
          <p>
            Topologie Docker Compose ; réseaux isolés (front / app / data) ;
            accès Internet restreint (licences, MAJ, télémaintenance).
          </p>
        </Section>

        <Section title="8. Trajectoire de déploiement">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Phase</Th>
                <Th>Contenu</Th>
                <Th>Durée</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>0. Cadrage</Td>
                <Td>AIPD, plan de classement, accès</Td>
                <Td>2–3 sem.</Td>
              </tr>
              <tr>
                <Td>1. POC</Td>
                <Td>1 flux, 1 équipe, mesure des perfs</Td>
                <Td>6–8 sem.</Td>
              </tr>
              <tr>
                <Td>2. Recette</Td>
                <Td>Tests + formation agents</Td>
                <Td>2–3 sem.</Td>
              </tr>
              <tr>
                <Td>3. Industrialisation</Td>
                <Td>Montée en charge, intégration SI</Td>
                <Td>4–6 sem.</Td>
              </tr>
              <tr>
                <Td>4. Run</Td>
                <Td>MCO, amélioration continue</Td>
                <Td>continu</Td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="9. Risques & mitigations">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Risque</Th>
                <Th>Mitigation</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Qualité de numérisation hétérogène</Td>
                <Td>Normalisation image, contrôle qualité en entrée</Td>
              </tr>
              <tr>
                <Td>Pièces hors périmètre</Td>
                <Td>Mise en arbitrage, non comptées en erreur</Td>
              </tr>
              <tr>
                <Td>API SI Métier indisponible</Td>
                <Td>RPA transitoire, planning éditeur</Td>
              </tr>
              <tr>
                <Td>AIPD non réalisée</Td>
                <Td>AIPD bloquante avant lancement</Td>
              </tr>
              <tr>
                <Td>Dérive du modèle</Td>
                <Td>Tests de non-régression, versionnage, monitoring</Td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="10. Hypothèses & prérequis">
          <ul className="list-disc space-y-1 pl-4">
            <li>Numérisation en place (scanner ou flux GED).</li>
            <li>VM dédiée conforme au dimensionnement, OS LTS supporté.</li>
            <li>Accès AD/SSO pour l'authentification des agents.</li>
            <li>AIPD validée par le DPO avant mise en production.</li>
            <li>Contrat de sous-traitance (art. 28 RGPD) signé.</li>
          </ul>
        </Section>
      </div>
    </details>
  )
}
