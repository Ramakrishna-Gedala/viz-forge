import matplotlib.pyplot as plt
import seaborn as sns
from fastapi import APIRouter, Depends, Query

from utils.datastore import DataStore, get_datastore
from utils.image_utils import apply_sample, fig_to_base64

router = APIRouter()


@router.get("/heatmap")
def heatmap(store: DataStore = Depends(get_datastore)):
    """Correlation heatmap across numerical employee features."""
    df = store.employees[["age", "salary", "performance_score", "years_at_company"]]
    corr = df.corr()

    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdYlGn", ax=ax,
                square=True, linewidths=0.5, cbar_kws={"shrink": 0.8})
    ax.set_title("Employee Metrics — Correlation Heatmap", fontsize=13, fontweight="bold")
    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/boxplot")
def boxplot(store: DataStore = Depends(get_datastore)):
    """Salary distribution by department as a boxplot."""
    df = store.employees.copy()
    order = df.groupby("department")["salary"].median().sort_values().index.tolist()

    fig, ax = plt.subplots(figsize=(12, 6))
    sns.boxplot(data=df, x="department", y="salary", order=order,
                palette="Set2", ax=ax)
    ax.set_title("Salary Distribution by Department", fontsize=13, fontweight="bold")
    ax.set_xlabel("Department")
    ax.set_ylabel("Annual Salary ($)")
    ax.tick_params(axis="x", rotation=30)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/pairplot")
def pairplot(store: DataStore = Depends(get_datastore)):
    """Multi-variable pairplot (sampled to 500 rows for performance)."""
    df = store.employees[["age", "salary", "performance_score", "years_at_company", "attrition"]]
    df = df.sample(min(500, len(df)), random_state=42)

    grid = sns.pairplot(df, hue="attrition", plot_kws={"alpha": 0.5, "s": 15},
                        palette={"Yes": "#ef4444", "No": "#3b82f6"})
    grid.figure.suptitle("Employee Metrics — Pairplot", y=1.02, fontsize=13, fontweight="bold")
    return fig_to_base64(grid.figure)


@router.get("/violin")
def violin(store: DataStore = Depends(get_datastore)):
    """Performance score distribution by attrition status."""
    df = store.employees.copy()

    fig, ax = plt.subplots(figsize=(9, 6))
    sns.violinplot(data=df, x="attrition", y="performance_score",
                   palette={"Yes": "#ef4444", "No": "#3b82f6"}, ax=ax,
                   inner="quartile")
    ax.set_title("Performance Score by Attrition Status", fontsize=13, fontweight="bold")
    ax.set_xlabel("Attrition")
    ax.set_ylabel("Performance Score")
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    return fig_to_base64(fig)


@router.get("/stats")
def stats(store: DataStore = Depends(get_datastore)):
    """Summary stats cards for the HR section."""
    df = store.employees
    return {
        "headcount": len(df),
        "avg_salary": round(df["salary"].mean(), 2),
        "attrition_rate": round((df["attrition"] == "Yes").mean() * 100, 1),
        "avg_performance": round(df["performance_score"].mean(), 2),
        "departments": df["department"].nunique(),
    }


@router.get("/preview")
def preview(store: DataStore = Depends(get_datastore)):
    return store.employees.head(100).to_dict(orient="records")
