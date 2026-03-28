# Architecture Deep-Dive

This document explains the key design decisions in the platform — why things are built the way they are.

---

## System Design Principles

1. **No database** — All data lives in CSV files loaded into memory at startup. This removes the operational complexity of a database for a learning/demo platform and makes the project fully self-contained.

2. **One router per tool** — Each Python library has its own FastAPI router file. This mirrors how a real microservice might be organized and makes it easy to extend or replace a single tool.

3. **Singleton DataStore** — CSVs are loaded once at startup into a `DataStore` object. Handlers receive it via FastAPI's dependency injection (`Depends(get_datastore)`). This is thread-safe for reads (no mutation after load).

4. **Server-side rendering for static charts** — Matplotlib, Seaborn, and Pandas Plotting render PNGs on the server and return base64. The frontend just needs an `<img>` tag — no JS charting library required.

5. **Client-side rendering for interactive charts** — Plotly (Plotly.js), Altair (vega-embed), and Bokeh (full HTML) do their rendering in the browser. The server only computes the data structure; the JS library handles interactivity.

---

## Backend Architecture

### FastAPI Application Structure

```python
# main.py — critical import order
import matplotlib
matplotlib.use("Agg")    # ← MUST be before any pyplot import globally

from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: runs before first request
    ds._store = load_all_csvs()      # pandas DataFrames
    spark_utils._spark = init_spark() # SparkSession
    yield
    # Shutdown: runs on SIGTERM / CTRL+C
    if spark_utils._spark:
        spark_utils._spark.stop()

app = FastAPI(lifespan=lifespan)
```

The `lifespan` context manager replaces the deprecated `@app.on_event("startup")` pattern and guarantees proper cleanup on shutdown.

### DataStore Singleton

```python
# utils/datastore.py
from dataclasses import dataclass
import pandas as pd

@dataclass
class DataStore:
    sales: pd.DataFrame
    employees: pd.DataFrame
    stocks: pd.DataFrame
    ecommerce: pd.DataFrame
    sensors: pd.DataFrame
    weather: pd.DataFrame
    transactions: pd.DataFrame

_store: DataStore | None = None   # module-level singleton

def get_datastore() -> DataStore:
    return _store                  # FastAPI Depends() calls this per request
```

**Why a dataclass instead of a dict?**
Type-safe attribute access (`store.sales` vs `store["sales"]`) and IDE autocomplete. The dataclass is purely structural — no methods, just a typed container.

**Why a module-level variable instead of `app.state`?**
It allows `spark_router.py` to access the DataStore without importing `app`, avoiding circular imports. Both `ds._store` and `spark_utils._spark` are module globals set at startup.

### Image Generation Pipeline

```
matplotlib.use("Agg")  ← non-interactive backend (no GUI dependency)
                           must be set BEFORE importing pyplot
    │
    ▼
matplotlib.pyplot.subplots() → Figure object
    │
    ▼
fig.savefig(BytesIO(), format="png", dpi=150, bbox_inches="tight")
    │
    ▼
base64.b64encode(bytes) → ASCII string
    │
    ▼
{"image": "<base64 string>"}  → JSON response
    │
    ▼
Browser: <img src="data:image/png;base64,...">
```

**Why `bbox_inches="tight"`?**
Automatically trims whitespace around the figure. Without it, long axis labels get clipped.

**Why `dpi=150`?**
Higher than the default 72 dpi. Retina displays (2x pixel ratio) show 72dpi images as blurry. 150dpi is sharp on most screens without producing unnecessarily large files.

**Why `plt.close(fig)` after every render?**
Matplotlib registers all figures globally. Without `close()`, each request leaks a Figure object. Over hundreds of requests, this causes memory growth.

### Shared `apply_sample()` Pattern

Every endpoint accepts `?sample=true` via the same utility:

```python
def apply_sample(df: pd.DataFrame, sample: bool, n: int = 1000) -> pd.DataFrame:
    if sample and len(df) > n:
        return df.sample(n, random_state=42)
    return df
```

