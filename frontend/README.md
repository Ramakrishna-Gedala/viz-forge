# Frontend — Data Processing Learning Platform

React 18 + TypeScript + Vite frontend for the Data Processing Learning Platform.

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 8 | Dev server + bundler |
| Tailwind CSS | 4 | Utility-first styling |
| shadcn/ui | latest | Component library (new-york style) |
| TanStack Query | 5 | Server state / data fetching |
| React Router | 6 | Client-side routing |
| Axios | 1 | HTTP client |
| Plotly.js | 2 | Interactive Plotly charts |
| vega-embed | 6 | Altair / Vega-Lite charts |
| Recharts | 2 | NumPy + Spark data charts |
| lucide-react | — | Icons |

## Quick Start

```bash
# From project root (recommended)
make setup-frontend
make dev-frontend

# Or from this directory
make setup
make dev
```

## Make Commands

```bash
make setup          # npm install
make dev            # vite dev server → http://localhost:5173
make build          # tsc + vite production build
make typecheck      # TypeScript type check only
make lint           # eslint
make lint-fix       # eslint --fix
make clean          # remove dist/
make clean-all      # remove dist/ + node_modules/
make shadcn-add c=dialog   # add a shadcn component
```

## Project Structure

```
src/
├── App.tsx                    # Root: Providers + RouterProvider
├── index.css                  # Tailwind v4 + CSS variables (light/dark)
│
├── app/
│   ├── providers.tsx          # QueryClient + ThemeProvider
│   └── router.tsx             # Route definitions (lazy loaded)
│
├── layouts/
│   └── MainLayout.tsx         # Sidebar + Header + Outlet
│
├── components/
│   ├── AppSidebar.tsx         # Left navigation (collapsible)
│   ├── SiteHeader.tsx         # Top bar + theme toggle
│   ├── ThemeProvider.tsx      # Light/dark theme context
│   ├── charts/
│   │   ├── ImageChart.tsx     # Renders base64 PNG images
│   │   ├── PlotlyChart.tsx    # Plotly.js wrapper (dynamic import)
│   │   ├── VegaChart.tsx      # vega-embed wrapper
│   │   └── BokehEmbed.tsx     # Bokeh HTML iframe
│   ├── shared/
│   │   ├── DataTable.tsx      # shadcn Table with pagination
│   │   ├── FilterBar.tsx      # Reusable filter row
│   │   ├── PageHeader.tsx     # Page title + badge
│   │   ├── ChartSkeleton.tsx  # Loading placeholder
│   │   └── ErrorAlert.tsx     # API error display
│   └── ui/                    # shadcn/ui primitives
│
├── api/                       # Typed axios wrappers
│   ├── client.ts              # axios instance (VITE_API_URL)
│   ├── matplotlib.api.ts
│   ├── seaborn.api.ts
│   ├── plotly.api.ts
│   ├── pandas.api.ts
│   ├── bokeh.api.ts
│   ├── altair.api.ts
│   ├── spark.api.ts
│   └── numpy.api.ts
│
└── pages/
    ├── Home/           # Dashboard overview
    ├── MatplotlibPage/ # Sales charts
    ├── SeabornPage/    # HR analytics
    ├── PlotlyPage/     # Stock market
    ├── PandasPage/     # E-commerce
    ├── BokehPage/      # IoT streaming
    ├── AltairPage/     # Weather
    ├── SparkPage/      # Big data
    └── NumpyPage/      # Signal processing
```

## Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Chart Rendering

| Chart type | Component | Mechanism |
|-----------|-----------|-----------|
| Matplotlib PNG | `ImageChart` | `<img src="data:image/png;base64,...">` |
| Seaborn PNG | `ImageChart` | Same as above |
| Pandas Plotting PNG | `ImageChart` | Same as above |
| Plotly JSON | `PlotlyChart` | `Plotly.react()` via dynamic import |
| Altair/Vega-Lite JSON | `VegaChart` | `vega-embed()` with cleanup on unmount |
| Bokeh HTML | `BokehEmbed` | `<iframe srcDoc>` sandboxed |
| Recharts (NumPy/Spark) | `<LineChart>/<BarChart>` | React component tree |

## Adding a New Tool

1. Create `src/api/newtool.api.ts` with typed axios calls
2. Create `src/pages/NewToolPage/index.tsx` using existing chart components
3. Add route to `src/app/router.tsx`
4. Add nav item to `src/components/AppSidebar.tsx`
