import { requireUser } from "@/lib/auth"
import { PageContainer, PageHeader } from "@/components/layout/page-container"
import { FrameworkMethod } from "@/components/methode/framework-method"

export const metadata = { title: "Méthode de cadrage — Framework 6 socles" }

export default async function MethodePage() {
  await requireUser()
  return (
    <PageContainer className="max-w-4xl space-y-6">
      <PageHeader
        title="Méthode de cadrage"
        description="Framework méthodologique en 6 socles : de la compréhension du problème métier jusqu'à la décision GO / NO GO. Chaque socle produit un artefact qui alimente le suivant."
      />
      <FrameworkMethod />
    </PageContainer>
  )
}
