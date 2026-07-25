import os
from datetime import timedelta

import pandas as pd
import plotly.express as px
import streamlit as st
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

st.set_page_config(page_title="Расходы — дашборд", layout="wide")


@st.cache_resource
def get_engine():
    return create_engine(DATABASE_URL, pool_pre_ping=True)


@st.cache_data(ttl=60)
def load_expenses() -> pd.DataFrame:
    query = """
        select item, amount, currency, category, expense_date, created_at
        from expenses
        order by expense_date
    """
    df = pd.read_sql(query, get_engine())
    df["expense_date"] = pd.to_datetime(df["expense_date"])
    return df


st.title("Расходы")

col_title, col_refresh = st.columns([5, 1])
with col_refresh:
    if st.button("Обновить данные"):
        load_expenses.clear()

df = load_expenses()

if df.empty:
    st.info("В базе пока нет записей.")
    st.stop()

min_date = df["expense_date"].min().date()
max_date = df["expense_date"].max().date()
all_categories = sorted(df["category"].dropna().unique())
all_currencies = sorted(df["currency"].dropna().unique())

with st.sidebar:
    st.header("Фильтры")

    date_range = st.date_input(
        "Период",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date,
    )
    if isinstance(date_range, tuple) and len(date_range) == 2:
        start_date, end_date = date_range
    else:
        start_date, end_date = min_date, max_date

    selected_categories = st.multiselect(
        "Категории", options=all_categories, default=all_categories
    )
    selected_currencies = st.multiselect(
        "Валюта", options=all_currencies, default=all_currencies
    )
    granularity = st.radio("Группировка по времени", ["День", "Неделя", "Месяц"], index=1)

mask = (
    (df["expense_date"].dt.date >= start_date)
    & (df["expense_date"].dt.date <= end_date)
    & (df["category"].isin(selected_categories))
    & (df["currency"].isin(selected_currencies))
)
filtered = df.loc[mask].copy()

if filtered.empty:
    st.warning("Нет записей под выбранные фильтры.")
    st.stop()

st.subheader("Итого за период")
kpi_cols = st.columns(len(selected_currencies) or 1)
for col, currency in zip(kpi_cols, sorted(filtered["currency"].unique())):
    total = filtered.loc[filtered["currency"] == currency, "amount"].sum()
    col.metric(currency, f"{total:,.0f}".replace(",", " "))

st.subheader("По категориям")
by_category = (
    filtered.groupby(["category", "currency"], as_index=False)["amount"].sum()
    .sort_values("amount", ascending=False)
)
fig_category = px.bar(
    by_category,
    x="category",
    y="amount",
    color="currency",
    barmode="group",
    labels={"category": "Категория", "amount": "Сумма", "currency": "Валюта"},
)
fig_category.update_layout(legend_title_text="Валюта")
st.plotly_chart(fig_category, use_container_width=True)

st.subheader("Динамика по времени")
freq_map = {"День": "D", "Неделя": "W", "Месяц": "M"}
by_time = (
    filtered.set_index("expense_date")
    .groupby([pd.Grouper(freq=freq_map[granularity]), "currency"])["amount"]
    .sum()
    .reset_index()
)
fig_time = px.line(
    by_time,
    x="expense_date",
    y="amount",
    color="currency",
    markers=True,
    labels={"expense_date": "Дата", "amount": "Сумма", "currency": "Валюта"},
)
st.plotly_chart(fig_time, use_container_width=True)

with st.expander(f"Таблица записей ({len(filtered)})"):
    st.dataframe(
        filtered.sort_values("expense_date", ascending=False)[
            ["expense_date", "item", "amount", "currency", "category"]
        ],
        use_container_width=True,
        hide_index=True,
    )
