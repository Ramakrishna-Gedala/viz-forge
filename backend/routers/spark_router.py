import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query

import utils.spark_utils as spark_utils
from utils.datastore import DataStore, get_datastore

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"


def _require_spark():
    """Dependency that raises 503 if Spark is unavailable."""
    if spark_utils._spark is None:
        raise HTTPException(
            status_code=503,
            detail="PySpark is unavailable. Download winutils.exe + hadoop.dll for Hadoop 3.3.5 "
                   "from github.com/cdarlint/winutils and place in backend/winutils/hadoop-3.3.5/bin/",
        )
    return spark_utils._spark


def _load_transactions(spark, sample: bool):
    """Load transactions CSV into a Spark DataFrame."""
    df = spark.read.csv(
        str(DATA_DIR / "transactions.csv"),
        header=True,
        inferSchema=True,
    )
    if sample:
        df = df.limit(1000)
    return df


@router.get("/aggregations")
def aggregations(
    sample: bool = Query(False),
    spark=Depends(_require_spark),
):
    """Total sales by category, store, and payment method."""
    from pyspark.sql import functions as F

    start = time.perf_counter()
    df = _load_transactions(spark, sample)
    result = (
        df.groupBy("category")
        .agg(
            F.round(F.sum("amount"), 2).alias("total_revenue"),
            F.count("*").alias("transaction_count"),
            F.round(F.avg("amount"), 2).alias("avg_amount"),
        )
        .orderBy(F.desc("total_revenue"))
    )
    rows = result.toPandas().to_dict(orient="records")
    elapsed = round(time.perf_counter() - start, 3)
    return {"data": rows, "row_count": len(rows), "execution_time_s": elapsed}


@router.get("/window-functions")
def window_functions(
    sample: bool = Query(True),
    spark=Depends(_require_spark),
):
    """Running total and rank within category using Spark window functions."""
    from pyspark.sql import functions as F
    from pyspark.sql.window import Window

    start = time.perf_counter()
    df = _load_transactions(spark, sample)

    window_spec = Window.partitionBy("category").orderBy("timestamp")
    rank_spec = Window.partitionBy("category").orderBy(F.desc("amount"))

    result = df.withColumn(
        "running_total", F.round(F.sum("amount").over(window_spec), 2)
    ).withColumn(
        "rank_in_category", F.rank().over(rank_spec)
    ).select(
        "transaction_id", "category", "amount", "timestamp",
        "running_total", "rank_in_category"
    ).limit(200)

    rows = result.toPandas().to_dict(orient="records")
    elapsed = round(time.perf_counter() - start, 3)
    return {"data": rows, "execution_time_s": elapsed}


@router.get("/top-products")
def top_products(
    limit: int = Query(10),
    spark=Depends(_require_spark),
):
    """Top N products by total revenue using Spark SQL."""
    from pyspark.sql import functions as F

    start = time.perf_counter()
    df = _load_transactions(spark, False)

    result = (
        df.groupBy("product_id")
        .agg(
            F.round(F.sum("amount"), 2).alias("total_revenue"),
            F.count("*").alias("transaction_count"),
        )
        .orderBy(F.desc("total_revenue"))
        .limit(limit)
    )
    rows = result.toPandas().to_dict(orient="records")
    elapsed = round(time.perf_counter() - start, 3)
    return {"data": rows, "execution_time_s": elapsed}


@router.get("/schema")
def schema(spark=Depends(_require_spark)):
    """Return inferred schema + row count + column stats."""
    start = time.perf_counter()
    df = _load_transactions(spark, False)
    fields = [{"name": f.name, "type": str(f.dataType)} for f in df.schema.fields]
    row_count = df.count()
    elapsed = round(time.perf_counter() - start, 3)
    return {
        "schema": fields,
        "row_count": row_count,
        "column_count": len(fields),
        "execution_time_s": elapsed,
    }
