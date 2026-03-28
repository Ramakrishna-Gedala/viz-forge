import numpy as np
from fastapi import APIRouter, Depends, Query

from utils.datastore import DataStore, get_datastore
from utils.image_utils import apply_sample

router = APIRouter()


@router.get("/statistics")
def statistics(
    sample: bool = Query(False),
    store: DataStore = Depends(get_datastore),
):
    """Mean, std, variance, percentiles for each numeric stock column."""
    df = apply_sample(store.stocks, sample)[["open", "high", "low", "close", "volume"]]
    result = {}
    for col in df.columns:
        arr = df[col].dropna().to_numpy()
        result[col] = {
            "mean": round(float(np.mean(arr)), 4),
            "std": round(float(np.std(arr)), 4),
            "variance": round(float(np.var(arr)), 4),
            "min": round(float(np.min(arr)), 4),
            "max": round(float(np.max(arr)), 4),
            "p25": round(float(np.percentile(arr, 25)), 4),
            "p50": round(float(np.percentile(arr, 50)), 4),
            "p75": round(float(np.percentile(arr, 75)), 4),
        }
    return {"statistics": result, "row_count": len(df)}


@router.get("/moving-average")
def moving_average(
    ticker: str = Query("AAPL"),
    window: int = Query(30, ge=2, le=200),
    store: DataStore = Depends(get_datastore),
):
    """N-day moving average using np.convolve."""
    df = store.stocks[store.stocks["ticker"] == ticker.upper()].sort_values("date")
    close = df["close"].to_numpy()
    dates = df["date"].astype(str).tolist()

    kernel = np.ones(window) / window
    ma = np.convolve(close, kernel, mode="valid")
    # Align dates with the valid convolution output
    aligned_dates = dates[window - 1:]

    return {
        "ticker": ticker.upper(),
        "window": window,
        "raw": [{"date": d, "close": round(float(c), 2)} for d, c in zip(dates, close)],
        "moving_average": [{"date": d, "ma": round(float(v), 2)} for d, v in zip(aligned_dates, ma)],
    }


@router.get("/correlation-matrix")
def correlation_matrix(store: DataStore = Depends(get_datastore)):
    """NumPy correlation matrix across sensor numerical columns."""
    df = store.sensors[["temperature", "vibration", "pressure"]].dropna()
    arr = df.to_numpy().T  # shape: (3, n)
    corr = np.corrcoef(arr)
    cols = ["temperature", "vibration", "pressure"]
    matrix = [
        {cols[i]: round(float(corr[i][j]), 4) for j in range(len(cols))}
        for i in range(len(cols))
    ]
    return {"columns": cols, "matrix": matrix}


@router.get("/fft")
def fft(
    machine_id: str = Query("M001"),
    store: DataStore = Depends(get_datastore),
):
    """Fast Fourier Transform on sensor temperature data to detect frequency anomalies."""
    df = store.sensors[store.sensors["machine_id"] == machine_id].sort_values("timestamp")
    signal = df["temperature"].to_numpy()

    # Compute FFT
    n = len(signal)
    fft_vals = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(n, d=10.0)  # d=10 seconds sampling interval
    amplitudes = np.abs(fft_vals)

    # Return top frequencies (skip DC component at index 0)
    top_n = 200
    freqs_list = freqs[1:top_n + 1].tolist()
    amp_list = amplitudes[1:top_n + 1].tolist()
    signal_sample = signal[:500].tolist()

    return {
        "machine_id": machine_id,
        "sample_count": n,
        "frequencies": [round(f, 6) for f in freqs_list],
        "amplitudes": [round(a, 4) for a in amp_list],
        "raw_signal_sample": [round(float(v), 2) for v in signal_sample],
    }


@router.get("/preview")
def preview(store: DataStore = Depends(get_datastore)):
    return store.stocks.head(100).to_dict(orient="records")
