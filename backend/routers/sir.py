from fastapi import APIRouter
from pydantic import BaseModel
from simulation import sir_model

router = APIRouter()


class SeedRequest(BaseModel):
    node_id: str
    severity: float = 0.7


class StepRequest(BaseModel):
    n: int = 1


class ParamsRequest(BaseModel):
    beta: float | None = None
    gamma: float | None = None


@router.get("/state")
def get_state():
    return sir_model.get_state()


@router.get("/history")
def get_history():
    return sir_model.get_history()


@router.get("/params")
def get_params():
    return {"beta": sir_model.beta, "gamma": sir_model.gamma, "R0": sir_model.R0, "step": sir_model.step}


@router.put("/params")
def update_params(req: ParamsRequest):
    if req.beta is not None:
        sir_model.beta = req.beta
    if req.gamma is not None:
        sir_model.gamma = req.gamma
    return {"beta": sir_model.beta, "gamma": sir_model.gamma}


@router.post("/seed")
def seed_disruption(req: SeedRequest):
    sir_model.seed_disruption(req.node_id, req.severity)
    return {"status": "seeded", "node_id": req.node_id, "severity": req.severity}


@router.post("/step")
def step_simulation(req: StepRequest):
    sir_model.step_simulation(req.n)
    return {"step": sir_model.step, "R0": sir_model.R0}


@router.post("/reset")
def reset_simulation():
    sir_model.reset()
    return {"status": "reset", "step": 0}
