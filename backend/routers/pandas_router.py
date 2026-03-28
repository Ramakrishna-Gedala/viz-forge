import matplotlib.pyplot as plt
import pandas as pd
from fastapi import APIRouter, Depends, Query

from utils.datastore import DataStore, get_datastore
from utils.image_utils import apply_sample, fig_to_base64

router = APIRouter()


def _compute_order_value(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["order_value"] = df["quantity"] * df["price"] * (1 - df["discount"])
    return df


@router.get("/area-chart")
def area_chart(
    category: str = Query(None),
    sample: bool = Query(False),
    store: DataStore = Depends(get_datastore),
):
    """Cumulative revenue over time by category."""
    df = _compute_order_value(store.ecommerce)
    if category:
        df = df[df["category"] == category]
    df = apply_sample(df, sample)
    df["month"] = df["order_date"].dt.to_period("M")
    monthly = df.groupby(["month", "category"])["order_value"].sum().unstack(fill_value=0)
    monthly.index = monthly.index.astype(str)

    fig, ax = plt.subplots(figsize=(12, 6))
    monthly.plot.area(ax=ax, alpha=0.7, colormap="tab10")
    ax.set_title("Monthly Revenue by Category", fontsize=13, fontweight="bold")
    ax.set_xlabel("Month")
    ax.set_ylabel("Revenue ($)")
    ax.tick_params(axis="x", rotation=45)
    ax.legend(loc="upper left", fontsize=8)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/histogram")
def histogram(
    bins: int = Query(50),
    sample: bool = Query(False),
    store: DataStore = Depends(get_datastore),
):
    """Order value distribution histogram."""
    df = _compute_order_value(store.ecommerce)
    df = apply_sample(df, sample)

    fig, ax = plt.subplots(figsize=(10, 5))
    df["order_value"].plot.hist(bins=bins, ax=ax, color="#3b82f6", edgecolor="white", alpha=0.8)
    ax.set_title("Order Value Distribution", fontsize=13, fontweight="bold")
    ax.set_xlabel("Order Value ($)")
    ax.set_ylabel("Frequency")
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/scatter-matrix")
def scatter_matrix(
    sample: bool = Query(True),
    store: DataStore = Depends(get_datastore),
):
    """Scatter matrix for numerical order columns."""
    df = _compute_order_value(store.ecommerce)
    df = apply_sample(df, sample, n=500)
    cols = ["quantity", "price", "discount", "order_value"]

    axes = pd.plotting.scatter_matrix(df[cols], alpha=0.3, figsize=(10, 10),
                                       diagonal="hist", color="#3b82f6")
    fig = axes[0][0].get_figure()
    fig.suptitle("E-Commerce Order Metrics — Scatter Matrix", fontsize=13, fontweight="bold")
    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/categories")
def get_categories(store: DataStore = Depends(get_datastore)):
    return {"categories": sorted(store.ecommerce["category"].unique().tolist())}


@router.get("/preview")
def preview(store: DataStore = Depends(get_datastore)):
    df = _compute_order_value(store.ecommerce)
    return df.head(100).to_dict(orient="records")
