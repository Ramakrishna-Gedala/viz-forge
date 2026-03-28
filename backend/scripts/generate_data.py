"""
Data generation script for the Data Processing Learning Platform.
Run once: python backend/scripts/generate_data.py
Generates all 7 CSV files into backend/data/
"""
import math
import random
import uuid
from pathlib import Path

import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
random.seed(42)

OUT = Path(__file__).parent.parent / "data"
OUT.mkdir(exist_ok=True)


# ─── 1. sales_data.csv ────────────────────────────────────────────────────────
print("Generating sales_data.csv ...")
dates = pd.date_range("2022-01-01", "2024-12-31", freq="D")
regions = ["North", "South", "East", "West", "Central"]
products = {
    "Widget A": 29.99,
    "Widget B": 49.99,
    "Gadget Pro": 99.99,
    "Gadget Lite": 59.99,
    "Service Pack": 149.99,
    "Bundle Deal": 79.99,
}
rows = []
for date in dates:
    seasonal = 1 + 0.3 * math.sin((date.month - 3) * math.pi / 6)
    for region in regions:
        for product, price in products.items():
            units = max(1, int(rng.normal(50 * seasonal, 15)))
            rows.append([date.date(), region, product, units, round(units * price, 2)])

sales_df = pd.DataFrame(rows, columns=["date", "region", "product", "units_sold", "revenue"])
sales_df.to_csv(OUT / "sales_data.csv", index=False)
print(f"  -> {len(sales_df):,} rows")


# ─── 2. employee_data.csv ─────────────────────────────────────────────────────
print("Generating employee_data.csv ...")
n = 1000
departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Legal", "Support"]
dept_salary_base = {
    "Engineering": 95000, "Sales": 72000, "Marketing": 68000, "HR": 62000,
    "Finance": 85000, "Operations": 65000, "Legal": 90000, "Support": 52000,
}

emp_depts = rng.choice(departments, n)
emp_years = rng.integers(0, 31, n)
emp_ages = np.clip(rng.integers(22, 66, n), 22, 65)
emp_salaries = np.array([
    round(dept_salary_base[d] * (1 + 0.02 * y) + rng.normal(0, 5000), 2)
    for d, y in zip(emp_depts, emp_years)
])
emp_perf = np.round(np.clip(rng.normal(3.5, 0.7, n), 1.0, 5.0), 1)
emp_attrition = (rng.uniform(0, 1, n) < 0.15).astype(str)
emp_attrition = np.where(emp_attrition == "True", "Yes", "No")

employees_df = pd.DataFrame({
    "employee_id": [f"EMP{str(i+1).zfill(4)}" for i in range(n)],
    "age": emp_ages,
    "department": emp_depts,
    "salary": emp_salaries,
    "performance_score": emp_perf,
    "attrition": emp_attrition,
    "years_at_company": emp_years,
})
employees_df.to_csv(OUT / "employee_data.csv", index=False)
print(f"  -> {len(employees_df):,} rows")


# ─── 3. stock_prices.csv ──────────────────────────────────────────────────────
print("Generating stock_prices.csv ...")
params = {
    "AAPL":  (180, 0.0003, 0.018),
    "MSFT":  (350, 0.0002, 0.016),
    "GOOGL": (140, 0.0002, 0.019),
    "AMZN":  (170, 0.0003, 0.021),
    "TSLA":  (250, 0.0001, 0.035),
}
trading_days = pd.bdate_range("2023-01-01", periods=500)
stock_rows = []
for ticker, (s0, mu, sigma) in params.items():
    price = s0
    for d in trading_days:
        ret = mu + sigma * rng.standard_normal()
        close = round(price * math.exp(ret), 2)
        high = round(close * (1 + abs(float(rng.normal(0, 0.005)))), 2)
        low = round(close * (1 - abs(float(rng.normal(0, 0.005)))), 2)
        open_ = round(price * (1 + float(rng.normal(0, 0.003))), 2)
        vol = int(rng.integers(1_000_000, 50_000_000))
        stock_rows.append([d.date(), ticker, open_, high, low, close, vol])
        price = close

stocks_df = pd.DataFrame(stock_rows, columns=["date", "ticker", "open", "high", "low", "close", "volume"])
stocks_df.to_csv(OUT / "stock_prices.csv", index=False)
print(f"  -> {len(stocks_df):,} rows")


# ─── 4. ecommerce_orders.csv ──────────────────────────────────────────────────
print("Generating ecommerce_orders.csv ...")
n = 10_000
categories = ["Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys", "Beauty", "Automotive"]
countries = ["US", "UK", "DE", "FR", "CA", "AU", "IN", "JP", "BR", "MX", "IT", "ES", "NL", "SE", "SG"]
base_ts = pd.Timestamp("2023-01-01").timestamp()
span_ts = pd.Timestamp("2024-12-31").timestamp() - base_ts

