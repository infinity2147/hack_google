from fastapi import APIRouter, Query
from pydantic import BaseModel
from simulation import decision_log

router = APIRouter()


class LogDecisionRequest(BaseModel):
    action_type: str
    target: str
    details: dict = {}


@router.post("")
def log_decision(req: LogDecisionRequest):
    entry = decision_log.log(req.action_type, req.target, req.details)
    return entry


@router.get("")
def get_decisions(action_type: str = Query(None)):
    return decision_log.get_all(action_type)


@router.get("/summary")
def get_summary():
    return decision_log.summary()
