"""
NEXUS — FastAPI Backend
"""
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import sir, network, documents, crowd, shipments, market, scenarios, disruptions, decisions, health, immune

app = FastAPI(title="NEXUS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes ─────────────────────────────────────────────────────────────────
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


# ── Serve React SPA (production only) ─────────────────────────────────────────
STATIC_DIR = Path(__file__).parent / "static"

if STATIC_DIR.is_dir():
    # Mount static assets (js, css, images, etc.)
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(request: Request, full_path: str):
        """Serve index.html for all non-API, non-asset routes (SPA fallback)."""
        file_path = STATIC_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
