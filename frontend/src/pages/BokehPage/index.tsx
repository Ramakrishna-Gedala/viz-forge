import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { bokehApi } from "@/api/bokeh.api"
import { BokehEmbed } from "@/components/charts/BokehEmbed"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BokehPage() {
  const [machineId, setMachineId] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [streamStats, setStreamStats] = useState({ chunks: 0, rows: 0 })
  const eventSourceRef = useRef<EventSource | null>(null)

  const { data: machines } = useQuery({ queryKey: ["bokeh", "machines"], queryFn: bokehApi.machines })
  const dashQ = useQuery({ queryKey: ["bokeh", "dashboard", machineId], queryFn: () => bokehApi.dashboard({ machine_id: machineId || undefined }) })
  const linkedQ = useQuery({ queryKey: ["bokeh", "linked"], queryFn: bokehApi.linkedBrushing })
  const previewQ = useQuery({ queryKey: ["bokeh", "preview"], queryFn: bokehApi.preview })

  function startStreaming() {
    if (eventSourceRef.current) return
    setStreaming(true)
    setStreamStats({ chunks: 0, rows: 0 })
    const es = new EventSource("http://localhost:8000/bokeh/streaming")
    eventSourceRef.current = es

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.done) {
        stopStreaming()
        return
      }
      setStreamStats((s) => ({ chunks: s.chunks + 1, rows: s.rows + (Array.isArray(data) ? data.length : 0) }))
    }
    es.onerror = () => stopStreaming()
  }

  function stopStreaming() {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    setStreaming(false)
  }

  useEffect(() => () => stopStreaming(), [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bokeh"
        description="IoT factory sensor monitoring — embedded Bokeh dashboards with SSE streaming and linked brushing"
        badge="Streaming"
      />

      <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-muted/30">
        <Label>Machine</Label>
        <Select value={machineId || "all"} onValueChange={(v) => setMachineId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All machines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All machines</SelectItem>
            {machines?.machines.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <BokehEmbed data={dashQ.data} isLoading={dashQ.isLoading} error={dashQ.error} title="Sensor Dashboard" height={620} />

      {/* Streaming widget */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Real-Time Streaming (SSE)</CardTitle>
            <div className="flex gap-2 items-center">
              {streaming && <Badge variant="default" className="animate-pulse">Live</Badge>}
              <Button size="sm" onClick={streaming ? stopStreaming : startStreaming} variant={streaming ? "destructive" : "default"}>
                {streaming ? "Stop" : "Start Streaming"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Chunks received:</span> <strong>{streamStats.chunks}</strong></div>
            <div><span className="text-muted-foreground">Rows processed:</span> <strong>{streamStats.rows.toLocaleString()}</strong></div>
          </div>
        </CardContent>
      </Card>

      <BokehEmbed data={linkedQ.data} isLoading={linkedQ.isLoading} error={linkedQ.error} title="Linked Brushing — Select in one chart, other updates" height={380} />

      <div>
        <h3 className="text-sm font-semibold mb-2">Sensor Data Preview</h3>
        <DataTable data={previewQ.data ?? []} />
      </div>
    </div>
  )
}
