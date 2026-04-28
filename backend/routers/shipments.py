from fastapi import APIRouter, Query
from simulation import data_loader

router = APIRouter()


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
    items = df.iloc[start:start + page_size].to_dict(orient="records")
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
