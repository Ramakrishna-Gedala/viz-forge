# Python Data Tools — Library Guide

This document explains each of the 8 Python libraries used in this platform:
what they do, how they work, when to use them, and exactly how they are used here.

---

## 1. Matplotlib

### What it is
The foundational Python plotting library. Every other charting library in this stack either wraps Matplotlib or was inspired by it. Matplotlib gives you full, low-level control over every pixel of a figure.

### How it works
```
Figure  →  Axes  →  Plot objects (Line2D, Rectangle, PathPatch, ...)
                      ↓
              fig.savefig(buffer, format="png")
```
A `Figure` is the whole canvas. An `Axes` is a single coordinate system inside it. You add artists (lines, bars, patches) to an `Axes`. `fig.savefig()` renders the scene to a buffer.

### When to use it
- You need precise layout control (margins, tick positions, font sizes)
- You need to produce publication-quality static figures
- You are wrapping it inside another library (Seaborn, Pandas plotting all use it internally)
- Server-side PNG generation for web delivery

### Key patterns used here
```python
# Always set backend before importing pyplot (headless server)
import matplotlib
matplotlib.use("Agg")           # No GUI, renders to buffer

import matplotlib.pyplot as plt
import io, base64

fig, ax = plt.subplots(figsize=(12, 5))
ax.plot(x, y, color="#3b82f6", linewidth=2)
ax.set_title("Monthly Revenue")

buf = io.BytesIO()
fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
plt.close(fig)                  # IMPORTANT: prevent memory leaks
encoded = base64.b64encode(buf.getvalue()).decode()
```

### Endpoints
- `GET /matplotlib/line-chart` — `ax.plot()` with monthly resampled data
- `GET /matplotlib/bar-chart` — `ax.barh()` (horizontal bars) sorted by revenue
- `GET /matplotlib/subplots` — `fig, axes = plt.subplots(2, 2)` for 4-panel layout

---

## 2. Seaborn

### What it is
A high-level statistical visualization library built on top of Matplotlib. Seaborn makes complex statistical charts (heatmaps, violin plots, regression plots, pairplots) achievable in one or two lines.

### How it works
Seaborn takes a pandas DataFrame and column names. It computes statistics internally (means, confidence intervals, kernel density) and draws the result using Matplotlib's artist model. The resulting figure is a Matplotlib `Figure`.

```
pandas DataFrame  →  seaborn function  →  Matplotlib Axes  →  savefig → PNG
```

### When to use it
- Exploratory Data Analysis (EDA) on tabular data
- When you want beautiful statistical charts without manual computation
- HR analytics, scientific data, any correlation/distribution analysis

### Key patterns used here
```python
import seaborn as sns

# Heatmap: correlation matrix
corr = df[numeric_cols].corr()
fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdYlGn", ax=ax)

# Pairplot: returns a PairGrid, NOT a Figure — extract .figure
grid = sns.pairplot(df.sample(500), hue="attrition")
fig = grid.figure              # ← Important: not grid itself
```

### Endpoints
- `GET /seaborn/heatmap` — `sns.heatmap()` on `.corr()` matrix
- `GET /seaborn/boxplot` — `sns.boxplot()` salary distributions by department
- `GET /seaborn/pairplot` — `sns.pairplot()` multi-variable explorer (500-row sample)
- `GET /seaborn/violin` — `sns.violinplot()` performance score split by attrition

---

## 3. Plotly

### What it is
An interactive charting library that produces JavaScript-powered charts. Unlike Matplotlib, Plotly figures are live objects with zoom, pan, hover tooltips, and animation — all running in the browser.

### How it works
Plotly Express and Plotly Graph Objects build a figure as a Python dict tree (`data`, `layout`, `frames`). `fig.to_json()` serializes this to JSON. The frontend passes this JSON to `Plotly.js`, which renders it in the browser.

```
Plotly figure dict  →  fig.to_json()  →  JSON over HTTP  →  Plotly.react(div, data, layout)
```

### When to use it
- Financial data (candlestick charts)
- Anything that needs user interaction (zoom, click, hover)
- Animated charts (bar races, time-series animations)
- 3D visualizations

### Key patterns used here
```python
import plotly.graph_objects as go
import plotly.express as px
import json

# Candlestick
fig = go.Figure(data=[go.Candlestick(x=df.date, open=df.open,
    high=df.high, low=df.low, close=df.close)])

# Return JSON-safe dict (fig.to_dict() can contain numpy types!)
return {"chart_json": json.loads(fig.to_json())}
```

### Endpoints
- `GET /plotly/candlestick?ticker=AAPL` — `go.Candlestick` with rangeslider
- `GET /plotly/treemap` — `px.treemap()` portfolio allocation
- `GET /plotly/scatter-3d` — `px.scatter_3d()` open/close/volume
- `GET /plotly/animated-bar` — `px.bar(animation_frame=...)` monthly price race

---

## 4. Pandas Plotting

### What it is
Pandas has built-in plotting capabilities via `DataFrame.plot.*` methods. These are thin wrappers around Matplotlib and are the fastest way to go from a DataFrame to a chart with no intermediate steps.

