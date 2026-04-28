from fastapi import APIRouter
from pydantic import BaseModel
from simulation import route_market, CARRIERS, sir_model

router = APIRouter()


class NegotiateRequest(BaseModel):
    origin: str = "IN-JNPT"
    destination: str = "NL-RTM"
    urgency: float = 0.7


class AddCarrierRequest(BaseModel):
    name: str
    base_rate: int = 45000
    speed_score: float = 0.70
    reliability_score: float = 0.80
    risk_tolerance: str = "Balanced"
    speed: str = "Medium"
    cost_profile: str = "Medium"
    strategy: str = "Document-derived"
    color: str = "#14b8a6"


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


@router.post("/carriers")
def add_carrier(req: AddCarrierRequest):
    idx = len(CARRIERS) + 1
    carrier_id = req.name.upper().replace(" ", "_")[:12]
    agent_label = f"α{chr(0x2080 + idx)}" if idx <= 9 else f"α{idx}"
    new_carrier = {
        "id": carrier_id,
        "code": carrier_id,
        "name": req.name,
        "agent": agent_label,
        "riskTolerance": req.risk_tolerance,
        "speed": req.speed,
        "costProfile": req.cost_profile,
        "winRate": 0.0,
        "baseRate": req.base_rate,
        "speedScore": req.speed_score,
        "reliabilityScore": req.reliability_score,
        "strategy": req.strategy,
        "color": req.color,
    }
    CARRIERS.append(new_carrier)
    return {"status": "ok", "carrier": new_carrier, "total_carriers": len(CARRIERS)}
