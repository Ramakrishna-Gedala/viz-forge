import { useEffect, useRef } from "react"
import { ChartSkeleton } from "@/components/shared/ChartSkeleton"
import { ErrorAlert } from "@/components/shared/ErrorAlert"

interface VegaChartProps {
  data?: { chart_json: Record<string, unknown> }
  isLoading: boolean
  error?: Error | null
  height?: number
  title?: string
}

export function VegaChart({ data, isLoading, error, height = 400, title }: VegaChartProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data?.chart_json || !ref.current) return
    let vegaView: { finalize: () => void } | undefined

    import("vega-embed").then(({ default: vegaEmbed }) => {
      if (!ref.current) return
      vegaEmbed(ref.current, data.chart_json as never, {
        actions: false,
        renderer: "svg",
      }).then(({ view }) => {
        vegaView = view
      })
    })

    return () => {
      vegaView?.finalize()
    }
  }, [data])

  if (isLoading) return <ChartSkeleton height={height} />
  if (error) return <ErrorAlert message={error.message} />

  return (
    <div className="w-full rounded-lg border overflow-hidden bg-card">
      {title && <div className="px-4 py-2 border-b text-sm font-medium">{title}</div>}
      <div ref={ref} className="w-full overflow-auto" style={{ minHeight: height }} />
    </div>
  )
}
