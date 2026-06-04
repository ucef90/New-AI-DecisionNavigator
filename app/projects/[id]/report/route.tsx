import { renderToBuffer } from "@react-pdf/renderer"

import { db } from "@/lib/db"
import { getOrCreateReport } from "@/lib/report/generate"
import { ReportDocument } from "@/lib/pdf/report-document"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: { decision: true },
  })
  if (!project || !project.decision) {
    return new Response("Aucune décision disponible pour ce projet.", {
      status: 404,
    })
  }

  const markdown = await getOrCreateReport(params.id)
  if (!markdown) {
    return new Response("Rapport indisponible.", { status: 500 })
  }

  const buffer = await renderToBuffer(<ReportDocument markdown={markdown} />)
  const slug = project.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="precadrage-${slug}.pdf"`,
    },
  })
}
