"""
NEXUS — Core Simulation Engine
Adapted from Streamlit simulation.py for FastAPI backend.
"""
import numpy as np
import pandas as pd
import os
import math
import json
from typing import Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
if not os.path.isdir(DATA_DIR):
    DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

# ─── Network Topology ────────────────────────────────────────────────────────

NETWORK_NODES = [
    {"id": "IN-JNPT", "name": "Nhava Sheva (JNPT)", "type": "major_port", "country": "India", "lat": 18.95, "lng": 72.95, "tradeVolumeB": 47},
    {"id": "IN-MUM", "name": "Mumbai Port", "type": "major_port", "country": "India", "lat": 18.95, "lng": 72.84, "tradeVolumeB": 38},
    {"id": "IN-MUN", "name": "Mundra Port", "type": "major_port", "country": "India", "lat": 22.73, "lng": 69.72, "tradeVolumeB": 32},
    {"id": "IN-CHN", "name": "Chennai Port", "type": "major_port", "country": "India", "lat": 13.10, "lng": 80.30, "tradeVolumeB": 28},
    {"id": "IN-KOL", "name": "Kolkata (Haldia)", "type": "major_port", "country": "India", "lat": 22.57, "lng": 88.34, "tradeVolumeB": 18},
    {"id": "IN-VIZ", "name": "Visakhapatnam", "type": "minor_port", "country": "India", "lat": 17.69, "lng": 83.29, "tradeVolumeB": 12},
    {"id": "IN-TUT", "name": "Tuticorin Port", "type": "minor_port", "country": "India", "lat": 8.76, "lng": 78.18, "tradeVolumeB": 8},
    {"id": "IN-COC", "name": "Cochin Port", "type": "minor_port", "country": "India", "lat": 9.97, "lng": 76.27, "tradeVolumeB": 7},
    {"id": "IN-DEL", "name": "ICD NCR (Dadri)", "type": "icd", "country": "India", "lat": 28.57, "lng": 77.33, "tradeVolumeB": 15},
    {"id": "IN-JAI", "name": "ICD Jaipur", "type": "icd", "country": "India", "lat": 26.91, "lng": 75.79, "tradeVolumeB": 6},
    {"id": "IN-AHM", "name": "ICD Ahmedabad", "type": "icd", "country": "India", "lat": 23.02, "lng": 72.57, "tradeVolumeB": 8},
    {"id": "IN-HYD", "name": "ICD Hyderabad", "type": "icd", "country": "India", "lat": 17.39, "lng": 78.49, "tradeVolumeB": 5},
    {"id": "IN-BLR", "name": "ICD Bangalore", "type": "icd", "country": "India", "lat": 12.97, "lng": 77.59, "tradeVolumeB": 9},
    {"id": "IN-DEL-A", "name": "IGI Airport Delhi", "type": "airport", "country": "India", "lat": 28.56, "lng": 77.10, "tradeVolumeB": 11},
    {"id": "IN-BOM-A", "name": "CSI Airport Mumbai", "type": "airport", "country": "India", "lat": 19.09, "lng": 72.87, "tradeVolumeB": 14},
    {"id": "IN-MAA-A", "name": "Chennai Airport", "type": "airport", "country": "India", "lat": 12.99, "lng": 80.17, "tradeVolumeB": 7},
    {"id": "SG-HUB", "name": "Singapore Hub", "type": "carrier_hub", "country": "Singapore", "lat": 1.35, "lng": 103.82, "tradeVolumeB": 42},
    {"id": "AE-DXB", "name": "Dubai (Jebel Ali)", "type": "carrier_hub", "country": "UAE", "lat": 25.02, "lng": 55.08, "tradeVolumeB": 39},
    {"id": "NL-RTM", "name": "Rotterdam", "type": "carrier_hub", "country": "Netherlands", "lat": 51.92, "lng": 4.48, "tradeVolumeB": 44},
    {"id": "LK-CMB", "name": "Colombo", "type": "minor_port", "country": "Sri Lanka", "lat": 6.93, "lng": 79.84, "tradeVolumeB": 16},
    {"id": "DE-HAM", "name": "Hamburg", "type": "major_port", "country": "Germany", "lat": 53.55, "lng": 9.99, "tradeVolumeB": 35},
    {"id": "CN-SHA", "name": "Shanghai", "type": "major_port", "country": "China", "lat": 31.23, "lng": 121.47, "tradeVolumeB": 43},
    {"id": "US-LAX", "name": "Los Angeles", "type": "major_port", "country": "USA", "lat": 33.94, "lng": -118.24, "tradeVolumeB": 37},
    {"id": "GB-LON", "name": "London Gateway", "type": "major_port", "country": "UK", "lat": 51.45, "lng": 0.35, "tradeVolumeB": 22},
    {"id": "JP-YOK", "name": "Yokohama", "type": "minor_port", "country": "Japan", "lat": 35.44, "lng": 139.64, "tradeVolumeB": 20},
    {"id": "KR-PUS", "name": "Busan", "type": "minor_port", "country": "South Korea", "lat": 35.10, "lng": 129.04, "tradeVolumeB": 25},
    {"id": "ZA-DUR", "name": "Durban", "type": "major_port", "country": "South Africa", "lat": -29.88, "lng": 31.05, "tradeVolumeB": 13},
    {"id": "AU-SYD", "name": "Sydney", "type": "minor_port", "country": "Australia", "lat": -33.87, "lng": 151.21, "tradeVolumeB": 10},
    {"id": "IN-KAN", "name": "Kandla/Deendayal", "type": "minor_port", "country": "India", "lat": 23.03, "lng": 70.22, "tradeVolumeB": 14},
    {"id": "IN-HAZ", "name": "Haldia Dock", "type": "minor_port", "country": "India", "lat": 22.03, "lng": 88.06, "tradeVolumeB": 6},
    {"id": "IN-PAR", "name": "Paradip Port", "type": "minor_port", "country": "India", "lat": 20.26, "lng": 86.67, "tradeVolumeB": 9},
]

