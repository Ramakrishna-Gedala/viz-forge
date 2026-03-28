import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  BarChart2, BarChart3, BrainCircuit, Database,
  Flame, LineChart, Radar, Sigma, Wind,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import client from "@/api/client"

const TOOLS = [
  {
    name: "Matplotlib",
    path: "/tools/matplotlib",
    icon: LineChart,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950",
    desc: "Sales performance — line, bar & multi-panel charts",
    dataset: "sales_data.csv • 32,880 rows",
  },
  {
    name: "Seaborn",
    path: "/tools/seaborn",
    icon: BarChart3,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950",
    desc: "HR analytics — heatmaps, boxplots, pairplots, violins",
    dataset: "employee_data.csv • 1,000 rows",
  },
  {
    name: "Plotly",
    path: "/tools/plotly",
    icon: Radar,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950",
    desc: "Stock market — interactive candlestick & treemap charts",
    dataset: "stock_prices.csv • 2,500 rows",
  },
  {
    name: "Pandas Plotting",
    path: "/tools/pandas",
    icon: BarChart2,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950",
    desc: "E-commerce — area charts, histograms, scatter matrix",
    dataset: "ecommerce_orders.csv • 10,000 rows",
  },
  {
    name: "Bokeh",
    path: "/tools/bokeh",
    icon: Flame,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950",
    desc: "IoT sensors — live streaming dashboard with linked brushing",
    dataset: "sensor_data.csv • 50,000 rows",
  },
  {
    name: "Altair",
    path: "/tools/altair",
    icon: Wind,
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-950",
    desc: "Weather patterns — layered, faceted & interactive brush",
    dataset: "weather_data.csv • 5,480 rows",
  },
  {
    name: "PySpark",
    path: "/tools/spark",
    icon: Database,
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-950",
    desc: "Big data — aggregations, window functions & SQL on 150k rows",
    dataset: "transactions.csv • 150,000 rows",
  },
  {
    name: "NumPy",
    path: "/tools/numpy",
    icon: Sigma,
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950",
    desc: "Financial analysis — statistics, moving average, FFT",
    dataset: "stock_prices.csv + sensor_data.csv",
  },
]

export default function HomePage() {
  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: () => client.get<Record<string, unknown>>("/health").then((r) => r.data),
  })

  const totalRows = health
    ? Object.values((health.datasets ?? {}) as Record<string, number>).reduce((a, b) => a + b, 0)
    : null

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-center gap-3 mb-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Data Processing Learning Platform</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          End-to-end exploration of 8 Python data tools through real-world scenarios.
          Each section uses a dedicated CSV dataset and demonstrates the library in its intended role.
        </p>
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <span className="font-bold text-2xl">8</span>
            <span className="text-muted-foreground ml-1">Tools</span>
          </div>
          <div>
            <span className="font-bold text-2xl">30+</span>
            <span className="text-muted-foreground ml-1">API Endpoints</span>
          </div>
          {totalRows && (
            <div>
              <span className="font-bold text-2xl">{(totalRows / 1000).toFixed(0)}K+</span>
              <span className="text-muted-foreground ml-1">CSV Rows</span>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline diagram */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Data Pipeline</h2>
        <div className="flex items-center gap-2 flex-wrap text-sm border rounded-lg p-4 bg-muted/30">
          {["CSV Files", "→", "Pandas Load", "→", "FastAPI Router", "→", "Library Computation", "→", "JSON / PNG / HTML", "→", "React Frontend"].map((step, i) => (
            <span key={i} className={step === "→" ? "text-muted-foreground" : "font-medium px-2 py-1 bg-background rounded border"}>
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Tool grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Explore Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <Link key={tool.path} to={tool.path} className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg ${tool.bg} flex items-center justify-center mb-2`}>
                    <tool.icon className={`h-5 w-5 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors">
                    {tool.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{tool.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground font-mono">{tool.dataset}</p>
                  <p className="text-xs text-primary mt-2 font-medium">Explore →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
