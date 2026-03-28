from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).parent.parent / "data"

_store = None


@dataclass
class DataStore:
    sales: pd.DataFrame = field(default_factory=pd.DataFrame)
    employees: pd.DataFrame = field(default_factory=pd.DataFrame)
    stocks: pd.DataFrame = field(default_factory=pd.DataFrame)
    ecommerce: pd.DataFrame = field(default_factory=pd.DataFrame)
    sensors: pd.DataFrame = field(default_factory=pd.DataFrame)
    weather: pd.DataFrame = field(default_factory=pd.DataFrame)
    transactions: pd.DataFrame = field(default_factory=pd.DataFrame)


def load_all_csvs() -> DataStore:
    print("Loading CSV files...")
    store = DataStore(
        sales=pd.read_csv(DATA_DIR / "sales_data.csv", parse_dates=["date"]),
        employees=pd.read_csv(DATA_DIR / "employee_data.csv"),
        stocks=pd.read_csv(DATA_DIR / "stock_prices.csv", parse_dates=["date"]),
        ecommerce=pd.read_csv(DATA_DIR / "ecommerce_orders.csv", parse_dates=["order_date"]),
        sensors=pd.read_csv(DATA_DIR / "sensor_data.csv", parse_dates=["timestamp"]),
        weather=pd.read_csv(DATA_DIR / "weather_data.csv", parse_dates=["date"]),
        transactions=pd.read_csv(DATA_DIR / "transactions.csv", parse_dates=["timestamp"]),
    )
    print(f"  sales:        {len(store.sales):,} rows")
    print(f"  employees:    {len(store.employees):,} rows")
    print(f"  stocks:       {len(store.stocks):,} rows")
    print(f"  ecommerce:    {len(store.ecommerce):,} rows")
    print(f"  sensors:      {len(store.sensors):,} rows")
    print(f"  weather:      {len(store.weather):,} rows")
    print(f"  transactions: {len(store.transactions):,} rows")
    return store


def get_datastore() -> DataStore:
    """FastAPI dependency — returns the shared DataStore singleton."""
    return _store
