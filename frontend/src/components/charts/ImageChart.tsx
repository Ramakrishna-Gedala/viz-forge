import { ChartSkeleton } from "@/components/shared/ChartSkeleton"
import { ErrorAlert } from "@/components/shared/ErrorAlert"

interface ImageChartProps {
  data?: { image: string }
  isLoading: boolean
  error?: Error | null
  height?: number
  title?: string
}

export function ImageChart({ data, isLoading, error, height = 400, title }: ImageChartProps) {
  if (isLoading) return <ChartSkeleton height={height} />
  if (error) return <ErrorAlert message={error.message} />
  if (!data?.image) return null

  return (
    <div className="w-full rounded-lg border overflow-hidden bg-card">
      {title && (
        <div className="px-4 py-2 border-b text-sm font-medium">{title}</div>
      )}
      <img
        src={`data:image/png;base64,${data.image}`}
        alt={title ?? "Chart"}
        className="w-full h-auto"
      />
    </div>
  )
}
