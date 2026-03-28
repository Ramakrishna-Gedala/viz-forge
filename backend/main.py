import matplotlib
matplotlib.use("Agg")  # MUST be first, before any pyplot import

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import utils.datastore as ds
import utils.spark_utils as spark_utils
from routers import (
    altair_router,
    bokeh_router,
    matplotlib_router,
    numpy_router,
    pandas_router,
    plotly_router,
    seaborn_router,
    spark_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    ds._store = ds.load_all_csvs()
    spark_utils._spark = spark_utils.init_spark()
    yield
    # Shutdown
    if spark_utils._spark:
        spark_utils._spark.stop()


app = FastAPI(
    title="Data Processing Learning Platform API",
    description="FastAPI backend demonstrating 8 Python data tools",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(matplotlib_router.router, prefix="/matplotlib", tags=["Matplotlib"])
app.include_router(seaborn_router.router,    prefix="/seaborn",    tags=["Seaborn"])
app.include_router(plotly_router.router,     prefix="/plotly",     tags=["Plotly"])
app.include_router(pandas_router.router,     prefix="/pandas",     tags=["Pandas"])
app.include_router(bokeh_router.router,      prefix="/bokeh",      tags=["Bokeh"])
app.include_router(altair_router.router,     prefix="/altair",     tags=["Altair"])
app.include_router(spark_router.router,      prefix="/spark",      tags=["PySpark"])
app.include_router(numpy_router.router,      prefix="/numpy",      tags=["NumPy"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Data Processing Learning Platform API"}


@app.get("/health", tags=["Health"])
def health():
    store = ds._store
    spark_available = spark_utils._spark is not None
    return {
        "status": "ok",
        "spark_available": spark_available,
        "datasets": {
            "sales": len(store.sales) if store else 0,
            "employees": len(store.employees) if store else 0,
            "stocks": len(store.stocks) if store else 0,
            "ecommerce": len(store.ecommerce) if store else 0,
            "sensors": len(store.sensors) if store else 0,
            "weather": len(store.weather) if store else 0,
            "transactions": len(store.transactions) if store else 0,
        },
    }