NETWORK_EDGES = [
    {"source": "IN-JNPT", "target": "SG-HUB", "weight": 0.95},
    {"source": "IN-JNPT", "target": "AE-DXB", "weight": 0.88},
    {"source": "IN-JNPT", "target": "NL-RTM", "weight": 0.82},
    {"source": "IN-JNPT", "target": "IN-MUM", "weight": 0.90},
    {"source": "IN-JNPT", "target": "IN-DEL", "weight": 0.70},
    {"source": "IN-MUN", "target": "AE-DXB", "weight": 0.85},
    {"source": "IN-MUN", "target": "SG-HUB", "weight": 0.78},
    {"source": "IN-MUN", "target": "IN-KAN", "weight": 0.75},
    {"source": "IN-CHN", "target": "SG-HUB", "weight": 0.90},
    {"source": "IN-CHN", "target": "LK-CMB", "weight": 0.85},
    {"source": "IN-CHN", "target": "IN-BLR", "weight": 0.65},
    {"source": "IN-KOL", "target": "SG-HUB", "weight": 0.72},
    {"source": "IN-KOL", "target": "IN-HAZ", "weight": 0.80},
    {"source": "IN-KOL", "target": "CN-SHA", "weight": 0.60},
    {"source": "SG-HUB", "target": "NL-RTM", "weight": 0.92},
    {"source": "SG-HUB", "target": "CN-SHA", "weight": 0.88},
    {"source": "SG-HUB", "target": "KR-PUS", "weight": 0.80},
    {"source": "SG-HUB", "target": "LK-CMB", "weight": 0.82},
    {"source": "SG-HUB", "target": "AU-SYD", "weight": 0.65},
    {"source": "AE-DXB", "target": "NL-RTM", "weight": 0.87},
    {"source": "AE-DXB", "target": "ZA-DUR", "weight": 0.60},
    {"source": "NL-RTM", "target": "DE-HAM", "weight": 0.90},
    {"source": "NL-RTM", "target": "GB-LON", "weight": 0.85},
    {"source": "CN-SHA", "target": "JP-YOK", "weight": 0.82},
    {"source": "CN-SHA", "target": "KR-PUS", "weight": 0.80},
    {"source": "CN-SHA", "target": "US-LAX", "weight": 0.75},
    {"source": "US-LAX", "target": "JP-YOK", "weight": 0.70},
    {"source": "IN-VIZ", "target": "IN-CHN", "weight": 0.65},
    {"source": "IN-VIZ", "target": "SG-HUB", "weight": 0.55},
    {"source": "IN-TUT", "target": "IN-COC", "weight": 0.60},
    {"source": "IN-TUT", "target": "SG-HUB", "weight": 0.58},
    {"source": "IN-COC", "target": "LK-CMB", "weight": 0.62},
    {"source": "IN-DEL", "target": "IN-JAI", "weight": 0.55},
    {"source": "IN-DEL", "target": "IN-DEL-A", "weight": 0.70},
    {"source": "IN-AHM", "target": "IN-MUN", "weight": 0.60},
    {"source": "IN-BLR", "target": "IN-CHN", "weight": 0.55},
    {"source": "IN-HYD", "target": "IN-VIZ", "weight": 0.50},
    {"source": "IN-MUM", "target": "IN-BOM-A", "weight": 0.72},
    {"source": "IN-CHN", "target": "IN-MAA-A", "weight": 0.68},
    {"source": "IN-PAR", "target": "IN-KOL", "weight": 0.55},
    {"source": "IN-PAR", "target": "IN-VIZ", "weight": 0.50},
    {"source": "IN-KAN", "target": "IN-JNPT", "weight": 0.60},
    {"source": "IN-KAN", "target": "IN-MUN", "weight": 0.65},
    {"source": "DE-HAM", "target": "GB-LON", "weight": 0.78},
    {"source": "LK-CMB", "target": "IN-TUT", "weight": 0.58},
    {"source": "ZA-DUR", "target": "AE-DXB", "weight": 0.55},
    {"source": "AU-SYD", "target": "CN-SHA", "weight": 0.60},
    {"source": "IN-JAI", "target": "IN-AHM", "weight": 0.45},
]


