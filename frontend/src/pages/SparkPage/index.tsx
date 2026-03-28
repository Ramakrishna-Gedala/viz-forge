import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { sparkApi } from "@/api/spark.api"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { ChartSkeleton } from "@/components/shared/ChartSkeleton"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Clock, Rows3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function SparkPage() {
  const [sample, setSample] = useState(false)

  const aggQ = useQuery({ queryKey: ["spark", "agg", sample], queryFn: () => sparkApi.aggregations({ sample }) })
  const windowQ = useQuery({ queryKey: ["spark", "window", sample], queryFn: () => sparkApi.windowFunctions({ sample }) })
  const topQ = useQuery({ queryKey: ["spark", "top"], queryFn: () => sparkApi.topProducts({ limit: 10 }) })
  const schemaQ = useQuery({ queryKey: ["spark", "schema"], queryFn: sparkApi.schema })

  return (
    <div className="space-y-6">
      <PageHeader
        title="PySpark"
        description="Big Data mode — 150,000 retail transactions processed with distributed Spark SQL and window functions"
        badge="Big Data"
      />

      {/* Status bar */}
      <div className="flex flex-wrap gap-3 p-4 rounded-lg border bg-muted/30 items-center">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">
            {schemaQ.data ? `${schemaQ.data.row_count.toLocaleString()} rows` : "Loading schema..."}
          </span>
        </div>
        {aggQ.data && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Aggregations: {aggQ.data.execution_time_s}s</span>
          </div>
        )}
        <Badge variant={sample ? "default" : "outline"} className="cursor-pointer ml-auto" onClick={() => setSample((s) => !s)}>
          {sample ? "Sample (1k rows)" : "Full 150k rows"}
        </Badge>
      </div>

      {/* Aggregations bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Total Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {aggQ.isLoading ? <ChartSkeleton height={250} /> : aggQ.error ? <ErrorAlert message={(aggQ.error as Error).message} /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={aggQ.data?.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="total_revenue" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tables */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Rows3 className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Aggregations by Category</h3>
          {aggQ.data && <span className="text-xs text-muted-foreground">({aggQ.data.execution_time_s}s)</span>}
        </div>
        <DataTable data={aggQ.data?.data ?? []} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Window Functions — Running Totals + Rank</h3>
        <DataTable data={windowQ.data?.data ?? []} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Top 10 Products by Revenue</h3>
        <DataTable data={topQ.data?.data ?? []} />
      </div>

      {/* Schema */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Inferred Schema</h3>
        <div className="rounded-lg border overflow-auto font-mono text-xs p-4 bg-muted/30">
          {schemaQ.data?.schema.map((f) => (
            <div key={f.name} className="flex gap-4 py-0.5">
              <span className="text-primary w-36">{f.name}</span>
              <span className="text-muted-foreground">{f.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
