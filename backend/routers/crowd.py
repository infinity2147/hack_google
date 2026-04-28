from fastapi import APIRouter, Query
from simulation import data_loader

router = APIRouter()


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
    items = df.iloc[start:start + page_size].to_dict(orient="records")
    return {"items": items, "total": total}


@router.get("/contributors")
def get_contributors():
    df = data_loader.contributors
    if df.empty:
        return []
    df = df.sort_values("impact_score", ascending=False).head(20)
    return df.to_dict(orient="records")


@router.get("/stats")
def get_stats():
    vn = data_loader.voice_notes
    if vn.empty:
        return {"totalReports": 0, "verifiedReports": 0, "verificationRate": 0, "activeContributors": 0, "avgCredibility": 0}
    total = len(vn)
    verified = int(vn["verified"].sum())
    cats = vn["category"].value_counts().to_dict()
    return {
        "totalReports": total,
        "verifiedReports": verified,
        "verificationRate": round(verified / total, 3) if total else 0,
        "activeContributors": len(data_loader.contributors),
        "avgCredibility": round(float(vn["credibility_score"].mean()), 3),
        "categoryBreakdown": cats,
    }
