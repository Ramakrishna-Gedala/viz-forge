import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { altairApi } from "@/api/altair.api"
import { VegaChart } from "@/components/charts/VegaChart"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AltairPage() {
  const [city, setCity] = useState("London")

  const { data: cities } = useQuery({ queryKey: ["altair", "cities"], queryFn: altairApi.cities })
  const layeredQ = useQuery({ queryKey: ["altair", "layered", city], queryFn: () => altairApi.layered({ city }) })
  const facetedQ = useQuery({ queryKey: ["altair", "faceted"], queryFn: altairApi.faceted })
  const brushQ = useQuery({ queryKey: ["altair", "brush"], queryFn: altairApi.interactiveBrush })
  const previewQ = useQuery({ queryKey: ["altair", "preview"], queryFn: altairApi.preview })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Altair"
        description="Weather pattern analysis — clean declarative charts using Vega-Lite grammar, rendered via vega-embed"
        badge="Declarative"
      />

      <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
        <Label>City</Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(cities?.cities ?? ["London", "Mumbai", "New York", "Tokyo", "Sydney"]).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <VegaChart data={layeredQ.data} isLoading={layeredQ.isLoading} error={layeredQ.error} title={`${city} — Layered Temperature Range`} height={350} />
      <VegaChart data={facetedQ.data} isLoading={facetedQ.isLoading} error={facetedQ.error} title="Faceted Small Multiples — Max Temp by City" height={400} />
      <VegaChart data={brushQ.data} isLoading={brushQ.isLoading} error={brushQ.error} title="Interactive Brush — Select Date Range" height={480} />

      <div>
        <h3 className="text-sm font-semibold mb-2">Weather Data Preview</h3>
        <DataTable data={previewQ.data ?? []} />
      </div>
    </div>
  )
}
