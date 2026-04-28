from fastapi import APIRouter
from pydantic import BaseModel
from simulation import immune_system, ANTIBODIES, SIGNAL_DIMENSIONS, IMMUNE_THRESHOLD

router = APIRouter()


class ScanRequest(BaseModel):
    sensor_vector: list[float]


@router.get("/library")
def get_library():
    return {"antibodies": ANTIBODIES, "dimensions": SIGNAL_DIMENSIONS, "threshold": IMMUNE_THRESHOLD}


@router.post("/scan")
def scan(req: ScanRequest):
    result = immune_system.scan(req.sensor_vector)
    return result


@router.post("/random-scan")
def random_scan():
    import random
    vector = [round(max(0, min(1, 0.3 + random.random() * 0.6)), 2) for _ in range(7)]
    result = immune_system.scan(vector)
    result["embedding"] = vector
    return result
