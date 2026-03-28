import altair as alt
from fastapi import APIRouter, Depends, Query

from utils.datastore import DataStore, get_datastore

# Disable Altair's 5000-row limit at module level
alt.data_transformers.disable_max_rows()

router = APIRouter()


@router.get("/layered")
def layered(
    city: str = Query("London"),
    store: DataStore = Depends(get_datastore),
):
    """Layered chart: temperature range band + mean temp line per city."""
    df = store.weather[store.weather["city"] == city].copy()
    df["date"] = df["date"].astype(str)

    band = (
        alt.Chart(df)
        .mark_area(opacity=0.3, color="#3b82f6")
        .encode(
            x=alt.X("date:T", title="Date"),
            y=alt.Y("min_temp:Q", title="Temperature (°C)"),
            y2="max_temp:Q",
        )
    )
    line = (
        alt.Chart(df)
        .mark_line(color="#1d4ed8", strokeWidth=2)
        .encode(
            x="date:T",
            y=alt.Y("mean(max_temp):Q"),
            tooltip=["date:T", "max_temp:Q", "min_temp:Q"],
        )
    )
    chart = (band + line).properties(
        title=f"{city} — Daily Temperature Range",
        width=700, height=300,
    )
    return {"chart_json": chart.to_dict()}


@router.get("/faceted")
def faceted(store: DataStore = Depends(get_datastore)):
    """Faceted small multiples: one temp line per city."""
    df = store.weather.copy()
    df["date"] = df["date"].astype(str)

    chart = (
        alt.Chart(df)
        .mark_line(strokeWidth=1.5)
        .encode(
            x=alt.X("date:T", title="Date"),
            y=alt.Y("max_temp:Q", title="Max Temp (°C)"),
            color=alt.Color("city:N", legend=None),
            tooltip=["city:N", "date:T", "max_temp:Q"],
        )
        .facet(facet="city:N", columns=3)
        .properties(title="Max Temperature by City (Small Multiples)")
    )
    return {"chart_json": chart.to_dict()}


@router.get("/interactive-brush")
def interactive_brush(store: DataStore = Depends(get_datastore)):
    """Brush selection: select date range in overview, detail updates."""
    df = store.weather.copy()
    df["date"] = df["date"].astype(str)

    brush = alt.selection_interval(encodings=["x"])

    overview = (
        alt.Chart(df)
        .mark_line(strokeWidth=1)
        .encode(
            x=alt.X("date:T", title="Date"),
            y=alt.Y("max_temp:Q", title="Max Temp"),
            color=alt.Color("city:N"),
            opacity=alt.condition(brush, alt.value(1), alt.value(0.2)),
        )
        .add_params(brush)
        .properties(width=700, height=150, title="Overview — Drag to Select Date Range")
    )

    detail = (
        alt.Chart(df)
        .mark_line(strokeWidth=2)
        .encode(
            x=alt.X("date:T", title="Date"),
            y=alt.Y("max_temp:Q", title="Max Temp (°C)"),
            color=alt.Color("city:N", legend=alt.Legend(title="City")),
            tooltip=["city:N", "date:T", "max_temp:Q", "precipitation:Q"],
        )
        .transform_filter(brush)
        .properties(width=700, height=300, title="Detail View")
    )

    chart = alt.vconcat(overview, detail).properties(
        title="Interactive Brush: Temperature Trends"
    )
    return {"chart_json": chart.to_dict()}


@router.get("/cities")
def get_cities(store: DataStore = Depends(get_datastore)):
    return {"cities": sorted(store.weather["city"].unique().tolist())}


@router.get("/preview")
def preview(store: DataStore = Depends(get_datastore)):
    df = store.weather.copy()
    df["date"] = df["date"].astype(str)
    return df.head(100).to_dict(orient="records")