### How it works
```
df.plot.area(ax=ax)      →  returns an Axes object
df.plot.hist(bins=50)    →  returns an Axes object
pd.plotting.scatter_matrix(df)  →  returns 2D array of Axes
```
Extract the Figure from the Axes: `ax.get_figure()` or `axes[0][0].get_figure()`.

### When to use it
- Quick EDA without boilerplate
- When you already have a DataFrame and just need a fast visual
- Cumulative area charts, histograms, scatter matrices

### Key patterns used here
```python
import pandas as pd

# Area chart: group by month and category, then plot
monthly = df.groupby(["month", "category"])["order_value"].sum().unstack()
ax = monthly.plot.area(alpha=0.7, colormap="tab10")
fig = ax.get_figure()

# Scatter matrix: returns np array of Axes
axes = pd.plotting.scatter_matrix(df[cols], alpha=0.3, diagonal="hist")
fig = axes[0][0].get_figure()   # ← extract from first cell
```

### Endpoints
- `GET /pandas/area-chart` — `df.plot.area()` cumulative revenue by category
- `GET /pandas/histogram` — `df.plot.hist()` order value distribution
- `GET /pandas/scatter-matrix` — `pd.plotting.scatter_matrix()` on numeric columns

---

## 5. Bokeh

### What it is
Bokeh creates interactive visualizations that run in the browser, targeting big-data and streaming use cases. Unlike Plotly, Bokeh can embed a full mini-application (with widgets, callbacks, linked selections) and export it as self-contained HTML.

### How it works
```
ColumnDataSource  →  figure (p)  →  add glyphs to figure
                                     ↓
                               file_html(layout, CDN)  →  HTML string
```
`ColumnDataSource` is the central data object. Multiple figures can share the same source — selecting data in one automatically filters the other (linked brushing).

### When to use it
- Real-time streaming dashboards (Bokeh server)
- Linked, interactive multi-chart layouts
- Embedded interactive HTML in non-JS contexts

### Key patterns used here
```python
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource
from bokeh.layouts import column
from bokeh.embed import file_html
from bokeh.resources import CDN
from bokeh.io import reset_output

reset_output()          # MUST call between requests to reset global state

source = ColumnDataSource(df)
p1 = figure(title="Temperature")
p1.line("ts_str", "temperature", source=source)

html = file_html(column(p1), CDN, "Dashboard")
return {"html": html}
```

For SSE streaming:
```python
from fastapi.responses import StreamingResponse
import asyncio, json

async def generator():
    for chunk in chunks:
        yield f"data: {json.dumps(chunk)}\n\n"
        await asyncio.sleep(0.3)          # non-blocking sleep

return StreamingResponse(generator(), media_type="text/event-stream",
    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

### Endpoints
- `GET /bokeh/dashboard` — Multi-widget Bokeh layout (line + bar + DataTable)
- `GET /bokeh/streaming` — SSE endpoint streaming 200-row sensor chunks
- `GET /bokeh/linked-brushing` — `BoxSelectTool` shared `ColumnDataSource`

---

## 6. Altair

### What it is
Altair is a declarative visualization library based on **Vega-Lite**. You describe *what* you want (data + encoding channels + mark type) rather than *how* to draw it. Altair produces a Vega-Lite JSON spec that `vega-embed` renders in the browser.

### How it works
```
alt.Chart(df).mark_line().encode(x="date:T", y="temp:Q", color="city:N")
    ↓
chart.to_dict()  →  Vega-Lite JSON spec  →  vega-embed(div, spec)
```

The grammar:
- **Mark**: what shape to draw (`mark_line`, `mark_bar`, `mark_area`, `mark_circle`)
- **Encoding**: which data columns map to which visual channels (`x`, `y`, `color`, `size`, `opacity`)
- **Data types**: `:T` temporal, `:Q` quantitative, `:N` nominal, `:O` ordinal

### When to use it
- Clean, minimal, publication-quality interactive charts
- When you want consistent aesthetics with minimal code
- Layered charts (multiple overlapping marks), faceted small multiples

### Key patterns used here
```python
import altair as alt

# MUST disable row limit for large datasets
alt.data_transformers.disable_max_rows()

# Layered: temperature band + mean line
band = alt.Chart(df).mark_area(opacity=0.3).encode(
    x="date:T", y="min_temp:Q", y2="max_temp:Q")
line = alt.Chart(df).mark_line().encode(
    x="date:T", y="mean(max_temp):Q")
chart = (band + line).properties(width=700)

# Interactive brush
brush = alt.selection_interval(encodings=["x"])
overview = alt.Chart(df).mark_line().encode(...).add_params(brush)
detail = alt.Chart(df).mark_line().encode(...).transform_filter(brush)
combined = alt.vconcat(overview, detail)

