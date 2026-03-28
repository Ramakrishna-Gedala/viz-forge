import { useEffect, useRef } from "react"
import { ChartSkeleton } from "@/components/shared/ChartSkeleton"
import { ErrorAlert } from "@/components/shared/ErrorAlert"

interface PlotlyChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: { chart_json: Record<string, any> }
  isLoading: boolean
  error?: Error | null
  height?: number
  title?: string
}

export function PlotlyChart({ data, isLoading, error, height = 500, title }: PlotlyChartProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data?.chart_json || !ref.current) return
    const current = ref.current

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("plotly.js-dist-min").then((PlotlyModule: any) => {
      const Plotly = PlotlyModule.default ?? PlotlyModule
      if (!current) return
      const layout = {
        ...data.chart_json.layout,
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { size: 12 },
        margin: { t: 50, r: 30, b: 50, l: 60 },
      }
      Plotly.react(current, data.chart_json.data, layout, { responsive: true })
    })

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      import("plotly.js-dist-min").then((PlotlyModule: any) => {
        const Plotly = PlotlyModule.default ?? PlotlyModule
        if (current) Plotly.purge(current)
      })
    }
  }, [data])

  if (isLoading) return <ChartSkeleton height={height} />
  if (error) return <ErrorAlert message={error.message} />

  return (
    <div className="w-full rounded-lg border overflow-hidden bg-card">
      {title && <div className="px-4 py-2 border-b text-sm font-medium">{title}</div>}
      <div ref={ref} style={{ width: "100%", height }} />
    </div>
  )
}