# ─── SIR Model ───────────────────────────────────────────────────────────────

class SIRModel:
    def __init__(self):
        self.nodes = {n["id"]: {"state": "S", "infection": 0.0, "recovery_step": None} for n in NETWORK_NODES}
        self.beta = 0.25
        self.gamma = 0.10
        self.step = 0
        self.history = [{"step": 0, "S": 0.96, "I": 0.04, "R": 0.0, "R0": 1.87}]
        self.R0 = 1.87
        self._build_adjacency()
        # Seed default disruption at JNPT
        self.seed_disruption("IN-JNPT", 0.7)

    def _build_adjacency(self):
        self.adj = {n["id"]: [] for n in NETWORK_NODES}
        for e in NETWORK_EDGES:
            self.adj[e["source"]].append({"id": e["target"], "w": e["weight"]})
            self.adj[e["target"]].append({"id": e["source"], "w": e["weight"]})

    def seed_disruption(self, node_id: str, severity: float):
        if node_id in self.nodes:
            self.nodes[node_id]["state"] = "I"
            self.nodes[node_id]["infection"] = max(0.3, min(1.0, severity))

    def step_simulation(self, n: int = 1):
        for _ in range(n):
            self.step += 1
            next_nodes = {}
            for nid, node in self.nodes.items():
                inf = node["infection"]
                if node["state"] == "S":
                    force = sum(
                        self.nodes[nb["id"]]["infection"] * nb["w"]
                        for nb in self.adj[nid]
                    ) / max(1, len(self.adj[nid]))
                    d_inf = self.beta * max(0, 1 - inf) * force
                    inf = min(1, inf + d_inf)
                    state = "I" if inf > 0.18 else "S"
                    next_nodes[nid] = {"state": state, "infection": inf, "recovery_step": None}
                elif node["state"] == "I":
                    inf = max(0, inf - self.gamma)
                    force = sum(
                        self.nodes[nb["id"]]["infection"] * nb["w"]
                        for nb in self.adj[nid]
                    ) / max(1, len(self.adj[nid]))
                    inf = min(1, inf + self.beta * 0.4 * force * (1 - inf))
                    state = "R" if inf < 0.05 else "I"
                    rec = self.step if state == "R" else node.get("recovery_step")
                    next_nodes[nid] = {"state": state, "infection": inf, "recovery_step": rec}
                else:
                    next_nodes[nid] = {"state": "R", "infection": max(0, inf - 0.01), "recovery_step": node.get("recovery_step")}
            self.nodes = next_nodes
            self._compute_aggregate()

    def _compute_aggregate(self):
        total = len(self.nodes)
        S = sum(1 for n in self.nodes.values() if n["state"] == "S")
        I = sum(1 for n in self.nodes.values() if n["state"] == "I")
        R = total - S - I
        infected_ids = [nid for nid, n in self.nodes.items() if n["state"] == "I"]
        mean_deg = (sum(len(self.adj[nid]) for nid in infected_ids) / len(infected_ids)) if infected_ids else 3
        self.R0 = round((self.beta / max(0.001, self.gamma)) * (mean_deg / 6), 2)
        entry = {"step": self.step, "S": round(S / total, 3), "I": round(I / total, 3), "R": round(R / total, 3), "R0": self.R0}
        self.history.append(entry)
        if len(self.history) > 200:
            self.history = self.history[-200:]

    def reset(self):
        self.__init__()

    def get_state(self):
        return {"step": self.step, "R0": self.R0, "beta": self.beta, "gamma": self.gamma, "nodes": self.nodes}

    def get_history(self):
        return self.history


