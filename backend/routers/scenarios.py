from fastapi import APIRouter
from pydantic import BaseModel
from simulation import scenario_engine, SCENARIO_PRESETS

router = APIRouter()


class RunScenarioRequest(BaseModel):
    preset_name: str


@router.get("/presets")
def get_presets():
    return SCENARIO_PRESETS


@router.post("/run")
def run_scenario(req: RunScenarioRequest):
    result = scenario_engine.run(req.preset_name)
    return result
