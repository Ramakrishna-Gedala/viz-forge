import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { numpyApi } from "@/api/numpy.api"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { ChartSkeleton } from "@/components/shared/ChartSkeleton"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar,
} from "recharts"

const TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
const MACHINES = ["M001", "M002", "M003", "M004", "M005"]

export default function NumpyPage() {
  const [ticker, setTicker] = useState("AAPL")
  const [window, setWindow] = useState([30])
  const [machine, setMachine] = useState("M001")

  const statsQ = useQuery({ queryKey: ["numpy", "stats"], queryFn: () => numpyApi.statistics({}) })
  const maQ = useQuery({ queryKey: ["numpy", "ma", ticker, window[0]], queryFn: () => numpyApi.movingAverage({ ticker, window: window[0] }) })
  const corrQ = useQuery({ queryKey: ["numpy", "corr"], queryFn: numpyApi.correlationMatrix })
  const fftQ = useQuery({ queryKey: ["numpy", "fft", machine], queryFn: () => numpyApi.fft({ machine_id: machine }) })

  // Format stats for DataTable
  const statsRows = statsQ.data
    ? Object.entries(statsQ.data.statistics).map(([col, s]) => ({ column: col, ...s }))
    : []

  // Correlation matrix rows
  const corrRows = corrQ.data
    ? corrQ.data.matrix.map((row, i) => ({ metric: corrQ.data!.columns[i], ...row }))
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="NumPy"
        description="Financial risk analysis and signal processing — statistics, moving averages, correlation and FFT"
        badge="Numerical"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-6 p-4 rounded-lg border bg-muted/30 items-center">
        <div className="flex items-center gap-2">
          <Label>Ticker</Label>
          <Select value={ticker} onValueChange={setTicker}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{TICKERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Label>MA Window: {window[0]}d</Label>
          <Slider className="w-40" min={7} max={90} step={1} value={window} onValueChange={setWindow} />
        </div>
        <div className="flex items-center gap-2">
          <Label>Machine</Label>
          <Select value={machine} onValueChange={setMachine}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{MACHINES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Moving average chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{ticker} — Close Price + {window[0]}-Day Moving Average</CardTitle>
        </CardHeader>
        <CardContent>
          {maQ.isLoading ? <ChartSkeleton height={280} /> : maQ.error ? <ErrorAlert message={(maQ.error as Error).message} /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={maQ.data?.raw ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={30} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="close" stroke="#94a3b8" strokeWidth={1} dot={false} name="Close" />
                <Line
                  type="monotone"
                  data={maQ.data?.moving_average}
                  dataKey="ma"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name={`${window[0]}-Day MA`}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Descriptive Statistics</h3>
        <DataTable data={statsRows} />
      </div>

      {/* Correlation matrix */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Sensor Correlation Matrix (NumPy)</h3>
        <DataTable data={corrRows} />
      </div>

      {/* FFT chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{machine} — FFT Frequency Spectrum (Temperature Signal)</CardTitle>
        </CardHeader>
        <CardContent>
          {fftQ.isLoading ? <ChartSkeleton height={250} /> : fftQ.error ? <ErrorAlert message={(fftQ.error as Error).message} /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={(fftQ.data?.frequencies ?? []).map((f, i) => ({ freq: f.toFixed(4), amp: fftQ.data!.amplitudes[i] }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="freq" tick={{ fontSize: 9 }} label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -5 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [Number(v).toFixed(2), "Amplitude"]} />
                <Bar dataKey="amp" fill="#ec4899" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