# ─── Immune System ───────────────────────────────────────────────────────────

ANTIBODIES = [
    {"id": "AB-0001", "code": "PORT_CONGESTION_INDIA_WEST_001", "type": "Port Congestion", "location": "Western India (JNPT)", "severity": 0.78, "pattern": [0.88, 0.82, 0.40, 0.55, 0.28, 0.62, 0.40], "lastTriggered": "2025-09-14", "matchConfidence": 0.94},
    {"id": "AB-0002", "code": "PORT_STRIKE_INDIA_WEST_001", "type": "Port Strike", "location": "Western India", "severity": 0.86, "pattern": [0.42, 0.85, 0.10, 0.78, 0.30, 0.60, 0.85], "lastTriggered": "2024-03-12", "matchConfidence": 0.91},
    {"id": "AB-0003", "code": "CYCLONE_BAY_OF_BENGAL_001", "type": "Severe Weather", "location": "Bay of Bengal", "severity": 0.92, "pattern": [0.35, 0.55, 0.95, 0.60, 0.10, 0.20, 0.70], "lastTriggered": "2025-05-21", "matchConfidence": 0.89},
    {"id": "AB-0004", "code": "GEOPOLITICAL_RED_SEA_001", "type": "Geopolitical", "location": "Red Sea Corridor", "severity": 0.83, "pattern": [0.55, 0.40, 0.05, 0.92, 0.65, 0.50, 0.20], "lastTriggered": "2024-11-30", "matchConfidence": 0.87},
    {"id": "AB-0005", "code": "LABOR_DISPUTE_INLAND_001", "type": "Labor Dispute", "location": "Pan-India (Inland)", "severity": 0.61, "pattern": [0.20, 0.40, 0.05, 0.75, 0.10, 0.55, 0.92], "lastTriggered": "2025-07-04", "matchConfidence": 0.82},
    {"id": "AB-0006", "code": "CUSTOMS_DELAY_INDIA_001", "type": "Customs Delay", "location": "All India Ports", "severity": 0.58, "pattern": [0.25, 0.55, 0.10, 0.45, 0.42, 0.92, 0.40], "lastTriggered": "2025-12-01", "matchConfidence": 0.85},
    {"id": "AB-0007", "code": "CYBER_CARRIER_SYSTEMS_001", "type": "Cyber Incident", "location": "Carrier IT (Maersk-class)", "severity": 0.72, "pattern": [0.65, 0.60, 0.05, 0.85, 0.55, 0.40, 0.20], "lastTriggered": "2024-06-19", "matchConfidence": 0.79},
    {"id": "AB-0008", "code": "EQUIPMENT_FAILURE_CRANE_001", "type": "Equipment Failure", "location": "Major Port Cranes", "severity": 0.65, "pattern": [0.30, 0.78, 0.12, 0.30, 0.10, 0.45, 0.30], "lastTriggered": "2025-10-08", "matchConfidence": 0.81},
]

