# Project Flow — End-to-End Walkthrough

This document traces the complete lifecycle of a request through the platform,
from browser interaction to rendered chart.

---

## Startup Sequence

When you run `make dev-backend` (or `uvicorn main:app`):

```
uvicorn starts
    │
    └─► FastAPI lifespan(startup)
            │
            ├─► load_all_csvs()
            │       reads 7 CSV files with pandas.read_csv()
            │       stores as DataStore singleton (7 DataFrames in RAM)
            │       ~2-3 seconds on first run
            │
            └─► init_spark()
                    sets HADOOP_HOME + PATH (winutils)
                    SparkSession.builder.getOrCreate()
                    starts JVM in local[2] mode
                    ~15-20 seconds (JVM cold start)
                    returns SparkSession singleton

HTTP server ready on port 8000
```

The DataStore and SparkSession are created **once** and reused across all requests. This is critical for performance — pandas `read_csv` on 150k rows would add ~500ms per request if done inline.

---

## Request Flow: Matplotlib Line Chart

**User action:** opens `/tools/matplotlib`, selects region "North"

```
Browser  →  React component mounts
             │
             └─► useQuery({ queryKey: ["matplotlib", "line-chart", "North", false] })
                     │
                     └─► TanStack Query: not in cache → execute queryFn
                              │
                              └─► matplotlibApi.lineChart({ region: "North" })
                                      │
                                      └─► axios GET /matplotlib/line-chart?region=North
```

```
FastAPI receives GET /matplotlib/line-chart?region=North
    │
    ├─► dependency injection: store = Depends(get_datastore)
    │       returns the DataStore singleton (no I/O)
    │
    └─► line_chart(region="North", sample=False, store=store)
            │
            ├─► df = store.sales.copy()
            ├─► df = df[df["region"] == "North"]       (32,880 → ~6,576 rows)
            ├─► monthly = df.groupby(date.to_period("M"))["revenue"].sum()
            │
            ├─► fig, ax = plt.subplots(figsize=(12, 5))
            ├─► ax.plot(monthly.index, monthly.values)
            ├─► ax.set_title("Monthly Revenue Trend")
            │
            └─► return fig_to_base64(fig)
                    │
                    ├─► buf = io.BytesIO()
                    ├─► fig.savefig(buf, format="png", dpi=150)
                    ├─► plt.close(fig)           ← prevents memory leak
                    └─► return {"image": base64.b64encode(buf.read())}

HTTP 200 → {"image": "iVBORw0KGgo..."}
```

```
Browser receives {"image": "iVBORw0KGgo..."}
    │
    └─► TanStack Query: stores in cache with key ["matplotlib", "line-chart", "North", false]
            │
            └─► React re-renders → ImageChart component
                    │
                    ├─► isLoading=false, data.image exists
                    └─► <img src="data:image/png;base64,iVBORw0KGgo..." />
                              chart appears in browser
```

**Cache behavior:** Next time the user selects "North" again within 5 minutes, TanStack Query returns the cached response instantly — no network request.

---

## Request Flow: Plotly Candlestick

**User action:** selects ticker "TSLA" in PlotlyPage

```
Browser → React: setTicker("TSLA")
    │
    └─► useQuery key changes to ["plotly", "candlestick", "TSLA"]
             │
             └─► plotlyApi.candlestick({ ticker: "TSLA" })
                     │
                     └─► GET /plotly/candlestick?ticker=TSLA
```

```
FastAPI → plotly_router.py candlestick()
    │
    ├─► df = store.stocks[store.stocks["ticker"] == "TSLA"]
    ├─► df = df.sort_values("date")
    │
    ├─► fig = go.Figure(data=[go.Candlestick(
    │       x=df["date"].astype(str),
    │       open=df["open"], high=df["high"],
    │       low=df["low"], close=df["close"])])
    │
    └─► return {"chart_json": json.loads(fig.to_json())}
            ↑
            json.loads(fig.to_json()) is REQUIRED
            fig.to_dict() returns numpy.float64 values
            which are not JSON-serializable by FastAPI's default encoder
```

```
Browser receives {"chart_json": {data: [...], layout: {...}}}
    │
    └─► PlotlyChart component useEffect fires
            │
            └─► import("plotly.js-dist-min")  ← dynamic import (lazy loaded)
                    │
                    └─► Plotly.react(divRef.current,
                              chartJson.data,
                              { ...chartJson.layout, paper_bgcolor: "transparent" },
                              { responsive: true })
                              │
                              Plotly.js renders interactive SVG/WebGL canvas
                              (zoom, pan, hover tooltips active)
```

---

## Request Flow: Bokeh SSE Streaming

**User action:** clicks "Start Streaming" button on BokehPage

```
Browser → BokehPage.startStreaming()
    │
    └─► new EventSource("http://localhost:8000/bokeh/streaming")
              │
              EventSource opens persistent HTTP connection
```

```
FastAPI → bokeh_router.py streaming()
    │
    └─► StreamingResponse(generator(), media_type="text/event-stream")
              │
              async def generator():
                  for chunk in chunks:           # 250 chunks × 200 rows
                      yield f"data: {json.dumps(chunk)}\n\n"
                      await asyncio.sleep(0.3)   # non-blocking, yields event loop
              │
              Response stays open, chunks sent every 300ms
```

```
Browser EventSource.onmessage fires for each chunk
    │
    └─► const data = JSON.parse(e.data)
    └─► if data.done → stopStreaming()
    └─► setStreamStats(s => ({
              chunks: s.chunks + 1,
              rows: s.rows + data.length     // += 200 rows
        }))
```

