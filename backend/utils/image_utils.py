import base64
import io

import matplotlib
matplotlib.use("Agg")  # Must be set before any pyplot import
import matplotlib.pyplot as plt


def fig_to_base64(fig) -> dict:
    """Convert a matplotlib Figure to a base64-encoded PNG dict."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return {"image": encoded}


def apply_sample(df, sample: bool, n: int = 1000):
    """Return a random sample of n rows if sample=True, else the full dataframe."""
    if sample and len(df) > n:
        return df.sample(n, random_state=42)
    return df