SIGNAL_DIMENSIONS = ["AIS Anomaly", "Port Congestion", "Weather Severity", "News Signal", "Invoice Anomaly", "Customs Delay", "Crowd Reports"]
IMMUNE_THRESHOLD = 0.82


class ImmuneSystem:
    def scan(self, sensor_vector: list[float]) -> dict:
        best_id = ANTIBODIES[0]["id"]
        best_sim = -1
        for ab in ANTIBODIES:
            s = self._cosine_similarity(sensor_vector, ab["pattern"])
            if s > best_sim:
                best_sim = s
                best_id = ab["id"]
        fired = best_sim >= IMMUNE_THRESHOLD
        matched = next(ab for ab in ANTIBODIES if ab["id"] == best_id)
        actions = [
            f"Backup supplier route activated (matched {matched['code']})",
            "3 alternate routes flagged for high-priority cargo",
            "Inventory buffer alert sent to 4 warehouses",
        ] if fired else [
            f"No antibody crossed threshold (best: {matched['code']})",
            "Monitoring continues at 15-minute cadence",
        ]
        return {"bestMatchId": best_id, "similarity": round(best_sim, 3), "fired": fired, "threshold": IMMUNE_THRESHOLD, "recommendedActions": actions}

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(x * x for x in b))
        return dot / (na * nb) if na > 0 and nb > 0 else 0


# ─── Route Market (Vickrey Auction) ─────────────────────────────────────────

CARRIERS = [
    {"id": "MAERSK", "code": "MAERSK", "name": "Maersk Line", "agent": "α₁", "riskTolerance": "Balanced", "speed": "High", "costProfile": "Medium", "winRate": 0.34, "baseRate": 28000, "speedScore": 0.92, "reliabilityScore": 0.89, "strategy": "cost-leader", "color": "#3b82f6"},
    {"id": "MSC", "code": "MSC", "name": "MSC", "agent": "α₂", "riskTolerance": "Aggressive", "speed": "Medium", "costProfile": "Low", "winRate": 0.28, "baseRate": 24000, "speedScore": 0.78, "reliabilityScore": 0.82, "strategy": "volume-discounter", "color": "#ef4444"},
    {"id": "CMA", "code": "CMA CGM", "name": "CMA CGM", "agent": "α₃", "riskTolerance": "Balanced", "speed": "High", "costProfile": "Medium", "winRate": 0.18, "baseRate": 26500, "speedScore": 0.85, "reliabilityScore": 0.87, "strategy": "balanced", "color": "#22c55e"},
    {"id": "COSCO", "code": "COSCO", "name": "COSCO Shipping", "agent": "α₄", "riskTolerance": "Conservative", "speed": "Low", "costProfile": "Low", "winRate": 0.10, "baseRate": 22000, "speedScore": 0.65, "reliabilityScore": 0.78, "strategy": "budget", "color": "#f59e0b"},
    {"id": "HAPAG", "code": "Hapag-Lloyd", "name": "Hapag-Lloyd", "agent": "α₅", "riskTolerance": "Conservative", "speed": "High", "costProfile": "High", "winRate": 0.06, "baseRate": 31000, "speedScore": 0.90, "reliabilityScore": 0.93, "strategy": "premium", "color": "#8b5cf6"},
    {"id": "ONE", "code": "ONE", "name": "Ocean Network Express", "agent": "α₆", "riskTolerance": "Balanced", "speed": "Medium", "costProfile": "Medium", "winRate": 0.03, "baseRate": 25500, "speedScore": 0.80, "reliabilityScore": 0.85, "strategy": "balanced", "color": "#ec4899"},
    {"id": "EVERGREEN", "code": "Evergreen", "name": "Evergreen Marine", "agent": "α₇", "riskTolerance": "Aggressive", "speed": "Low", "costProfile": "Low", "winRate": 0.02, "baseRate": 21000, "speedScore": 0.60, "reliabilityScore": 0.75, "strategy": "budget-aggressive", "color": "#06b6d4"},
]


