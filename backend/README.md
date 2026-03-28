# Backend — Data Processing Learning Platform

FastAPI backend serving 8 Python data tool sections via a REST API.

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| FastAPI | 0.115 | Web framework |
| uvicorn | 0.32 | ASGI server |
| Python | 3.11+ | Runtime |
| pandas | 2.2.3 | CSV loading + DataFrame ops |
| NumPy | 1.26.4 | Numerical computing |
| Matplotlib | 3.9 | Static chart rendering |
| Seaborn | 0.13 | Statistical visualizations |
| Plotly | 5.24 | Interactive chart JSON |
| Bokeh | 3.6 | Streaming dashboards |
| Altair | 5.4 | Vega-Lite chart specs |
| PySpark | 3.5.3 | Distributed data processing |
| SciPy | 1.14 | Statistical functions |
| Faker | 30 | Data generation |

## Quick Start

```bash
# From project root (recommended)
make setup-backend
make dev-backend

# Or from this directory
make setup
make dev
```

## Make Commands

```bash
make setup          # Create venv + install deps + generate CSVs
make venv           # Create virtual environment only
make install        # pip install -r requirements.txt
make install-dev    # + ruff, mypy, pytest
make generate-data  # Regenerate all 7 CSV datasets
make dev            # uvicorn --reload on port 8000
make start          # uvicorn without reload
make lint           # ruff linter
make format         # ruff auto-format
make typecheck      # mypy
make test           # pytest
make test-cov       # pytest + HTML coverage report
make test-api       # curl smoke-test all endpoints
make show-data      # CSV file sizes and row counts
make clean          # Remove __pycache__
make clean-data     # Remove CSV files
make clean-all      # Remove venv + cache + CSVs
```

## Project Structure

```
backend/
├── main.py               # App entry: lifespan, CORS, router registration
├── requirements.txt
│
├── data/                 # Generated CSV files (run make generate-data)
│   ├── sales_data.csv        32,880 rows — daily retail sales
│   ├── employee_data.csv      1,000 rows — HR records
│   ├── stock_prices.csv       2,500 rows — OHLC + volume
│   ├── ecommerce_orders.csv  10,000 rows — online orders
│   ├── sensor_data.csv       50,000 rows — IoT sensor readings
│   ├── weather_data.csv       5,480 rows — daily weather
│   └── transactions.csv     150,000 rows — POS transactions
│
├── scripts/
│   └── generate_data.py  # Faker + NumPy data generation (seeded, deterministic)
│
├── routers/              # One router per Python library
│   ├── matplotlib_router.py   /matplotlib/* — base64 PNG charts
│   ├── seaborn_router.py      /seaborn/*    — base64 PNG charts
│   ├── plotly_router.py       /plotly/*     — Plotly JSON
│   ├── pandas_router.py       /pandas/*     — base64 PNG charts
│   ├── bokeh_router.py        /bokeh/*      — Bokeh HTML + SSE
│   ├── altair_router.py       /altair/*     — Vega-Lite JSON
│   ├── spark_router.py        /spark/*      — JSON table data
│   └── numpy_router.py        /numpy/*      — JSON arrays
│
├── utils/
│   ├── datastore.py      # DataStore dataclass + singleton + Depends()
│   ├── image_utils.py    # fig_to_base64(), apply_sample(), Agg backend
│   └── spark_utils.py    # SparkSession init with Windows winutils support
│
└── winutils/
    └── hadoop-3.3.5/bin/ # Place winutils.exe + hadoop.dll here (Windows)
```

## API Endpoints

See the main [README API Reference](../README.md#api-reference) or visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Response Formats

```json
// Image endpoints (Matplotlib, Seaborn, Pandas)
{"image": "<base64 PNG string>"}

// Plotly endpoints
{"chart_json": {"data": [...], "layout": {...}}}

// Altair endpoints
{"chart_json": {"$schema": "...", "data": {...}, "mark": "..."}}

// Bokeh endpoints
{"html": "<!DOCTYPE html><html>...Bokeh chart HTML...</html>"}

// Bokeh streaming (SSE)
data: [{"timestamp": "...", "machine_id": "M001", ...}, ...]

// PySpark + NumPy endpoints
{"data": [...], "execution_time_s": 0.432}
```

## Adding a New Tool

1. Create `routers/newtool_router.py` with a FastAPI `APIRouter`
2. Add endpoints that accept `Depends(get_datastore)` for data access
3. Register in `main.py`: `app.include_router(newtool_router.router, prefix="/newtool")`
4. Add to the frontend (see frontend README)

## Key Implementation Notes

### matplotlib.use("Agg") placement
```python
# main.py — must be FIRST, before any pyplot import
import matplotlib
matplotlib.use("Agg")
```

### Plotly JSON serialization
```python
# Use json.loads(fig.to_json()) NOT fig.to_dict()
# fig.to_dict() contains numpy types that cause JSON serialization errors
return {"chart_json": json.loads(fig.to_json())}
```

### Bokeh state reset
```python
from bokeh.io import reset_output
reset_output()   # Required at the start of every Bokeh handler
```

### Altair row limit
```python
alt.data_transformers.disable_max_rows()  # Module level in altair_router.py
```

### Seaborn pairplot
```python
grid = sns.pairplot(df)    # Returns PairGrid, not Figure
fig = grid.figure          # Extract figure for saving
```

## PySpark / Windows Setup

See [../README.md#windows--pyspark-notes](../README.md#windows--pyspark-notes) for detailed instructions on setting up `winutils.exe` for full Hadoop support on Windows.
