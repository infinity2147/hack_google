"""
NEXUS — FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sir, network, documents, crowd, shipments, market, scenarios, disruptions, decisions, health, immune

app = FastAPI(title="NEXUS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sir.router, prefix="/api/sir", tags=["SIR"])
app.include_router(network.router, prefix="/api/network", tags=["Network"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(crowd.router, prefix="/api/crowd", tags=["Crowd"])
app.include_router(shipments.router, prefix="/api/shipments", tags=["Shipments"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["Scenarios"])
app.include_router(disruptions.router, prefix="/api/disruptions", tags=["Disruptions"])
app.include_router(decisions.router, prefix="/api/decisions", tags=["Decisions"])
app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(immune.router, prefix="/api/immune", tags=["Immune"])


@app.get("/api")
def root():
    return {"name": "NEXUS API", "version": "1.0.0", "status": "running"}