order_dates = pd.to_datetime(base_ts + rng.uniform(0, span_ts, n), unit="s").normalize()
ecom_df = pd.DataFrame({
    "order_id": [f"ORD{str(i+1).zfill(6)}" for i in range(n)],
    "customer_id": rng.integers(1, 501, n),
    "category": rng.choice(categories, n),
    "order_date": order_dates.date,
    "quantity": rng.integers(1, 11, n),
    "price": np.round(rng.uniform(5.99, 499.99, n), 2),
    "discount": np.round(rng.uniform(0, 0.4, n), 2),
    "country": rng.choice(countries, n),
})
ecom_df.to_csv(OUT / "ecommerce_orders.csv", index=False)
print(f"  -> {len(ecom_df):,} rows")


# ─── 5. sensor_data.csv ───────────────────────────────────────────────────────
print("Generating sensor_data.csv ...")
n = 50_000
machines = [f"M{str(i+1).zfill(3)}" for i in range(10)]
timestamps = pd.date_range("2024-01-01", periods=n, freq="10s")
machine_ids = np.array([machines[i % 10] for i in range(n)])

temp_base = rng.uniform(65, 85, n)
vibration = np.round(rng.uniform(0.1, 3.0, n), 3)
pressure = np.round(rng.uniform(2.0, 8.0, n), 3)

# Inject fault spikes (~0.2% of rows)
spike_idx = rng.choice(n, size=int(n * 0.002), replace=False)
temp_base[spike_idx] += rng.uniform(20, 40, len(spike_idx))
vibration[spike_idx] += rng.uniform(3, 7, len(spike_idx))

temp_base = np.round(temp_base, 2)
status = np.where(
    temp_base > 110, "critical",
    np.where(temp_base > 95, "warning", "normal")
)

sensor_df = pd.DataFrame({
    "timestamp": timestamps,
    "machine_id": machine_ids,
    "temperature": temp_base,
    "vibration": vibration,
    "pressure": pressure,
    "status": status,
})
sensor_df.to_csv(OUT / "sensor_data.csv", index=False)
print(f"  -> {len(sensor_df):,} rows")


# ─── 6. weather_data.csv ──────────────────────────────────────────────────────
print("Generating weather_data.csv ...")
cities = {
    "Mumbai":   {"base_max": 33, "base_min": 24, "amplitude": 5,  "phase": 0},
    "London":   {"base_max": 14, "base_min": 7,  "amplitude": 9,  "phase": 3},
    "New York": {"base_max": 16, "base_min": 8,  "amplitude": 12, "phase": 3},
    "Tokyo":    {"base_max": 19, "base_min": 11, "amplitude": 11, "phase": 2},
    "Sydney":   {"base_max": 21, "base_min": 13, "amplitude": 7,  "phase": 9},
}
weather_dates = pd.date_range("2022-01-01", "2024-12-31", freq="D")
weather_rows = []
for date in weather_dates:
    for city, cfg in cities.items():
        seasonal = math.sin((date.month - cfg["phase"]) * math.pi / 6)
        max_t = round(cfg["base_max"] + cfg["amplitude"] * seasonal + float(rng.normal(0, 1.5)), 1)
        min_t = round(cfg["base_min"] + cfg["amplitude"] * seasonal + float(rng.normal(0, 1.5)), 1)
        # Ensure min < max
        if min_t >= max_t:
            min_t = max_t - 2
        precip = round(max(0, float(rng.exponential(3))), 1)
        humidity = int(np.clip(rng.integers(40, 90), 30, 95))
        wind = round(max(0, float(rng.normal(20, 10))), 1)
        weather_rows.append([date.date(), city, max_t, min_t, precip, humidity, wind])

weather_df = pd.DataFrame(
    weather_rows,
    columns=["date", "city", "max_temp", "min_temp", "precipitation", "humidity", "wind_speed"]
)
weather_df.to_csv(OUT / "weather_data.csv", index=False)
print(f"  -> {len(weather_df):,} rows")


# ─── 7. transactions.csv ──────────────────────────────────────────────────────
print("Generating transactions.csv ...")
n = 150_000
tx_categories = ["Food", "Electronics", "Clothing", "Furniture", "Books",
                 "Sports", "Health", "Beauty", "Automotive", "Toys"]
payment_methods = ["cash", "card", "wallet", "upi"]

base_ts = pd.Timestamp("2023-01-01").timestamp()
span_ts = pd.Timestamp("2024-12-31").timestamp() - base_ts
tx_timestamps = pd.to_datetime(base_ts + rng.uniform(0, span_ts, n), unit="s")

tx_df = pd.DataFrame({
    "transaction_id": [f"TXN{str(i+1).zfill(7)}" for i in range(n)],
    "store_id": rng.integers(1, 51, n),
    "product_id": rng.integers(1, 201, n),
    "category": rng.choice(tx_categories, n),
    "amount": np.round(rng.uniform(1.0, 500.0, n), 2),
    "timestamp": tx_timestamps,
    "payment_method": rng.choice(payment_methods, n),
})
tx_df.to_csv(OUT / "transactions.csv", index=False)
print(f"  -> {len(tx_df):,} rows")


print("\nAll CSV files generated successfully in backend/data/")
