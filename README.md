# Data Processing Learning Platform

An end-to-end full-stack application that demonstrates **8 Python data tools** through real-world scenarios. Each tool gets its own dedicated section with a real CSV dataset, a FastAPI router, and a React page with interactive filters and visualizations.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Python Tools Covered](#python-tools-covered)
- [Data Pipeline](#data-pipeline)
- [API Reference](#api-reference)
- [Frontend Architecture](#frontend-architecture)
- [Make Commands](#make-commands)
- [Environment Variables](#environment-variables)
- [Windows / PySpark Notes](#windows--pyspark-notes)

---

## Quick Start

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.11+ | Required for all data libraries |
| Node.js | 18+ | Required for frontend |
| Java (JDK) | 11 or 17 | Required for PySpark only |
| make | any | GNU Make (Git Bash on Windows) |

### One-Command Setup

```bash
# Clone / enter the project
cd data-processing

# Full setup: creates .venv, installs all packages, generates 7 CSV files, installs npm deps
make setup

# Start both services
make dev
```

| URL | Service |
|-----|---------|
| http://localhost:5173 | React frontend |
| http://localhost:8000/docs | FastAPI interactive docs (Swagger) |
| http://localhost:8000/health | Health check + dataset row counts |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  (Vite + React 18 + TypeScript + shadcn/ui + TanStack Query)   │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ ImageChart│  │PlotlyChart│  │ VegaChart│  │ BokehEmbed  │  │
│  │(base64PNG)│  │(Plotly.js)│  │(vega-embed)│  │  (iframe)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP / SSE (axios / EventSource)
┌──────────────────────────▼──────────────────────────────────────┐
│                     FastAPI Backend                             │
│              (Python 3.11 + uvicorn + CORS)                    │
│                                                                 │
│  Lifespan startup:                                             │
│    1. Load all 7 CSVs into DataStore (pandas)                  │
│    2. Initialize SparkSession (local[2])                       │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐               │
│  │/matplotlib│ │/seaborn │ │/plotly │ │/pandas │               │
│  └─────────┘ └─────────┘ └────────┘ └────────┘               │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐               │
│  │ /bokeh  │ │ /altair │ │/spark  │ │/numpy  │               │
│  └─────────┘ └─────────┘ └────────┘ └────────┘               │
└──────────────────────────┬──────────────────────────────────────┘
                           │  pandas.read_csv() at startup
┌──────────────────────────▼──────────────────────────────────────┐
│                      CSV Data Layer                             │
│                   backend/data/*.csv                           │
│                                                                 │
│  sales_data.csv      employee_data.csv    stock_prices.csv     │
│  ecommerce_orders.csv  sensor_data.csv   weather_data.csv      │
│  transactions.csv                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Response Formats by Tool

| Tool | Response Format | Frontend Renderer |
|------|----------------|-------------------|
| Matplotlib | `{"image": "<base64 PNG>"}` | `<img>` tag |
| Seaborn | `{"image": "<base64 PNG>"}` | `<img>` tag |
| Pandas Plotting | `{"image": "<base64 PNG>"}` | `<img>` tag |
| Plotly | `{"chart_json": {...}}` | Plotly.js `Plotly.react()` |
| Altair | `{"chart_json": {...}}` | `vega-embed` |
| Bokeh | `{"html": "..."}` | `<iframe srcDoc>` |
| Bokeh streaming | `data: [{...}]\n\n` (SSE) | `EventSource` |
| PySpark | `{"data": [...], "execution_time_s": n}` | Recharts / shadcn Table |
| NumPy | `{"...": [...]}` | Recharts |

---

## Project Structure

```
data-processing/
│
├── Makefile                        ← Root orchestration (setup, dev, lint, clean)
│
├── backend/
│   ├── Makefile                    ← Backend-specific commands
│   ├── main.py                     ← FastAPI app: lifespan, CORS, router registration
│   ├── requirements.txt
│   │
│   ├── data/                       ← Generated CSV files (7 datasets)
│   │   ├── sales_data.csv          ← 32,880 rows — retail chain sales
│   │   ├── employee_data.csv       ← 1,000 rows — HR records
│   │   ├── stock_prices.csv        ← 2,500 rows — OHLC stock data
│   │   ├── ecommerce_orders.csv    ← 10,000 rows — online orders
│   │   ├── sensor_data.csv         ← 50,000 rows — IoT sensor readings
│   │   ├── weather_data.csv        ← 5,480 rows — daily weather
│   │   └── transactions.csv        ← 150,000 rows — POS transactions
│   │
│   ├── scripts/
│   │   └── generate_data.py        ← Generates all 7 CSVs (numpy + faker, seeded)
│   │
│   ├── routers/                    ← One FastAPI router per tool
│   │   ├── matplotlib_router.py
│   │   ├── seaborn_router.py
│   │   ├── plotly_router.py
│   │   ├── pandas_router.py
│   │   ├── bokeh_router.py
│   │   ├── altair_router.py
│   │   ├── spark_router.py
│   │   └── numpy_router.py
│   │
│   ├── utils/
│   │   ├── datastore.py            ← DataStore dataclass + get_datastore() Depends
│   │   ├── image_utils.py          ← fig_to_base64(), apply_sample(), Agg backend
│   │   └── spark_utils.py          ← SparkSession init with Windows winutils setup
│   │
│   └── winutils/
│       └── hadoop-3.3.5/bin/       ← Place winutils.exe + hadoop.dll here (Windows)
│
├── frontend/
│   ├── Makefile                    ← Frontend-specific commands
│   ├── package.json
│   ├── vite.config.ts              ← @tailwindcss/vite + path alias @/
│   ├── tsconfig.app.json
│   ├── .env                        ← VITE_API_URL=http://localhost:8000
│   │
│   └── src/
│       ├── App.tsx                 ← Root: Providers + RouterProvider
│       ├── index.css               ← Tailwind v4 + shadcn CSS variables
│       │
│       ├── app/
│       │   ├── providers.tsx       ← QueryClient + ThemeProvider
│       │   └── router.tsx          ← React Router v6 routes (lazy loaded)
│       │
│       ├── layouts/
│       │   └── MainLayout.tsx      ← SidebarProvider + SiteHeader + Outlet
│       │
│       ├── components/
│       │   ├── AppSidebar.tsx      ← Left nav (collapsible on mobile)
│       │   ├── SiteHeader.tsx      ← Sticky header + sidebar toggle + theme toggle
│       │   ├── ThemeProvider.tsx   ← Light/dark theme context (localStorage)
│       │   ├── ThemeSwitcher.tsx
│       │   ├── charts/
│       │   │   ├── ImageChart.tsx  ← Renders base64 PNG with loading skeleton
│       │   │   ├── PlotlyChart.tsx ← Plotly.js wrapper (dynamic import)
│       │   │   ├── VegaChart.tsx   ← vega-embed wrapper
│       │   │   └── BokehEmbed.tsx  ← iframe for Bokeh HTML output
│       │   ├── shared/
│       │   │   ├── FilterBar.tsx
│       │   │   ├── DataTable.tsx   ← shadcn Table + client-side pagination
│       │   │   ├── PageHeader.tsx
│       │   │   ├── ChartSkeleton.tsx
│       │   │   └── ErrorAlert.tsx
│       │   └── ui/                 ← shadcn/ui primitives (generated)
│       │
│       ├── api/                    ← Typed axios wrappers (one per tool)
│       │   ├── client.ts
│       │   ├── matplotlib.api.ts
│       │   └── ...
│       │
│       └── pages/                  ← One page component per tool
│           ├── Home/
│           ├── MatplotlibPage/
│           ├── SeabornPage/
│           ├── PlotlyPage/
│           ├── PandasPage/
│           ├── BokehPage/
│           ├── AltairPage/
│           ├── SparkPage/
│           └── NumpyPage/
│
└── docs/
    ├── architecture.md             ← Deep-dive into system design decisions
    ├── python-tools.md             ← Guide to each Python library
    └── project-flow.md             ← End-to-end request/response walkthrough
```

---

## Python Tools Covered

| # | Tool | Version | Dataset | Use Case |
|---|------|---------|---------|----------|
| 1 | **Matplotlib** | 3.9 | sales_data.csv | Foundation — line, bar, multi-panel subplots |
| 2 | **Seaborn** | 0.13 | employee_data.csv | Statistical — heatmap, boxplot, pairplot, violin |
| 3 | **Plotly** | 5.24 | stock_prices.csv | Interactive — candlestick, treemap, 3D scatter, animation |
| 4 | **Pandas Plotting** | 2.2 | ecommerce_orders.csv | Simple — area, histogram, scatter matrix |
| 5 | **Bokeh** | 3.6 | sensor_data.csv | Streaming — SSE, linked brushing, embedded dashboards |
| 6 | **Altair** | 5.4 | weather_data.csv | Declarative — layered, faceted, interactive brush |
| 7 | **PySpark** | 3.5 | transactions.csv | Big data — groupBy, window functions, SQL |
| 8 | **NumPy** | 1.26 | stocks + sensors | Numerical — FFT, moving average, correlation |

---

## Data Pipeline

```
CSV File (backend/data/)
      │
      ▼  pandas.read_csv() at startup (once)
DataStore singleton (in-memory DataFrame)
      │
      ▼  FastAPI Depends(get_datastore)
Router handler (e.g. matplotlib_router.py)
      │
      ├── Filter: apply_sample(df, sample=True)  →  max 1000 rows
      ├── Transform: groupby / resample / corr / fft ...
      │
      ▼  Render
      ├── Matplotlib/Seaborn/Pandas  →  fig.savefig() → base64 PNG
      ├── Plotly                     →  json.loads(fig.to_json())
      ├── Altair                     →  chart.to_dict()
      ├── Bokeh                      →  file_html(layout, CDN)
      ├── PySpark                    →  df.toPandas().to_dict(orient="records")
      └── NumPy                      →  numpy arrays → Python lists

      ▼  HTTP JSON response
React page (TanStack Query useQuery)
      │
      ▼  Component
      ├── ImageChart  →  <img src="data:image/png;base64,...">
      ├── PlotlyChart →  Plotly.react(ref, data, layout)
      ├── VegaChart   →  vegaEmbed(ref, spec)
      ├── BokehEmbed  →  <iframe srcDoc={html}>
      └── Recharts    →  <LineChart> / <BarChart>
```

---

## API Reference

All endpoints accept `?sample=true` to limit processing to 1,000 rows for fast previews.

### Matplotlib `/matplotlib`

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/line-chart` | `{image}` | Monthly revenue trend (line) |
| GET | `/bar-chart` | `{image}` | Revenue by region (horizontal bar) |
| GET | `/subplots` | `{image}` | 4-panel dashboard |
| GET | `/regions` | `{regions[]}` | List of region values |
| GET | `/preview` | `Record[]` | First 100 sales rows |

### Seaborn `/seaborn`

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/heatmap` | `{image}` | Correlation heatmap |
| GET | `/boxplot` | `{image}` | Salary by department |
| GET | `/pairplot` | `{image}` | Multi-variable pairplot (500-row sample) |
| GET | `/violin` | `{image}` | Performance by attrition |
| GET | `/stats` | `{headcount, avg_salary, ...}` | Summary stats |
| GET | `/preview` | `Record[]` | First 100 employee rows |

### Plotly `/plotly`

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/candlestick?ticker=AAPL` | `{chart_json}` | OHLC candlestick |
| GET | `/treemap` | `{chart_json}` | Portfolio allocation |
| GET | `/scatter-3d` | `{chart_json}` | 3D scatter plot |
| GET | `/animated-bar` | `{chart_json}` | Animated bar race |
| GET | `/tickers` | `{tickers[]}` | Available tickers |
| GET | `/preview` | `Record[]` | First 100 stock rows |

### Pandas `/pandas`

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/area-chart?category=Electronics` | `{image}` | Cumulative revenue area |
| GET | `/histogram?bins=50` | `{image}` | Order value distribution |
| GET | `/scatter-matrix` | `{image}` | Scatter matrix (500-row sample) |
| GET | `/categories` | `{categories[]}` | Product categories |
| GET | `/preview` | `Record[]` | First 100 order rows |

### Bokeh `/bokeh`

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/dashboard?machine_id=M001` | `{html}` | Multi-widget Bokeh dashboard |
| GET | `/streaming` | SSE stream | Sensor data in 200-row chunks |
| GET | `/linked-brushing` | `{html}` | Two linked scatter charts |
| GET | `/machines` | `{machines[]}` | Machine IDs |
| GET | `/preview` | `Record[]` | First 100 sensor rows |

### Altair `/altair`

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/layered?city=London` | `{chart_json}` | Temp range band + mean line |
| GET | `/faceted` | `{chart_json}` | Small multiples per city |
| GET | `/interactive-brush` | `{chart_json}` | Brush overview + detail |
| GET | `/cities` | `{cities[]}` | City names |
| GET | `/preview` | `Record[]` | First 100 weather rows |

### PySpark `/spark`

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/aggregations` | `{data[], execution_time_s}` | Revenue by category |
| GET | `/window-functions` | `{data[], execution_time_s}` | Running totals + rank |
| GET | `/top-products` | `{data[], execution_time_s}` | Top N products |
| GET | `/schema` | `{schema[], row_count, ...}` | Inferred schema + stats |

### NumPy `/numpy`

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/statistics` | `{statistics{}}` | Mean, std, percentiles per column |
| GET | `/moving-average?ticker=AAPL&window=30` | `{raw[], moving_average[]}` | N-day moving average |
| GET | `/correlation-matrix` | `{columns[], matrix[]}` | NumPy corrcoef matrix |
| GET | `/fft?machine_id=M001` | `{frequencies[], amplitudes[]}` | FFT frequency spectrum |

---

## Frontend Architecture

### Routing

```
/                     →  HomePage (dashboard overview)
/tools/matplotlib     →  MatplotlibPage
/tools/seaborn        →  SeabornPage
/tools/plotly         →  PlotlyPage
/tools/pandas         →  PandasPage
/tools/bokeh          →  BokehPage
/tools/altair         →  AltairPage
/tools/spark          →  SparkPage
/tools/numpy          →  NumpyPage
```

All routes are **lazy-loaded** (`React.lazy`) and share the `MainLayout` which provides the collapsible sidebar and sticky header.

### State Management

- **Server state**: TanStack Query (`useQuery`) — 5-minute stale time, automatic background refetch
- **UI state**: Local `useState` — filter values (ticker, region, window size, etc.)
- **Theme**: Custom context + `localStorage` persistence
- **No global store** (Redux/Zustand) — not needed for this data-fetch-heavy pattern

### Chart Rendering Strategy

```
Backend returns PNG?       → ImageChart     (base64 img tag)
Backend returns Plotly JSON? → PlotlyChart  (Plotly.react via dynamic import)
Backend returns Vega-Lite?  → VegaChart     (vega-embed, cleanup on unmount)
Backend returns Bokeh HTML? → BokehEmbed    (sandboxed iframe)
Backend returns raw JSON?   → Recharts      (LineChart / BarChart)
```

---

## Make Commands

### Root (run from project root)

```bash
make setup          # Full first-time setup
make dev            # Start both services in parallel
make dev-backend    # Backend only
make dev-frontend   # Frontend only
make build          # Production build
make lint           # Lint both
make clean          # Remove build artifacts
make clean-all      # Remove venv + node_modules + CSVs
make test-api       # Smoke-test all endpoints
```

### Backend (run from `backend/` or use `make backend CMD=<cmd>`)

```bash
make setup          # venv + install + generate-data
make venv           # Create virtual environment only
make install        # pip install -r requirements.txt
make install-dev    # + ruff, mypy, pytest
make generate-data  # Regenerate all 7 CSVs
make dev            # uvicorn --reload
make start          # uvicorn (no reload)
make lint           # ruff check
make format         # ruff format + fix
make typecheck      # mypy
make test           # pytest
make test-cov       # pytest + HTML coverage
make test-api       # curl smoke tests
make show-data      # CSV file sizes
make clean          # Remove __pycache__
make clean-data     # Remove CSV files
make clean-all      # Remove venv + cache + CSVs
```

### Frontend (run from `frontend/` or use `make frontend CMD=<cmd>`)

```bash
make setup          # npm install
make install        # npm install
make install-clean  # Remove node_modules + fresh install
make dev            # vite dev server
make dev-host       # vite dev --host (LAN access)
make build          # tsc + vite build
make typecheck      # tsc --noEmit
make lint           # eslint
make lint-fix       # eslint --fix
make preview        # build + vite preview
make shadcn-add c=<name>  # Add a shadcn component
make clean          # Remove dist/
make clean-all      # Remove dist/ + node_modules/
```

---

## Environment Variables

### Backend (`.env` in `backend/` — optional)

```env
# Not required; defaults are hardcoded but can be overridden
PORT=8000
HOST=127.0.0.1
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

Change `VITE_API_URL` if deploying the backend to a different host/port.

---

## Windows / PySpark Notes

PySpark requires `winutils.exe` and `hadoop.dll` on Windows. Without them, Spark still works using built-in Java classes but logs a warning.

**To silence the warning and enable full Hadoop support:**

1. Download `winutils.exe` and `hadoop.dll` for Hadoop 3.3.5 from:
   `https://github.com/cdarlint/winutils/tree/master/hadoop-3.3.5/bin`

2. Place both files in:
   ```
   backend/winutils/hadoop-3.3.5/bin/winutils.exe
   backend/winutils/hadoop-3.3.5/bin/hadoop.dll
   ```

3. The `spark_utils.py` automatically sets `HADOOP_HOME` and `PATH` at startup.

**Other Windows notes:**

- Use **Git Bash** or **WSL** to run `make` commands (Windows cmd does not have `make`)
- Java 17 (JDK) is recommended; Java 11 also works with PySpark 3.5.x
- If port 8000 is stuck after killing the server:
  ```bash
  netstat -ano | findstr :8000    # find PID
  taskkill /F /PID <pid>          # kill it (in cmd.exe)
  ```