return {"chart_json": chart.to_dict()}
```

### Endpoints
- `GET /altair/layered` — Band + line overlay for temperature range
- `GET /altair/faceted` — `.facet("city", columns=3)` small multiples
- `GET /altair/interactive-brush` — `alt.selection_interval()` linked overview/detail

---

## 7. PySpark

### What it is
Apache Spark's Python API. Spark is a distributed computing engine designed for processing datasets too large to fit in memory on a single machine. PySpark lets you write SQL-like transformations that execute on a cluster (or locally with `local[n]`).

### How it works
```
SparkSession  →  DataFrame (lazily evaluated)
                     ↓
               .groupBy() .agg() .orderBy()   ← transformation (lazy)
                     ↓
               .toPandas()   ← action (triggers execution)
```
PySpark DataFrames are **lazy**: transformations build an execution plan but nothing runs until an action (`.count()`, `.collect()`, `.toPandas()`) is called.

### When to use it
- Datasets larger than available RAM
- SQL-style analytics: groupBy, window functions, joins
- When you need a query optimizer (Catalyst) to handle complex pipelines

### Key patterns used here
```python
from pyspark.sql import SparkSession, functions as F
from pyspark.sql.window import Window

# Initialize once at startup (expensive — JVM startup)
spark = SparkSession.builder.master("local[2]") \
    .config("spark.sql.shuffle.partitions", "4") \
    .getOrCreate()

# Read CSV (lazy — no data loaded yet)
df = spark.read.csv("transactions.csv", header=True, inferSchema=True)

# Aggregation (still lazy)
result = df.groupBy("category").agg(
    F.sum("amount").alias("total"),
    F.count("*").alias("count")
).orderBy(F.desc("total"))

# Window function
window = Window.partitionBy("category").orderBy("timestamp")
df_with_running_total = df.withColumn("running_total",
    F.sum("amount").over(window))

# Action: materializes result as pandas DataFrame
rows = result.toPandas().to_dict(orient="records")
```

### Endpoints
- `GET /spark/aggregations` — `groupBy("category").agg(sum, count, avg)`
- `GET /spark/window-functions` — `Window.partitionBy().orderBy()` with running total + rank
- `GET /spark/top-products` — `groupBy().agg().orderBy(desc).limit(10)`
- `GET /spark/schema` — `df.schema.fields` + `df.count()`

---

## 8. NumPy

### What it is
The fundamental package for numerical computing in Python. NumPy provides the `ndarray` — a fast, memory-efficient multidimensional array — and hundreds of mathematical operations: linear algebra, Fourier transforms, statistical functions, random number generation.

### How it works
```
Python list (slow, boxed objects)
          ↓  np.array()
NumPy ndarray (fast, contiguous C memory, SIMD operations)
          ↓  vectorized operations
Result array (no Python loop overhead)
```

### When to use it
- Any numerical computation that would otherwise require Python loops
- Signal processing (FFT)
- Linear algebra (matrix multiply, eigenvalues)
- Statistics (mean, std, percentiles, correlation)
- Generating random data for testing/simulation

### Key patterns used here
```python
import numpy as np

# Statistics
arr = df["close"].to_numpy()
stats = {
    "mean": np.mean(arr),
    "std":  np.std(arr),
    "p25":  np.percentile(arr, 25),
    "p75":  np.percentile(arr, 75),
}

# Moving average via convolution (no loop)
window = 30
kernel = np.ones(window) / window
ma = np.convolve(close_prices, kernel, mode="valid")

# Correlation matrix
matrix = df[["temperature", "vibration", "pressure"]].to_numpy().T
corr = np.corrcoef(matrix)   # shape: (3, 3)

# Fast Fourier Transform — find dominant frequencies in sensor signal
n = len(signal)
fft_vals = np.fft.rfft(signal)         # real-valued FFT
freqs = np.fft.rfftfreq(n, d=10.0)    # d=10s between samples
amplitudes = np.abs(fft_vals)          # magnitude spectrum
```

### Endpoints
- `GET /numpy/statistics` — mean, std, variance, min, max, p25/p50/p75
- `GET /numpy/moving-average?window=30` — `np.convolve()` N-day MA
- `GET /numpy/correlation-matrix` — `np.corrcoef()` on sensor columns
- `GET /numpy/fft?machine_id=M001` — `np.fft.rfft()` frequency spectrum

---

## Library Comparison

| Concern | Matplotlib | Seaborn | Plotly | Pandas | Bokeh | Altair | PySpark | NumPy |
|---------|-----------|---------|--------|--------|-------|--------|---------|-------|
| Output | PNG | PNG | JSON | PNG | HTML | JSON | JSON | Arrays |
| Interactive? | No | No | Yes | No | Yes | Yes | N/A | N/A |
| Streaming? | No | No | No | No | Yes | No | N/A | N/A |
| Code style | Imperative | Declarative | Both | Imperative | Imperative | Declarative | SQL-like | Vectorized |
| Best for | Control | Stats | Interactive | Quick EDA | Dashboards | Grammar | Big data | Math |
| Scales to | ~10K pts | ~1K pts | ~100K pts | ~10K pts | ~1M pts | ~5K pts | Billions | Memory |
