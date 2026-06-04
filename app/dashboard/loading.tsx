import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <PageContainer>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex divide-x rounded-xl border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 space-y-2 px-6 py-5">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3 rounded-xl border p-6">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </PageContainer>
  )
}