class RouteMarket:
    def __init__(self):
        self.history = []
        self.round = 0

    def negotiate(self, origin: str, destination: str, urgency: float, sir_state: dict) -> dict:
        self.round += 1
        orig = next((n for n in NETWORK_NODES if n["id"] == origin), None)
        dest = next((n for n in NETWORK_NODES if n["id"] == destination), None)

        orig_inf = sir_state.get(origin, {}).get("infection", 0)
        dest_inf = sir_state.get(destination, {}).get("infection", 0)
        congestion_risk = (orig_inf + dest_inf) / 2

        bids = []
        for c in CARRIERS:
            random_delta = (np.random.random() - 0.5) * 6000
            bid_val = round((c["baseRate"] + random_delta) * (1 + congestion_risk * 0.15) * (1 + (1 - urgency) * 0.05))
            transit = round(28 - c["speedScore"] * 12 + (np.random.random() - 0.5) * 2)
            risk = round(0.45 - c["reliabilityScore"] * 0.4 + congestion_risk * 0.3, 2)
            score = round((urgency * c["speedScore"] + (1 - urgency) * (1 - bid_val / 70000) + c["reliabilityScore"] * 0.4 - risk * 0.3) / 2 + 0.5, 4)
            bids.append({"carrier": c["id"], "bid": bid_val, "transitDays": transit, "riskScore": risk, "score": score})

        sorted_bids = sorted(bids, key=lambda b: b["score"], reverse=True)
        winner = sorted_bids[0]
        payment = sorted_bids[1]["bid"]

        # Route path
        r0 = sir_state.get("_R0", 1.5)
        path = [origin]
        if r0 > 1.5:
            path.append("LK-CMB")
        path.append("SG-HUB")
        path.append(destination)

        result = {
            "round": self.round, "origin": origin, "destination": destination,
            "urgency": urgency, "bids": bids, "winnerId": winner["carrier"],
            "paymentPrice": payment, "routePath": path, "ts": pd.Timestamp.now().isoformat(),
        }
        self.history.insert(0, result)
        if len(self.history) > 25:
            self.history = self.history[:25]
        return result


# ─── Scenario Engine ─────────────────────────────────────────────────────────

SCENARIO_PRESETS = [
    {"name": "Suez Canal Closure (7 days)", "description": "Simulates Suez Canal blockage affecting EU-Asia trade routes", "seedNodes": ["AE-DXB", "NL-RTM", "DE-HAM"], "severity": 0.95, "betaMult": 1.5},
    {"name": "Cyclone hits Gujarat", "description": "Cyclone Biparjoy-scale event closing Gujarat ports", "seedNodes": ["IN-MUN", "IN-KAN", "IN-AHM"], "severity": 0.90, "betaMult": 1.3},
    {"name": "Fuel price spike 30%", "description": "Global bunker fuel price increase raising all shipping costs", "seedNodes": [], "severity": 0.0, "betaMult": 1.0},
    {"name": "New warehouse in Hyderabad", "description": "Added capacity reduces network strain, improving recovery", "seedNodes": [], "severity": 0.0, "betaMult": 0.8},
]


