import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { pandasApi } from "@/api/pandas.api"
import { ImageChart } from "@/components/charts/ImageChart"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PandasPage() {
  const [category, setCategory] = useState("")

  const { data: cats } = useQuery({ queryKey: ["pandas", "categories"], queryFn: pandasApi.categories })
  const areaQ = useQuery({ queryKey: ["pandas", "area", category], queryFn: () => pandasApi.areaChart({ category: category || undefined }) })
  const histQ = useQuery({ queryKey: ["pandas", "histogram"], queryFn: () => pandasApi.histogram({}) })
  const smQ = useQuery({ queryKey: ["pandas", "scatter-matrix"], queryFn: () => pandasApi.scatterMatrix({ sample: true }) })
  const previewQ = useQuery({ queryKey: ["pandas", "preview"], queryFn: pandasApi.preview })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pandas Plotting"
        description="E-commerce order analytics — instant insights from CSV with minimal code using pandas built-in plotting"
        badge="Fast & Simple"
      />

      <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
        <Label>Category</Label>
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {cats?.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <ImageChart data={areaQ.data} isLoading={areaQ.isLoading} error={areaQ.error} title="Cumulative Revenue by Category (Area Chart)" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImageChart data={histQ.data} isLoading={histQ.isLoading} error={histQ.error} title="Order Value Distribution (Histogram)" />
        <ImageChart data={smQ.data} isLoading={smQ.isLoading} error={smQ.error} title="Scatter Matrix (500-row sample)" height={500} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">E-Commerce Orders Preview</h3>
        <DataTable data={previewQ.data ?? []} />
      </div>
    </div>
  )
}
