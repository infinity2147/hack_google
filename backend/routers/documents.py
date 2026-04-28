from fastapi import APIRouter, Query
from simulation import data_loader
import numpy as np

router = APIRouter()


@router.get("")
def get_documents(
    status: str = Query(None),
    doc_type: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
):
    df = data_loader.documents
    if df.empty:
        return {"items": [], "total": 0, "page": page, "pageSize": page_size}
    if status:
        df = df[df["status"] == status]
    if doc_type:
        df = df[df["doc_type"].str.contains(doc_type, case=False)]
    if search:
        mask = df["supplier"].str.contains(search, case=False) | df["doc_id"].str.contains(search, case=False)
        df = df[mask]
    total = len(df)
    start = (page - 1) * page_size
    items = df.iloc[start:start + page_size].to_dict(orient="records")
    return {"items": items, "total": total, "page": page, "pageSize": page_size}


@router.get("/summary")
def get_summary():
    df = data_loader.documents
    if df.empty:
        return {"total": 0, "normal": 0, "review": 0, "alert": 0, "critical": 0, "avgAnomaly": 0, "totalValue": 0}
    status_counts = df["status"].value_counts().to_dict()
    return {
        "total": len(df),
        "normal": int(status_counts.get("normal", 0)),
        "review": int(status_counts.get("review", 0)),
        "alert": int(status_counts.get("alert", 0)),
        "critical": int(status_counts.get("critical", 0)),
        "avgAnomaly": round(float(df["anomaly_score"].mean()), 3),
        "totalValue": int(df["amount"].sum()),
    }


@router.get("/heatmap")
def get_heatmap():
    """Real anomaly heatmap: doc_type × hour-of-day from financial_documents.csv."""
    df = data_loader.documents
    if df.empty:
        return {"types": [], "hours": list(range(24)), "grid": []}

    df = df.copy()
    df["hour"] = pd.to_datetime(df["date"]).dt.hour
    df["is_anomaly"] = df["status"].isin(["alert", "critical"]).astype(int)

    types = sorted(df["doc_type"].unique())
    hours = list(range(24))
    grid = []
    for t in types:
        sub = df[df["doc_type"] == t]
        cells = []
        for h in hours:
            count = int(sub[sub["hour"] == h]["is_anomaly"].sum())
            cells.append(count)
        grid.append({"row": t, "cells": cells})

    return {"types": types, "hours": hours, "grid": grid}


import pandas as pd
