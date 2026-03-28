import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { plotlyApi } from "@/api/plotly.api"
import { PlotlyChart } from "@/components/charts/PlotlyChart"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PlotlyPage() {
  const [ticker, setTicker] = useState("AAPL")

  const { data: tickers } = useQuery({ queryKey: ["plotly", "tickers"], queryFn: plotlyApi.tickers })
  const candlestickQ = useQuery({ queryKey: ["plotly", "candlestick", ticker], queryFn: () => plotlyApi.candlestick({ ticker }) })
  const treemapQ = useQuery({ queryKey: ["plotly", "treemap"], queryFn: plotlyApi.treemap })
  const scatter3dQ = useQuery({ queryKey: ["plotly", "scatter-3d"], queryFn: () => plotlyApi.scatter3d({ sample: true }) })
  const animatedBarQ = useQuery({ queryKey: ["plotly", "animated-bar"], queryFn: plotlyApi.animatedBar })
  const previewQ = useQuery({ queryKey: ["plotly", "preview"], queryFn: plotlyApi.preview })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plotly"
        description="Stock market portfolio analysis — fully interactive charts with zoom, pan, hover & animation"
        badge="Interactive"
      />

      {/* Ticker filter */}
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
        <Label>Ticker</Label>
        <Select value={ticker} onValueChange={setTicker}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(tickers?.tickers ?? ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]).map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PlotlyChart data={candlestickQ.data as never} isLoading={candlestickQ.isLoading} error={candlestickQ.error} title={`${ticker} — OHLC Candlestick`} height={450} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlotlyChart data={treemapQ.data as never} isLoading={treemapQ.isLoading} error={treemapQ.error} title="Portfolio Treemap by Volume" height={400} />
        <PlotlyChart data={scatter3dQ.data as never} isLoading={scatter3dQ.isLoading} error={scatter3dQ.error} title="3D Scatter: Open / Close / Volume" height={400} />
      </div>

      <PlotlyChart data={animatedBarQ.data as never} isLoading={animatedBarQ.isLoading} error={animatedBarQ.error} title="Animated Bar Race — Monthly Close Price" height={450} />

      <div>
        <h3 className="text-sm font-semibold mb-2">Stock Data Preview</h3>
        <DataTable data={previewQ.data ?? []} />
      </div>
    </div>
  )
}
