import { CaretRight, Sparkle } from "@phosphor-icons/react/dist/ssr"

import { ArchitectureDiagram } from "@/components/decision/architecture-diagram"
import type { SolutionProposalData } from "@/lib/prompts/solution"

// Affichage riche de la proposition de solution générée par le LLM (sur mesure).

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

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  )
}

export function SolutionProposal({
  data,
  tech,
}: {
  data: SolutionProposalData
  tech?: string | null
}) {
  return (
    <details open className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Sparkle className="size-4 text-violet-500" weight="fill" aria-hidden />
            Proposition de solution technique
          </h3>
          <p className="text-sm text-muted-foreground">
            Générée sur mesure à partir du cadrage de ce projet
            {tech ? ` (orientation ${tech})` : ""} — architecture, justifications,
            sécurité, trajectoire et coûts indicatifs.
          </p>
        </div>
        <CaretRight
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
          aria-hidden
        />
      </summary>

      <div className="border-t px-5 pb-5 pt-4">
        {data.contexte ? (
          <Section title="1. Contexte & enjeux" open>
            <p className="leading-relaxed">{data.contexte}</p>
          </Section>
        ) : null}

        {data.objectifs.length > 0 ? (
          <Section title="2. Objectifs">
            <Bullets items={data.objectifs} />
          </Section>
        ) : null}

        {data.exigencesFonctionnelles.length > 0 ||
        data.exigencesNonFonctionnelles.length > 0 ? (
          <Section title="3. Exigences">
            {data.exigencesFonctionnelles.length > 0 ? (
              <div>
                <p className="mb-1 font-medium text-foreground">Fonctionnelles</p>
                <Bullets items={data.exigencesFonctionnelles} />
              </div>
            ) : null}
            {data.exigencesNonFonctionnelles.length > 0 ? (
              <div>
                <p className="mb-1 font-medium text-foreground">
                  Non fonctionnelles
                </p>
                <Bullets items={data.exigencesNonFonctionnelles} />
              </div>
            ) : null}
          </Section>
        ) : null}

        {data.principes.length > 0 ? (
          <Section title="4. Principes directeurs">
            <Bullets items={data.principes} />
          </Section>
        ) : null}

        {data.architecture.layers.length > 0 ? (
          <Section title="5. Architecture cible" open>
            <ArchitectureDiagram
              layers={data.architecture.layers}
              transverse={data.architecture.transverse}
            />
          </Section>
        ) : null}

        {data.composants.length > 0 ? (
          <Section title="6. Composants & justification des choix">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <Th>Couche</Th>
                    <Th>Techno</Th>
                    <Th>Rôle</Th>
                    <Th>Justification</Th>
                    <Th>Alternative</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.composants.map((c, i) => (
                    <tr key={i}>
                      <Td>{c.couche}</Td>
                      <Td>
                        <span className="font-medium text-foreground">
                          {c.techno}
                        </span>
                      </Td>
                      <Td>{c.role}</Td>
                      <Td>{c.justification}</Td>
                      <Td>{c.alternative}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        ) : null}

        {data.chaineTraitement.length > 0 ? (
          <Section title="7. Chaîne de traitement">
            <ol className="list-decimal space-y-1 pl-4">
              {data.chaineTraitement.map((s, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{s.etape}</span>
                  {s.description ? ` — ${s.description}` : ""}
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        {data.integrations.length > 0 ? (
          <Section title="8. Intégrations SI">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Sens</Th>
                  <Th>Système</Th>
                  <Th>Mode</Th>
                </tr>
              </thead>
              <tbody>
                {data.integrations.map((it, i) => (
                  <tr key={i}>
                    <Td>{it.sens}</Td>
                    <Td>{it.systeme}</Td>
                    <Td>{it.mode}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : null}

        {data.securiteConformite.length > 0 ? (
          <Section title="9. Sécurité & conformité">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Référence</Th>
                  <Th>Exigence</Th>
                  <Th>Application</Th>
                </tr>
              </thead>
              <tbody>
                {data.securiteConformite.map((s, i) => (
                  <tr key={i}>
                    <Td>{s.reference}</Td>
                    <Td>{s.exigence}</Td>
                    <Td>{s.application}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : null}

        {data.dimensionnement.length > 0 ? (
          <Section title="10. Dimensionnement">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Composant</Th>
                  <Th>Minimum</Th>
                  <Th>Recommandé</Th>
                </tr>
              </thead>
              <tbody>
                {data.dimensionnement.map((d, i) => (
                  <tr key={i}>
                    <Td>{d.composant}</Td>
                    <Td>{d.min}</Td>
                    <Td>{d.reco}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : null}

        {data.trajectoire.length > 0 ? (
          <Section title="11. Trajectoire de déploiement">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Phase</Th>
                  <Th>Objectif</Th>
                  <Th>Livrables</Th>
                  <Th>Charge</Th>
                  <Th>Durée</Th>
                </tr>
              </thead>
              <tbody>
                {data.trajectoire.map((t, i) => (
                  <tr key={i}>
                    <Td>{t.phase}</Td>
                    <Td>{t.objectif}</Td>
                    <Td>{t.livrables}</Td>
                    <Td>{t.charge}</Td>
                    <Td>{t.duree}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : null}

        {data.couts.length > 0 ? (
          <Section title="12. Coûts indicatifs">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Poste</Th>
                  <Th>Hypothèse</Th>
                  <Th>Ordre de grandeur</Th>
                </tr>
              </thead>
              <tbody>
                {data.couts.map((c, i) => (
                  <tr key={i}>
                    <Td>{c.poste}</Td>
                    <Td>{c.hypothese}</Td>
                    <Td>{c.fourchette}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : null}

        {data.risques.length > 0 ? (
          <Section title="13. Risques & mitigations">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Risque</Th>
                  <Th>Impact</Th>
                  <Th>Probabilité</Th>
                  <Th>Mitigation</Th>
                </tr>
              </thead>
              <tbody>
                {data.risques.map((r, i) => (
                  <tr key={i}>
                    <Td>{r.risque}</Td>
                    <Td>{r.impact}</Td>
                    <Td>{r.probabilite}</Td>
                    <Td>{r.mitigation}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : null}

        {data.alternatives.length > 0 ? (
          <Section title="14. Alternatives & arbitrages">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Sujet</Th>
                  <Th>Recommandé</Th>
                  <Th>Arbitrage</Th>
                </tr>
              </thead>
              <tbody>
                {data.alternatives.map((a, i) => (
                  <tr key={i}>
                    <Td>{a.sujet}</Td>
                    <Td>{a.recommande}</Td>
                    <Td>{a.arbitrage}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : null}

        {data.kpis.length > 0 ? (
          <Section title="15. Indicateurs de succès">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Indicateur</Th>
                  <Th>Cible</Th>
                </tr>
              </thead>
              <tbody>
                {data.kpis.map((k, i) => (
                  <tr key={i}>
                    <Td>{k.indicateur}</Td>
                    <Td>{k.cible}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : null}

        {data.hypotheses.length > 0 ? (
          <Section title="16. Hypothèses & prérequis">
            <Bullets items={data.hypotheses} />
          </Section>
        ) : null}
      </div>
    </details>
  )
}
