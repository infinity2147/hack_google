from fastapi import APIRouter, Query
from simulation import data_loader
import pandas as pd

router = APIRouter()

DISRUPTION_MAP = {
    "event_id": "id",
    "port_name": "location",
    "disruption_type": "type",
    "economic_loss_usd": "economicLossUSD",
    "r_number": "peakR0",
    "recovery_hours": "recoveryHours",
    "duration_hours": "durationHours",
    "affected_shipments": "affectedShipments",
    "cascade_nodes": "cascadeHops",
    "antibody_match": "antibodyMatch",
    "detection_method": "detectionMethod",
}


def map_disruption(row: dict) -> dict:
    out = {}
    for k, v in row.items():
        key = DISRUPTION_MAP.get(k, k)
        if hasattr(v, "item"):
            out[key] = v.item()
        else:
            out[key] = v
    # Compute durationDays from duration_hours if available
    if "durationHours" in out and out["durationHours"]:
        out["durationDays"] = round(float(out["durationHours"]) / 24, 1)
    elif "recoveryHours" in out and out["recoveryHours"]:
        out["durationDays"] = round(float(out["recoveryHours"]) / 24, 1)
    else:
        out["durationDays"] = 0
    # cascadeHops from cascade_nodes
    if "cascadeHops" in out:
        try:
            out["cascadeHops"] = int(out["cascadeHops"])
        except (ValueError, TypeError):
            out["cascadeHops"] = 0
    return out


@router.get("")
def get_disruptions(
    disruption_type: str = Query(None),
    min_r0: float = Query(0),
):
    df = data_loader.disruptions
    if df.empty:
        return []
    if disruption_type and disruption_type != "All":
        df = df[df["disruption_type"] == disruption_type]
    if min_r0 > 0:
        df = df[df["r_number"] >= min_r0]
    return [map_disruption(r) for r in df.to_dict(orient="records")]


@router.get("/health-trend")
def get_health_trend():
    """Compute 30-day health trend from disruption events."""
    df = data_loader.disruptions
    if df.empty:
        return []
    df = df.copy()
    df["date"] = pd.to_datetime(df["timestamp"]).dt.date
    end = pd.Timestamp.now().date()
    dates = [end - pd.Timedelta(days=i) for i in range(29, -1, -1)]
    result = []
    for d in dates:
        day_events = df[df["date"] == d]
        count = len(day_events)
        avg_sev = float(day_events["severity"].mean()) if count > 0 else 0.05
        total_loss = int(day_events["economic_loss_usd"].sum()) if count > 0 else 0
        health = max(50, min(100, 100 - count * 5 - avg_sev * 20))
        result.append({
            "date": str(d), "healthScore": round(health, 1),
            "eventCount": count, "avgSeverity": round(avg_sev, 3), "totalLoss": total_loss,
        })
    return result


@router.get("/most-disrupted")
def get_most_disrupted():
    df = data_loader.disruptions
    if df.empty:
        return []
    agg = df.groupby("port_name").agg(
        events=("event_id", "count"),
        loss=("economic_loss_usd", "sum"),
        recovery=("recovery_hours", "mean"),
    ).sort_values("events", ascending=False).head(10).reset_index()
    items = []
    for _, row in agg.iterrows():
        items.append({
            "port": row["port_name"],
            "events": int(row["events"]),
            "loss": int(row["loss"]),
            "recovery": round(float(row["recovery"]) / 24, 1),
        })
    return items


@router.get("/fastest-recovery")
def get_fastest_recovery():
    df = data_loader.disruptions
    if df.empty:
        return []
    agg = df.groupby("port_name").agg(
        events=("event_id", "count"),
        loss=("economic_loss_usd", "sum"),
        recovery=("recovery_hours", "mean"),
    ).sort_values("recovery").head(10).reset_index()
    items = []
    for _, row in agg.iterrows():
        items.append({
            "port": row["port_name"],
            "events": int(row["events"]),
            "loss": int(row["loss"]),
            "recovery": round(float(row["recovery"]) / 24, 1),
        })
    return items
