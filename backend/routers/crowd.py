from fastapi import APIRouter, Query
from simulation import data_loader

router = APIRouter()

VOICE_NOTE_MAP = {
    "note_id": "id",
    "contributor_id": "contributorId",
    "location_name": "locationName",
    "node_id": "nodeId",
    "lon": "lng",
    "duration_sec": "durationSec",
    "credibility_score": "credibilityScore",
    "nearby_reports": "nearbyReports",
}

CONTRIBUTOR_MAP = {
    "contributor_id": "id",
    "join_date": "joinDate",
    "total_reports": "reports",
    "verified_reports": "verified",
    "primary_language": "primaryLanguage",
    "credibility_score": "credibility",
    "impact_score": "impact",
}


def map_row(row: dict, mapping: dict) -> dict:
    out = {}
    for k, v in row.items():
        key = mapping.get(k, k)
        if hasattr(v, "item"):
            out[key] = v.item()
        else:
            out[key] = v
    return out


@router.get("/voice-notes")
def get_voice_notes(
    category: str = Query(None),
    verified: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    df = data_loader.voice_notes
    if df.empty:
        return {"items": [], "total": 0}
    if category and category != "all":
        df = df[df["category"] == category]
    if verified == "verified":
        df = df[df["verified"] == True]
    elif verified == "unverified":
        df = df[df["verified"] == False]
    total = len(df)
    start = (page - 1) * page_size
    items = [map_row(r, VOICE_NOTE_MAP) for r in df.iloc[start:start + page_size].to_dict(orient="records")]
    return {"items": items, "total": total}


@router.get("/contributors")
def get_contributors():
    df = data_loader.contributors
    if df.empty:
        return []
    df = df.sort_values("impact_score", ascending=False).head(20)
    return [map_row(r, CONTRIBUTOR_MAP) for r in df.to_dict(orient="records")]


@router.get("/stats")
def get_stats():
    vn = data_loader.voice_notes
    if vn.empty:
        return {"totalReports": 0, "verifiedReports": 0, "verificationRate": 0, "activeContributors": 0, "avgCredibility": 0, "networkValue": 847}
    total = len(vn)
    verified = int(vn["verified"].sum())
    cats = {k: int(v) for k, v in vn["category"].value_counts().to_dict().items()}
    return {
        "totalReports": total,
        "verifiedReports": verified,
        "verificationRate": round(verified / total, 3) if total else 0,
        "activeContributors": len(data_loader.contributors),
        "avgCredibility": round(float(vn["credibility_score"].mean()), 3),
        "networkValue": 847,
        "categoryBreakdown": cats,
    }
