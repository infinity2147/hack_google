from fastapi import APIRouter, Query
from simulation import data_loader

router = APIRouter()

SHIPMENT_MAP = {
    "shipment_id": "id",
    "booking_date": "bookingDate",
    "transit_days_planned": "transitDaysPlanned",
    "transit_days_actual": "transitDaysActual",
    "delay_days": "delayDays",
    "origin_id": "originId",
    "origin_name": "originName",
    "dest_id": "destId",
    "dest_name": "destName",
    "total_cost_usd": "costUSD",
    "risk_score": "riskScore",
    "disruption_flag": "disruptionFlag",
    "transport_mode": "transportMode",
}


def map_shipment(row: dict) -> dict:
    out = {}
    for k, v in row.items():
        key = SHIPMENT_MAP.get(k, k)
        if isinstance(v, bool):
            out[key] = v
        elif hasattr(v, "item"):
            out[key] = v.item()
        else:
            out[key] = v
    # Ensure disruptionFlag is boolean
    out["disruptionFlag"] = bool(out.get("disruptionFlag", 0))
    return out


@router.get("")
def get_shipments(
    status: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    df = data_loader.shipments
    if df.empty:
        return {"items": [], "total": 0}
    if status and status != "all":
        df = df[df["status"] == status]
    if search:
        mask = (
            df["shipment_id"].str.contains(search, case=False) |
            df["origin_name"].str.contains(search, case=False) |
            df["dest_name"].str.contains(search, case=False)
        )
        df = df[mask]
    total = len(df)
    start = (page - 1) * page_size
    items = [map_shipment(r) for r in df.iloc[start:start + page_size].to_dict(orient="records")]
    return {"items": items, "total": total}


@router.get("/stats")
def get_stats():
    df = data_loader.shipments
    if df.empty:
        return {"total": 0, "inTransit": 0, "delayed": 0, "disrupted": 0, "onTimeRate": 0}
    status_counts = df["status"].value_counts().to_dict()
    total = len(df)
    delayed = int(status_counts.get("delayed", 0))
    return {
        "total": total,
        "inTransit": int(status_counts.get("in_transit", 0)),
        "delayed": delayed,
        "disrupted": int(status_counts.get("disrupted", 0)),
        "delivered": int(status_counts.get("delivered", 0)),
        "onTimeRate": round((1 - delayed / total) * 100, 1) if total else 0,
    }
