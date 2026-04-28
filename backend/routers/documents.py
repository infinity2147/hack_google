from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from simulation import data_loader
import pandas as pd
import json
import re

router = APIRouter()

DOC_MAP = {
    "doc_id": "id",
    "doc_type": "type",
    "anomaly_score": "anomalyScore",
    "payment_terms": "paymentTerms",
}

DOC_TYPE_MAP = {
    "Insurance Certificate": "insurance",
    "Bill of Lading": "bill_of_lading",
    "Customs Declaration": "customs_declaration",
    "Purchase Order": "purchase_order",
    "Invoice": "invoice",
    "Letter of Credit": "letter_of_credit",
    "Packing List": "packing_list",
}


def map_doc(row: dict) -> dict:
    out = {}
    for k, v in row.items():
        key = DOC_MAP.get(k, k)
        if hasattr(v, "item"):
            out[key] = v.item()
        else:
            out[key] = v
    # Parse signals from string to array
    if "signals" in out and isinstance(out["signals"], str):
        out["signals"] = [s.strip() for s in out["signals"].split(",") if s.strip()] if out["signals"] else []
    elif "signals" not in out or out.get("signals") is None:
        out["signals"] = []
    # Map doc_type to frontend-expected values
    if "type" in out and out["type"] in DOC_TYPE_MAP:
        pass  # keep original type from CSV, frontend can handle it
    # Add deviation field
    if "deviation" in out:
        out["deviationPct"] = round(float(out["deviation"]) * 100, 1) if out["deviation"] else 0
    return out


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
    items = [map_doc(r) for r in df.iloc[start:start + page_size].to_dict(orient="records")]
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
    """Real anomaly heatmap: doc_type x hour-of-day from financial_documents.csv."""
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


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Accept a document file and return extracted fields + anomaly score."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    filename = file.filename.lower()

    if "invoice" in filename:
        doc_type = "Invoice"
    elif "lading" in filename or "bol" in filename:
        doc_type = "Bill of Lading"
    elif "customs" in filename or "declaration" in filename:
        doc_type = "Customs Declaration"
    elif "purchase" in filename or "po" in filename or "order" in filename:
        doc_type = "Purchase Order"
    elif "packing" in filename:
        doc_type = "Packing List"
    elif "credit" in filename or "lc" in filename:
        doc_type = "Letter of Credit"
    else:
        doc_type = "Invoice"

    text = ""
    try:
        text = content.decode("utf-8", errors="ignore")
    except Exception:
        pass

    score = 0.15
    signals = []
    text_lower = text.lower()
    if any(w in text_lower for w in ["urgent", "overdue", "past due", "penalty"]):
        score += 0.2
        signals.append("Payment stress indicators detected")
    if any(w in text_lower for w in ["new entity", "intermediary", "third party", "agent"]):
        score += 0.15
        signals.append("New intermediary entities present")
    if any(w in text_lower for w in ["discrepancy", "mismatch", "error", "incorrect"]):
        score += 0.25
        signals.append("Document discrepancy flagged")
    if len(re.findall(r"\d{1,3}(?:,\d{3})*(?:\.\d{2})?", text)) > 20:
        score += 0.1
        signals.append("High numeric density — possible round-trip transaction")
    score = min(0.99, score)

    status = "critical" if score > 0.7 else "alert" if score > 0.4 else "review" if score > 0.2 else "normal"
    if not signals:
        signals = ["No anomalous signals detected"] if status == "normal" else ["Anomaly pattern detected"]

    return {
        "filename": file.filename,
        "docType": doc_type,
        "anomalyScore": round(score, 3),
        "status": status,
        "signals": signals,
        "size": len(content),
        "processed": True,
    }