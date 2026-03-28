import { Skeleton } from "@/components/ui/skeleton"

export function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div className="w-full rounded-lg overflow-hidden border bg-muted/20" style={{ height }}>
      <Skeleton className="w-full h-full" />
    </div>
  )
}
