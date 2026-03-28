import { useQuery } from "@tanstack/react-query"
import { seabornApi } from "@/api/seaborn.api"
import { ImageChart } from "@/components/charts/ImageChart"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SeabornPage() {
  const statsQ = useQuery({ queryKey: ["seaborn", "stats"], queryFn: seabornApi.stats })
  const heatmapQ = useQuery({ queryKey: ["seaborn", "heatmap"], queryFn: seabornApi.heatmap })
  const boxplotQ = useQuery({ queryKey: ["seaborn", "boxplot"], queryFn: seabornApi.boxplot })
  const pairplotQ = useQuery({ queryKey: ["seaborn", "pairplot"], queryFn: seabornApi.pairplot })
  const violinQ = useQuery({ queryKey: ["seaborn", "violin"], queryFn: seabornApi.violin })
  const previewQ = useQuery({ queryKey: ["seaborn", "preview"], queryFn: seabornApi.preview })

  const s = statsQ.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seaborn"
        description="HR analytics — employee attrition and performance analysis using statistical visualizations"
        badge="Statistical"
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Headcount", value: s?.headcount?.toLocaleString() ?? "—" },
          { label: "Avg Salary", value: s ? `$${s.avg_salary.toLocaleString()}` : "—" },
          { label: "Attrition Rate", value: s ? `${s.attrition_rate}%` : "—" },
          { label: "Avg Performance", value: s?.avg_performance?.toFixed(2) ?? "—" },
          { label: "Departments", value: s?.departments ?? "—" },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImageChart data={heatmapQ.data} isLoading={heatmapQ.isLoading} error={heatmapQ.error} title="Correlation Heatmap" />
        <ImageChart data={boxplotQ.data} isLoading={boxplotQ.isLoading} error={boxplotQ.error} title="Salary by Department" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImageChart data={violinQ.data} isLoading={violinQ.isLoading} error={violinQ.error} title="Performance by Attrition" height={350} />
        <ImageChart data={pairplotQ.data} isLoading={pairplotQ.isLoading} error={pairplotQ.error} title="Pairplot (500-row sample)" height={500} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Employee Data Preview</h3>
        <DataTable data={previewQ.data ?? []} />
      </div>
    </div>
  )
}