The `random_state=42` seed ensures the same 1,000 rows are sampled every time for the same dataset, making the result cacheable (TanStack Query's cache key includes the `sample` param).

### Plotly JSON Serialization Gotcha

```python
# WRONG: fig.to_dict() contains numpy types
return {"chart_json": fig.to_dict()}
# FastAPI's json.dumps() can't serialize numpy.float64 → 500 error

# CORRECT: round-trip through JSON to convert numpy → Python primitives
return {"chart_json": json.loads(fig.to_json())}
# fig.to_json() uses plotly's own serializer (handles numpy)
# json.loads() converts back to a pure Python dict
# FastAPI can now serialize this normally
```

### Bokeh Global State

Bokeh maintains global output state (figure IDs, resources). Multiple requests hitting the Bokeh router simultaneously can corrupt each other's HTML if this state isn't reset:

```python
from bokeh.io import reset_output

@router.get("/dashboard")
def dashboard(...):
    reset_output()    # ← MUST be first line of every Bokeh handler
    ...
```

### PySpark on Windows

The Windows filesystem requires `winutils.exe` (a small Hadoop binary) for Spark to create temp directories and set file permissions. Without it, Spark still works using built-in Java classes, but logs a warning.

```python
# utils/spark_utils.py
WINUTILS_DIR = Path(__file__).parent.parent / "winutils" / "hadoop-3.3.5"

os.environ["HADOOP_HOME"] = str(WINUTILS_DIR)
os.environ["PATH"] = str(WINUTILS_DIR / "bin") + os.pathsep + os.environ["PATH"]
```

SparkSession config choices:
```python
.master("local[2]")                           # 2 cores (not all — avoids dev machine slowdown)
.config("spark.sql.shuffle.partitions", "4")  # default 200 is wasteful for <1M rows
.config("spark.driver.memory", "1g")          # limit memory footprint
.config("spark.ui.enabled", "false")          # disable Spark web UI on port 4040
.config("spark.sql.execution.arrow.pyspark.enabled", "true")  # fast toPandas()
```

---

## Frontend Architecture

### Component Hierarchy

```
App
└── Providers
    ├── QueryClientProvider   (TanStack Query)
    └── ThemeProvider         (custom context, localStorage)
        └── RouterProvider    (React Router v6)
            └── MainLayout
                ├── SidebarProvider   (shadcn/ui sidebar state)
                │   └── AppSidebar    (left navigation)
                └── SidebarInset
                    ├── SiteHeader    (sticky top bar)
                    └── <Outlet>      (page content)
                        └── [Page]    (lazy loaded)
                            ├── PageHeader
                            ├── FilterBar
                            ├── [Chart Components]
                            └── DataTable
```

### Chart Component Isolation

Each chart type is encapsulated in its own component:

```typescript
// All chart components have the same interface:
interface ChartProps {
  data?: ApiResponse       // undefined while loading
  isLoading: boolean
  error?: Error | null
  height?: number
  title?: string
}
```

This allows the page components to be written uniformly:
```tsx
<ImageChart  data={lineQ.data}  isLoading={lineQ.isLoading}  error={lineQ.error} />
<PlotlyChart data={candQ.data}  isLoading={candQ.isLoading}  error={candQ.error} />
<VegaChart   data={layerQ.data} isLoading={layerQ.isLoading} error={layerQ.error} />
```

### Plotly Dynamic Import

```typescript
// PlotlyChart.tsx
useEffect(() => {
    import("plotly.js-dist-min").then((PlotlyModule) => {
        const Plotly = PlotlyModule.default ?? PlotlyModule
        Plotly.react(ref.current, data.chart_json.data, layout, { responsive: true })
    })
}, [data])
```

`plotly.js-dist-min` is 4.6MB. A static import would include it in the main bundle, slowing the initial page load. Dynamic `import()` defers the download until the Plotly page is first visited.

### Vega-Embed Cleanup

React 18 Strict Mode runs effects twice in development (to detect side effects). `vega-embed` creates a canvas imperatively. Without cleanup, two vega instances attach to the same div:

```typescript
useEffect(() => {
    let vegaView: { finalize: () => void } | undefined

    import("vega-embed").then(({ default: vegaEmbed }) => {
        vegaEmbed(ref.current!, spec).then(({ view }) => {
            vegaView = view
        })
    })

    // Cleanup: finalize removes the vega instance from the DOM
    return () => {
        vegaView?.finalize()
    }
}, [spec])
```

### TanStack Query Configuration

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,  // data is fresh for 5 minutes
            retry: 1,                   // retry once on failure
        },
    },
})
```

**Why staleTime: 5 minutes?**
Chart data changes only when backend data changes (it doesn't). A 5-minute cache means navigating between tool pages doesn't re-fetch data that was just loaded. Users can switch tabs and back without waiting.

**Query key design:**
```typescript
// Include ALL parameters that affect the response in the key
useQuery({
    queryKey: ["matplotlib", "line-chart", region, sample],
    queryFn: () => matplotlibApi.lineChart({ region, sample })
})
```
Changing `region` or `sample` creates a new cache entry and triggers a fetch.

### Theme Implementation

Rather than using a third-party library (next-themes is designed for Next.js), a custom context handles theming:

```typescript
// Toggle adds/removes "dark" class on document.documentElement
document.documentElement.classList.toggle("dark")
```

Tailwind CSS v4 uses `@custom-variant dark (&:is(.dark *))` to activate dark mode CSS variables. The CSS variables (`--background`, `--foreground`, etc.) switch automatically when the class changes.

---

## Data Generation Design

### Reproducibility

All CSV generation uses a fixed seed:
```python
rng = np.random.default_rng(42)   # NumPy Generator (preferred over np.random.seed)
random.seed(42)                    # Python stdlib random
```

This ensures the same data is generated every time, making charts and stats predictable for learning purposes.

### Realistic Patterns

**Sales data** has a sinusoidal seasonal pattern:
```python
seasonal = 1 + 0.3 * math.sin((date.month - 3) * math.pi / 6)
units = max(1, int(rng.normal(50 * seasonal, 15)))
```
December/November peaks, January trough — mimics real retail seasonality.

**Stock prices** use Geometric Brownian Motion (the standard financial model):
```python
ret = mu + sigma * rng.standard_normal()
close = price * math.exp(ret)       # log-normal returns
```
This produces realistic-looking price series with upward drift and volatility.

**Sensor data** includes fault injection:
```python
spike_idx = rng.choice(n, size=int(n * 0.002), replace=False)
temp_base[spike_idx] += rng.uniform(20, 40, len(spike_idx))
```
~0.2% of readings are critical spikes, making the anomaly detection use case meaningful.

### Performance

Large files use NumPy vectorized generation:
```python
# 150,000 rows generated in ~0.5 seconds
n = 150_000
amounts = rng.uniform(1.0, 500.0, n).round(2)      # generates array at once
store_ids = rng.integers(1, 51, n)                  # same
timestamps = pd.to_datetime(base_ts + rng.uniform(0, span_ts, n), unit="s")
```

Row-by-row loops would take 10+ seconds for 150k rows. Vectorized operations take milliseconds.

---

## Decisions Not Made (and Why)

**No PostgreSQL** — A database would require installation, setup, migrations, and a running service. For a learning/demo platform, CSV files are simpler and the project remains fully self-contained with `git clone && make setup`.

**No Redux/Zustand** — The app has no shared mutable client state. Every page manages its own filter state locally. Server state is managed by TanStack Query. A global store would add boilerplate with no benefit.

**No Docker** — A Dockerfile would simplify deployment but adds complexity for local development. The `make setup` flow is simpler for the target audience (developers learning data tools, not DevOps engineers).

**No real-time WebSocket** — SSE (Server-Sent Events) is sufficient for the one-directional streaming use case. WebSocket adds complexity (bidirectional protocol, connection management) without benefit.

**No authentication** — This is a local development/learning tool. Adding auth (OAuth, JWT) would obscure the data processing concepts that are the purpose of the platform.
