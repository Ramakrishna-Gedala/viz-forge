import matplotlib.pyplot as plt
import pandas as pd
from fastapi import APIRouter, Depends, Query

from utils.datastore import DataStore, get_datastore
from utils.image_utils import apply_sample, fig_to_base64

router = APIRouter()


@router.get("/line-chart")
def line_chart(
    region: str = Query(None, description="Filter by region"),
    sample: bool = Query(False),
    store: DataStore = Depends(get_datastore),
):
    """Monthly revenue trend as a line chart."""
    df = store.sales.copy()
    if region:
        df = df[df["region"] == region]
    df = apply_sample(df, sample)
    monthly = df.groupby(df["date"].dt.to_period("M"))["revenue"].sum().reset_index()
    monthly["date"] = monthly["date"].astype(str)

    fig, ax = plt.subplots(figsize=(12, 5))
    ax.plot(monthly["date"], monthly["revenue"], color="#3b82f6", linewidth=2, marker="o", markersize=3)
    ax.set_title("Monthly Revenue Trend", fontsize=14, fontweight="bold")
    ax.set_xlabel("Month")
    ax.set_ylabel("Revenue ($)")
    ax.tick_params(axis="x", rotation=45)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/bar-chart")
def bar_chart(
    sample: bool = Query(False),
    store: DataStore = Depends(get_datastore),
):
    """Regional sales comparison as a horizontal bar chart."""
    df = apply_sample(store.sales, sample)
    regional = df.groupby("region")["revenue"].sum().sort_values()

    colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.barh(regional.index, regional.values, color=colors[: len(regional)])
    ax.set_title("Total Revenue by Region", fontsize=14, fontweight="bold")
    ax.set_xlabel("Revenue ($)")
    ax.bar_label(bars, fmt="$%.0f", padding=5)
    ax.grid(axis="x", alpha=0.3)
    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/subplots")
def subplots(
    sample: bool = Query(False),
    store: DataStore = Depends(get_datastore),
):
    """Multi-panel dashboard: revenue trend, regional bars, product pie, units vs revenue scatter."""
    df = apply_sample(store.sales, sample)

    monthly = df.groupby(df["date"].dt.to_period("M"))["revenue"].sum()
    monthly.index = monthly.index.astype(str)
    regional = df.groupby("region")["revenue"].sum().sort_values()
    product_rev = df.groupby("product")["revenue"].sum()
    sample_scatter = df.sample(min(500, len(df)), random_state=42)

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle("Sales Performance Dashboard", fontsize=16, fontweight="bold")

    # Panel 1: Monthly revenue line
    axes[0, 0].plot(monthly.index, monthly.values, color="#3b82f6", linewidth=2)
    axes[0, 0].set_title("Monthly Revenue")
    axes[0, 0].tick_params(axis="x", rotation=45)
    axes[0, 0].grid(alpha=0.3)

    # Panel 2: Regional bar
    axes[0, 1].barh(regional.index, regional.values, color="#8b5cf6")
    axes[0, 1].set_title("Revenue by Region")
    axes[0, 1].grid(axis="x", alpha=0.3)

    # Panel 3: Product pie
    axes[1, 0].pie(product_rev.values, labels=product_rev.index, autopct="%1.1f%%", startangle=90)
    axes[1, 0].set_title("Revenue by Product")

    # Panel 4: Units vs Revenue scatter
    axes[1, 1].scatter(sample_scatter["units_sold"], sample_scatter["revenue"], alpha=0.4, color="#10b981", s=10)
    axes[1, 1].set_title("Units Sold vs Revenue")
    axes[1, 1].set_xlabel("Units Sold")
    axes[1, 1].set_ylabel("Revenue ($)")
    axes[1, 1].grid(alpha=0.3)

    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/regions")
def get_regions(store: DataStore = Depends(get_datastore)):
    """Return list of unique regions."""
    return {"regions": sorted(store.sales["region"].unique().tolist())}


@router.get("/preview")
def preview(store: DataStore = Depends(get_datastore)):
    """Return first 100 rows of sales data as JSON."""
    return store.sales.head(100).to_dict(orient="records")
