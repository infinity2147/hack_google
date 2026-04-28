from fastapi import APIRouter
from simulation import sir_model, data_loader, NETWORK_NODES

router = APIRouter()


@router.get("/command-center")
def get_command_center():
    """Aggregated dashboard data for command center."""
    total_nodes = len(NETWORK_NODES)
    infected = sum(1 for n in sir_model.nodes.values() if n["state"] == "I")
    susceptible = sum(1 for n in sir_model.nodes.values() if n["state"] == "S")
    recovered = total_nodes - infected - susceptible

    network_health = round((1 - infected / total_nodes) * 100, 1)
    disruption_index = round(infected / total_nodes, 2)

    # Document stats
    docs = data_loader.documents
    doc_anomalies = int(len(docs[docs["status"].isin(["alert", "critical"])])) if not docs.empty else 0

    # Crowd stats
    crowd_total = len(data_loader.voice_notes)

    # Shipment stats
    ships = data_loader.shipments
    delayed = int(len(ships[ships["status"] == "delayed"])) if not ships.empty else 0
    total_ships = len(ships)

    # Alerts from recent disruptions
    disruptions = data_loader.disruptions
    recent_disruptions = disruptions.sort_values("timestamp", ascending=False).head(8) if not disruptions.empty else disruptions
    alerts = []
    for _, row in recent_disruptions.iterrows():
        sev = float(row.get("severity", 0))
        level = "critical" if sev > 0.7 else "alert" if sev > 0.4 else "review" if sev > 0.2 else "normal"
        alerts.append({
            "id": row.get("event_id", ""),
            "level": level,
            "title": f"{row.get('disruption_type', 'Unknown')} at {row.get('port_name', '')}",
            "detail": row.get("description", ""),
            "meta": f"Severity {sev:.2f} · R₀ {row.get('r_number', 0):.2f}",
            "cta": "Investigate",
            "ago": "recent",
        })

    return {
        "networkHealth": network_health,
        "disruptionIndex": disruption_index,
        "R0": sir_model.R0,
        "activeAlerts": len(alerts),
        "docAnomalies": doc_anomalies,
        "crowdReports": crowd_total,
        "monitoredContainers": 82,
        "reroutedToday": max(1, delayed // 3),
        "shipments": total_ships,
        "cascadesPrevented": max(1, delayed // 2),
        "avgResponseHours": 3.2,
        "costSaved": 2300000,
        "susceptible": susceptible,
        "infected": infected,
        "recovered": recovered,
        "alerts": alerts,
    }


@router.get("/node/{node_id}")
def get_node_risk(node_id: str):
    rt = sir_model.nodes.get(node_id)
    if not rt:
        return {"error": "Node not found"}
    node_data = next((n for n in NETWORK_NODES if n["id"] == node_id), None)
    return {
        "id": node_id,
        "name": node_data["name"] if node_data else node_id,
        "sirState": rt["state"],
        "infection": rt["infection"],
        "riskScore": round(rt["infection"] * 0.7 + 0.15, 2),
    }
