from fastapi import APIRouter
from pydantic import BaseModel
from simulation import route_market, CARRIERS, sir_model

router = APIRouter()


class NegotiateRequest(BaseModel):
    origin: str = "IN-JNPT"
    destination: str = "NL-RTM"
    urgency: float = 0.7


@router.post("/negotiate")
def negotiate(req: NegotiateRequest):
    state = dict(sir_model.nodes)
    state["_R0"] = sir_model.R0
    result = route_market.negotiate(req.origin, req.destination, req.urgency, state)
    return result


@router.get("/history")
def get_history():
    return route_market.history


@router.get("/agents")
def get_agents():
    return CARRIERS