**Why SSE instead of WebSocket?**
SSE is one-directional (server → client) and works over plain HTTP/1.1. It's simpler to implement and sufficient for read-only live data streams. WebSockets would be needed if the client needed to send commands back.

---

## Request Flow: PySpark Aggregations

**User action:** opens SparkPage, toggles "Full 150k rows"

```
Browser → GET /spark/aggregations
```

```
FastAPI → spark_router.py aggregations()
    │
    ├─► _require_spark() → returns SparkSession singleton (no startup cost)
    │
    ├─► df = spark.read.csv("transactions.csv", header=True, inferSchema=True)
    │       ↑ This is LAZY — no data is read yet
    │       Creates a logical plan: "read this CSV"
    │
    ├─► result = df.groupBy("category")
    │       .agg(F.round(F.sum("amount"), 2).alias("total_revenue"),
    │            F.count("*").alias("count"),
    │            F.round(F.avg("amount"), 2).alias("avg"))
    │       .orderBy(F.desc("total_revenue"))
    │       ↑ Still LAZY — building the execution plan
    │
    └─► rows = result.toPandas()      ← ACTION: triggers execution
            │
            Spark Catalyst optimizer rewrites the plan:
              - Predicate pushdown
              - Columnar reading (Parquet-style scan for CSV)
              - Aggregate on 2 cores (local[2])
            │
            ~0.5-2 seconds for 150k rows locally
            │
            .to_dict(orient="records")
            │
    return {"data": rows, "execution_time_s": elapsed}
```

---

## Request Flow: Altair Interactive Brush

**User action:** drags to select a date range in the overview chart

```
All data was already loaded when the page opened:
    GET /altair/interactive-brush
        → {"chart_json": {$schema, data: [...5480 rows...], layer: [...]}}
```

The entire 5,480-row weather dataset is embedded in the Vega-Lite spec's `data.values` array. This is different from other tools — Altair **sends all data to the browser** rather than computing on the server. The interactive brush filtering happens entirely client-side in JavaScript (Vega-Lite's runtime).

```
vega-embed renders the spec:
    ├── Overview chart: line + selection_interval brush
    └── Detail chart: transform_filter(brush)
              ↑
              When user drags:
              1. Vega-Lite updates the selection store
              2. transform_filter re-evaluates against selection
              3. Detail chart re-renders with filtered data
              All in-browser, zero additional HTTP requests
```

**This is why Altair disables the 5,000-row limit:**
```python
alt.data_transformers.disable_max_rows()
```
Without this, Altair raises an error when the dataset exceeds 5k rows, because embedding large datasets in the JSON spec can slow initial page load.

---

## The `?sample=true` Parameter

Every endpoint accepts `?sample=true` to limit processing to 1,000 rows:

```python
def apply_sample(df: pd.DataFrame, sample: bool, n: int = 1000) -> pd.DataFrame:
    if sample and len(df) > n:
        return df.sample(n, random_state=42)   # reproducible
    return df
```

**Why reproducible (`random_state=42`)?**
The same 1,000 rows are returned every time, so TanStack Query's cache works correctly — the same cache key always produces the same data.

**For PySpark**, `.sample()` is probabilistic, so `sample=True` uses `.limit(1000)` instead:
```python
if sample:
    df = df.limit(1000)   # deterministic for Spark
```

---

## Theme Toggle Flow

```
User clicks moon/sun icon in header
    │
    └─► ThemeSwitcher → toggleTheme()
              │
              └─► ThemeContext: setTheme("dark" | "light")
                      │
                      └─► useEffect: document.documentElement.classList.toggle("dark")
                               │
                               localStorage.setItem("data-platform-theme", "dark")
                               │
                               Tailwind CSS `.dark` class activated
                               All CSS variables switch:
                                 --background: oklch(0.145 0 0)  (dark)
                                 --foreground: oklch(0.985 0 0)  (near white)
                               All components re-render with dark theme

Next page load → ThemeProvider reads localStorage → starts in dark mode
```

Note: Base64 PNG images (Matplotlib, Seaborn, Pandas) are **static** and do not theme-switch. This is a known trade-off — server-rendered images are always light-background. Only Plotly/Altair/Bokeh charts can be theme-aware since they use the CSS/HTML rendering pipeline.

---

## Error Handling

```
API call fails (backend down, 500 error, network error)
    │
    └─► TanStack Query: retries once (retry: 1 in QueryClient config)
              │
              still fails → error state
              │
              └─► Component renders <ErrorAlert message={error.message} />
                      │
                      shadcn Alert with destructive variant
                      "Failed to load data. Make sure the backend is running..."
```

---

## Performance Characteristics

| Operation | Typical Time | Notes |
|-----------|-------------|-------|
| Backend startup (no Spark) | ~3s | CSV loading |
| Backend startup (with Spark) | ~18s | JVM cold start |
| Matplotlib line chart | ~150ms | pandas groupby + render |
| Seaborn pairplot | ~1-2s | Always sampled to 500 rows |
| Plotly candlestick | ~50ms | No computation, just JSON |
| Bokeh dashboard | ~200ms | Bokeh layout build |
| Altair faceted | ~300ms | 5,480 rows in JSON spec |
| Spark aggregation (150k) | ~500ms-2s | JVM warmup after first query |
| NumPy FFT (50k) | ~20ms | Vectorized C operations |
| Any endpoint with `?sample=true` | <100ms | 1,000 rows max |
