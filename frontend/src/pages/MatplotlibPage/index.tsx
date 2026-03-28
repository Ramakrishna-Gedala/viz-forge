import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { matplotlibApi } from "@/api/matplotlib.api"
import { ImageChart } from "@/components/charts/ImageChart"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function MatplotlibPage() {
  const [region, setRegion] = useState<string>("")
  const [sample, setSample] = useState(false)

  const { data: regions } = useQuery({ queryKey: ["matplotlib", "regions"], queryFn: matplotlibApi.regions })
  const lineQ = useQuery({ queryKey: ["matplotlib", "line-chart", region, sample], queryFn: () => matplotlibApi.lineChart({ region: region || undefined, sample }) })
  const barQ = useQuery({ queryKey: ["matplotlib", "bar-chart", sample], queryFn: () => matplotlibApi.barChart({ sample }) })
  const subQ = useQuery({ queryKey: ["matplotlib", "subplots", sample], queryFn: () => matplotlibApi.subplots({ sample }) })
  const previewQ = useQuery({ queryKey: ["matplotlib", "preview"], queryFn: matplotlibApi.preview })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matplotlib"
        description="Retail chain sales performance — server-side rendered static charts returned as base64 PNG images"
        badge="Foundation"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2">
          <Label>Region</Label>
          <Select value={region || "all"} onValueChange={(v) => setRegion(v === "all" ? "" : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions?.regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label>Mode</Label>
          <Badge
            variant={sample ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSample((s) => !s)}
          >
            {sample ? "Sample (1k rows)" : "Full dataset"}
          </Badge>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImageChart data={lineQ.data} isLoading={lineQ.isLoading} error={lineQ.error} title="Monthly Revenue Trend" />
        <ImageChart data={barQ.data} isLoading={barQ.isLoading} error={barQ.error} title="Revenue by Region" />
      </div>
      <ImageChart data={subQ.data} isLoading={subQ.isLoading} error={subQ.error} title="Multi-Panel Dashboard" />

      {/* Preview table */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Raw Data Preview</h3>
        <DataTable data={previewQ.data ?? []} />
      </div>
    </div>
  )
}
