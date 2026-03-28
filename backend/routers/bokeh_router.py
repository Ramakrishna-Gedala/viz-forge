import asyncio
import json
import math

import pandas as pd
from bokeh.embed import file_html
from bokeh.layouts import column, gridplot
from bokeh.models import ColumnDataSource, DataTable, TableColumn, BoxSelectTool, HoverTool
from bokeh.plotting import figure
from bokeh.resources import CDN
from bokeh.io import reset_output
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from utils.datastore import DataStore, get_datastore

router = APIRouter()

STATUS_COLORS = {"normal": "#10b981", "warning": "#f59e0b", "critical": "#ef4444"}


@router.get("/dashboard")
def dashboard(
    machine_id: str = Query(None),
    store: DataStore = Depends(get_datastore),
):
    """Multi-widget Bokeh dashboard: temperature line, vibration bar, data table."""
    reset_output()
    df = store.sensors.copy()
    if machine_id:
        df = df[df["machine_id"] == machine_id]
    # Use last 500 points for the dashboard
    df = df.sort_values("timestamp").tail(500)
    df["ts_str"] = df["timestamp"].dt.strftime("%H:%M:%S")
    df["color"] = df["status"].map(STATUS_COLORS)

    source = ColumnDataSource(df)

    # Temperature line chart
    p1 = figure(title="Temperature Over Time", height=250, width=700,
                x_range=df["ts_str"].tolist(), toolbar_location="above")
    p1.line("ts_str", "temperature", source=source, line_color="#3b82f6", line_width=2)
    p1.xaxis.major_label_orientation = math.pi / 3
    p1.xaxis.major_label_overrides = {k: "" for k in df["ts_str"][::10].tolist()}

    # Vibration bar chart (sampled every 5th point)
    df_bar = df.iloc[::5]
    src_bar = ColumnDataSource(df_bar)
    p2 = figure(title="Vibration Levels", height=250, width=700,
                x_range=df_bar["ts_str"].tolist(), toolbar_location=None)
    p2.vbar(x="ts_str", top="vibration", source=src_bar, width=0.9,
            color="color", alpha=0.8)
    p2.xaxis.major_label_orientation = math.pi / 3

    # Data table
    columns = [
        TableColumn(field="ts_str",     title="Time"),
        TableColumn(field="machine_id", title="Machine"),
        TableColumn(field="temperature", title="Temp (°C)"),
        TableColumn(field="vibration",  title="Vibration"),
        TableColumn(field="pressure",   title="Pressure"),
        TableColumn(field="status",     title="Status"),
    ]
    data_table = DataTable(source=source, columns=columns, height=200, width=700)

    layout = column(p1, p2, data_table)
    html = file_html(layout, CDN, "Sensor Dashboard")
    return {"html": html}


@router.get("/streaming")
async def streaming(store: DataStore = Depends(get_datastore)):
    """SSE endpoint streaming sensor data in 200-row chunks."""
    df = store.sensors.sort_values("timestamp").copy()
    df["timestamp"] = df["timestamp"].astype(str)
    chunks = [df.iloc[i:i + 200] for i in range(0, len(df), 200)]

    async def generator():
        for chunk in chunks:
            payload = chunk.to_dict(orient="records")
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.3)
        yield "data: {\"done\": true}\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/linked-brushing")
def linked_brushing(store: DataStore = Depends(get_datastore)):
    """Two linked charts: select range in one, other updates."""
    reset_output()
    df = store.sensors.copy()
    df = df.sample(min(1000, len(df)), random_state=42).sort_values("timestamp")
    df["ts_str"] = df["timestamp"].dt.strftime("%Y-%m-%d %H:%M")
    df["color"] = df["status"].map(STATUS_COLORS)

    source = ColumnDataSource(df)

    select_tool = BoxSelectTool()
    hover = HoverTool(tooltips=[("Machine", "@machine_id"), ("Temp", "@temperature"), ("Status", "@status")])

    p1 = figure(title="Temperature vs Vibration (select to filter)", height=300, width=600,
                tools=[select_tool, hover, "pan", "wheel_zoom", "reset"])
    p1.circle("temperature", "vibration", source=source, size=6,
              color="color", alpha=0.6, nonselection_alpha=0.1)
    p1.xaxis.axis_label = "Temperature"
    p1.yaxis.axis_label = "Vibration"

    p2 = figure(title="Pressure vs Temperature", height=300, width=600,
                tools=["pan", "wheel_zoom", "reset"])
    p2.circle("pressure", "temperature", source=source, size=6,
              color="color", alpha=0.6, nonselection_alpha=0.1)
    p2.xaxis.axis_label = "Pressure"
    p2.yaxis.axis_label = "Temperature"

    layout = gridplot([[p1, p2]])
    html = file_html(layout, CDN, "Linked Brushing")
    return {"html": html}


@router.get("/machines")
def get_machines(store: DataStore = Depends(get_datastore)):
    return {"machines": sorted(store.sensors["machine_id"].unique().tolist())}


@router.get("/preview")
def preview(store: DataStore = Depends(get_datastore)):
    df = store.sensors.copy()
    df["timestamp"] = df["timestamp"].astype(str)
    return df.head(100).to_dict(orient="records")
