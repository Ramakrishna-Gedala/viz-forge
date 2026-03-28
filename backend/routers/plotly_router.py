import json

import plotly.express as px
import plotly.graph_objects as go
from fastapi import APIRouter, Depends, Query

from utils.datastore import DataStore, get_datastore
from utils.image_utils import apply_sample

router = APIRouter()


def _to_chart_json(fig) -> dict:
    """Convert Plotly figure to a pure-Python JSON-safe dict."""
    return {"chart_json": json.loads(fig.to_json())}


@router.get("/candlestick")
def candlestick(
    ticker: str = Query("AAPL", description="Stock ticker"),
    sample: bool = Query(False),
    store: DataStore = Depends(get_datastore),
):
    """OHLC candlestick chart for a given ticker."""
    df = store.stocks[store.stocks["ticker"] == ticker.upper()].copy()
    df = apply_sample(df, sample)
    df = df.sort_values("date")

    fig = go.Figure(
        data=[
            go.Candlestick(
                x=df["date"].astype(str),
                open=df["open"], high=df["high"],
                low=df["low"], close=df["close"],
                name=ticker,
            )
        ]
    )
    fig.update_layout(
        title=f"{ticker} — OHLC Candlestick Chart",
        xaxis_title="Date", yaxis_title="Price ($)",
        xaxis_rangeslider_visible=True,
        height=500,
    )
    return _to_chart_json(fig)


@router.get("/treemap")
def treemap(
    store: DataStore = Depends(get_datastore),
):
    """Portfolio allocation treemap by ticker total volume."""
    df = store.stocks.groupby("ticker")["volume"].sum().reset_index()
    df["sector"] = df["ticker"].map({
        "AAPL": "Technology", "MSFT": "Technology",
        "GOOGL": "Technology", "AMZN": "Consumer", "TSLA": "Automotive",
    })

    fig = px.treemap(df, path=["sector", "ticker"], values="volume",
                     color="volume", color_continuous_scale="Blues",
                     title="Portfolio Allocation by Volume")
    fig.update_layout(height=500)
    return _to_chart_json(fig)


@router.get("/scatter-3d")
def scatter_3d(
    sample: bool = Query(True),
    store: DataStore = Depends(get_datastore),
):
    """3D scatter: open price vs close price vs volume."""
    df = apply_sample(store.stocks, sample, n=1000)

    fig = px.scatter_3d(
        df, x="open", y="close", z="volume", color="ticker",
        opacity=0.7, title="3D Scatter: Open vs Close vs Volume",
        labels={"open": "Open Price ($)", "close": "Close Price ($)", "volume": "Volume"},
    )
    fig.update_layout(height=600)
    return _to_chart_json(fig)


@router.get("/animated-bar")
def animated_bar(
    store: DataStore = Depends(get_datastore),
):
    """Animated bar race: monthly close price by ticker over time."""
    df = store.stocks.copy()
    df["month"] = df["date"].dt.to_period("M").astype(str)
    monthly = df.groupby(["month", "ticker"])["close"].mean().reset_index()
    monthly = monthly.sort_values("month")

    fig = px.bar(
        monthly, x="ticker", y="close", animation_frame="month",
        color="ticker", range_y=[0, monthly["close"].max() * 1.1],
        title="Monthly Average Close Price by Ticker (Animated)",
        labels={"close": "Avg Close Price ($)", "ticker": "Ticker"},
    )
    fig.update_layout(height=500, showlegend=False)
    return _to_chart_json(fig)


@router.get("/tickers")
def get_tickers(store: DataStore = Depends(get_datastore)):
    return {"tickers": sorted(store.stocks["ticker"].unique().tolist())}


@router.get("/preview")
def preview(store: DataStore = Depends(get_datastore)):
    return store.stocks.head(100).to_dict(orient="records")