class ScenarioEngine:
    def __init__(self, sir_model: SIRModel):
        self.sir = sir_model
        self.last_result = None

    def run(self, preset_name: str) -> dict:
        preset = next((p for p in SCENARIO_PRESETS if p["name"] == preset_name), None)
        if not preset:
            return {"error": "Preset not found"}

        total = len(self.sir.nodes)
        infected_count = sum(1 for n in self.sir.nodes.values() if n["state"] == "I")
        before_health = round((1 - infected_count / total) * 100, 1)

        # Clone and simulate
        import copy
        sim_nodes = copy.deepcopy(self.sir.nodes)
        scenario_beta = self.sir.beta * preset["betaMult"]

        for nid in preset["seedNodes"]:
            if nid in sim_nodes:
                sim_nodes[nid]["state"] = "I"
                sim_nodes[nid]["infection"] = preset["severity"]

        for i in range(30):
            next_nodes = {}
            for nid, node in sim_nodes.items():
                inf = node["infection"]
                if node["state"] == "S":
                    force = sum(sim_nodes[nb["id"]]["infection"] * nb["w"] for nb in self.sir.adj[nid]) / max(1, len(self.sir.adj[nid]))
                    d_inf = scenario_beta * max(0, 1 - inf) * force
                    inf = min(1, inf + d_inf)
                    next_nodes[nid] = {"state": "I" if inf > 0.18 else "S", "infection": inf, "recovery_step": None}
                elif node["state"] == "I":
                    inf = max(0, inf - self.sir.gamma)
                    next_nodes[nid] = {"state": "R" if inf < 0.05 else "I", "infection": inf, "recovery_step": self.sir.step if inf < 0.05 else None}
                else:
                    next_nodes[nid] = {"state": "R", "infection": max(0, inf - 0.01), "recovery_step": node.get("recovery_step")}
            sim_nodes = next_nodes

        after_infected = sum(1 for n in sim_nodes.values() if n["state"] == "I")
        after_health = round((1 - after_infected / total) * 100, 1)
        affected = [nid for nid, n in sim_nodes.items() if n["infection"] > 0.2]

        result = {
            "name": preset_name, "beforeHealth": before_health, "afterHealth": after_health,
            "healthDelta": round(after_health - before_health, 1),
            "affectedNodes": affected, "costEstimate": len(affected) * 150000,
        }
        self.last_result = result
        return result


# ─── Data Loader ─────────────────────────────────────────────────────────────

class DataLoader:
    def __init__(self):
        self._shipments = None
        self._documents = None
        self._disruptions = None
        self._voice_notes = None
        self._contributors = None

    @property
    def shipments(self) -> pd.DataFrame:
        if self._shipments is None:
            path = os.path.join(DATA_DIR, "historical_shipments.csv")
            self._shipments = pd.read_csv(path) if os.path.exists(path) else pd.DataFrame()
        return self._shipments

    @property
    def documents(self) -> pd.DataFrame:
        if self._documents is None:
            path = os.path.join(DATA_DIR, "financial_documents.csv")
            self._documents = pd.read_csv(path) if os.path.exists(path) else pd.DataFrame()
        return self._documents

    @property
    def disruptions(self) -> pd.DataFrame:
        if self._disruptions is None:
            path = os.path.join(DATA_DIR, "disruption_events.csv")
            self._disruptions = pd.read_csv(path) if os.path.exists(path) else pd.DataFrame()
        return self._disruptions

    @property
    def voice_notes(self) -> pd.DataFrame:
        if self._voice_notes is None:
            path = os.path.join(DATA_DIR, "voice_notes.csv")
            self._voice_notes = pd.read_csv(path) if os.path.exists(path) else pd.DataFrame()
        return self._voice_notes

    @property
    def contributors(self) -> pd.DataFrame:
        if self._contributors is None:
            path = os.path.join(DATA_DIR, "crowd_contributors.csv")
            self._contributors = pd.read_csv(path) if os.path.exists(path) else pd.DataFrame()
        return self._contributors


# ─── Decision Log ────────────────────────────────────────────────────────────

class DecisionLog:
    def __init__(self):
        self.entries = []

    def log(self, action_type: str, target: str, details: dict = None):
        from datetime import datetime
        entry = {
            "id": f"DEC-{int(datetime.now().timestamp() * 1000)}",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "actionType": action_type, "target": target,
            "details": details or {},
        }
        self.entries.insert(0, entry)
        if len(self.entries) > 200:
            self.entries = self.entries[:200]
        return entry

    def get_all(self, action_type: str = None):
        if action_type:
            return [e for e in self.entries if e["actionType"] == action_type]
        return self.entries

    def summary(self):
        counts = {}
        for e in self.entries:
            counts[e["actionType"]] = counts.get(e["actionType"], 0) + 1
        return {"total": len(self.entries), "byType": counts}


# ─── Singleton instances ─────────────────────────────────────────────────────

sir_model = SIRModel()
immune_system = ImmuneSystem()
route_market = RouteMarket()
scenario_engine = ScenarioEngine(sir_model)
data_loader = DataLoader()
decision_log = DecisionLog()
