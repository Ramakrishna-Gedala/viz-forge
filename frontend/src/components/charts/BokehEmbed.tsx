import { ChartSkeleton } from "@/components/shared/ChartSkeleton"
import { ErrorAlert } from "@/components/shared/ErrorAlert"

interface BokehEmbedProps {
  data?: { html: string }
  isLoading: boolean
  error?: Error | null
  height?: number
  title?: string
}

export function BokehEmbed({ data, isLoading, error, height = 600, title }: BokehEmbedProps) {
  if (isLoading) return <ChartSkeleton height={height} />
  if (error) return <ErrorAlert message={error.message} />
  if (!data?.html) return null

  return (
    <div className="w-full rounded-lg border overflow-hidden bg-card">
      {title && <div className="px-4 py-2 border-b text-sm font-medium">{title}</div>}
      <iframe
        srcDoc={data.html}
        style={{ width: "100%", height, border: "none" }}
        title={title ?? "Bokeh Chart"}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}
