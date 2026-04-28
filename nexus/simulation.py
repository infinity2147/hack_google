"""
NEXUS — Core Simulation Models
Neural Supply Chain Organism: SIR epidemiology, immune memory, agent market,
document intelligence, crowdsourcing, acoustic detection, explainability
"""

import numpy as np
import pandas as pd
import os
import random
from dataclasses import dataclass, field
from typing import List, Dict, Optional


DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


# ─── Supply Chain Network ────────────────────────────────────────────────────

@dataclass
class Node:
    id: str
    name: str
    kind: str
    lat: float
    lon: float
    capacity: float
    load: float
    status: str = "normal"
    congestion: float = 0.0
    disruption_prob: float = 0.0


@dataclass
class Edge:
    src: str
    dst: str
    dist_km: float
    hours: float
    risk: float
    mode: str


class SupplyChainNetwork:
    """Global supply-chain graph with real Indian / global nodes."""

    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.edges: List[Edge] = []
        self._build()

    def _build(self):
        raw = [
            ("IN-JNPT", "Nhava Sheva (JNPT)", "port", 18.95, 72.95, 5000, 3200),
            ("IN-MUN",  "Mundra Port", "port", 22.77, 69.71, 4500, 2800),
            ("IN-CHN",  "Chennai Port", "port", 13.10, 80.30, 3500, 2100),
            ("IN-KOL",  "Kolkata Port", "port", 22.55, 88.33, 2500, 1800),
            ("IN-HAZ",  "Hazira Port", "port", 21.10, 72.63, 2000, 1200),
            ("IN-VIZ",  "Visakhapatnam Port", "port", 17.69, 83.29, 2200, 1500),
            ("IN-KOC",  "Kochi Port", "port", 9.93, 76.27, 1800, 1100),
            ("IN-TUT",  "Tuticorin Port", "port", 8.76, 78.18, 1500, 900),
            ("IN-PAR",  "Paradip Port", "port", 20.26, 86.67, 2500, 1600),
            ("IN-KND",  "Kandla Port", "port", 23.03, 70.22, 3200, 2200),
            ("SG-SIN",  "Singapore", "port", 1.26, 103.82, 8000, 6500),
            ("CN-SHA",  "Shanghai", "port", 31.23, 121.47, 12000, 9000),
            ("CN-SZX",  "Shenzhen", "port", 22.54, 114.06, 10000, 7500),
            ("CN-NGB",  "Ningbo", "port", 29.87, 121.55, 9500, 7200),
            ("AE-DXB",  "Dubai (Jebel Ali)", "port", 25.01, 55.08, 6000, 4200),
            ("LK-CMB",  "Colombo", "port", 6.95, 79.85, 3500, 2500),
            ("NL-RTM",  "Rotterdam", "port", 51.92, 4.48, 9000, 7000),
            ("US-LAX",  "Los Angeles", "port", 33.73, -118.26, 10000, 7800),
            ("US-NYC",  "New York/New Jersey", "port", 40.69, -74.17, 8500, 6200),
            ("ZA-DUR",  "Durban", "port", -29.87, 31.03, 3000, 2100),
            ("MY-PTG",  "Port Klang", "port", 3.00, 101.39, 5500, 4000),
            ("TH-LCH",  "Laem Chabang", "port", 13.08, 100.88, 4000, 2800),
            ("DE-HAM",  "Hamburg", "port", 53.55, 9.99, 8800, 6500),
            ("JP-YOK",  "Yokohama", "port", 35.44, 139.64, 7500, 5800),
            ("KR-BUS",  "Busan", "port", 35.10, 129.04, 7000, 5200),
            ("IN-DEL",  "Delhi ICD", "warehouse", 28.61, 77.21, 3000, 2000),
            ("IN-BLR",  "Bangalore Hub", "warehouse", 12.97, 77.59, 2000, 1400),
            ("IN-MUM",  "Mumbai Warehouse", "warehouse", 19.08, 72.88, 2500, 1800),
            ("IN-HYD",  "Hyderabad DC", "warehouse", 17.39, 78.49, 1800, 1200),
            ("IN-PUN",  "Pune DC", "warehouse", 18.52, 73.86, 1500, 1000),
            ("IN-AMD",  "Ahmedabad DC", "warehouse", 23.02, 72.57, 1200, 800),
        ]
        for r in raw:
            n = Node(*r)
            self.nodes[n.id] = n

        links = [
            ("IN-JNPT", "SG-SIN", 3600, 96, 0.12, "sea"),
            ("IN-JNPT", "AE-DXB", 2200, 72, 0.10, "sea"),
            ("IN-JNPT", "IN-DEL", 1400, 36, 0.05, "rail"),
            ("IN-JNPT", "IN-MUM", 50, 2, 0.02, "road"),
            ("IN-MUN", "AE-DXB", 1900, 60, 0.08, "sea"),
            ("IN-MUN", "SG-SIN", 4100, 120, 0.14, "sea"),
            ("IN-MUN", "IN-DEL", 1100, 30, 0.04, "rail"),
            ("IN-MUN", "IN-AMD", 400, 8, 0.03, "road"),
            ("IN-CHN", "SG-SIN", 2900, 84, 0.11, "sea"),
            ("IN-CHN", "LK-CMB", 700, 24, 0.06, "sea"),
            ("IN-CHN", "IN-BLR", 350, 8, 0.03, "road"),
            ("IN-CHN", "IN-VIZ", 600, 14, 0.04, "sea"),
            ("IN-KOL", "SG-SIN", 3500, 108, 0.15, "sea"),
            ("IN-KOL", "LK-CMB", 1500, 48, 0.09, "sea"),
            ("IN-KOL", "IN-DEL", 1500, 40, 0.06, "rail"),
            ("IN-HAZ", "AE-DXB", 1800, 56, 0.07, "sea"),
            ("IN-VIZ", "SG-SIN", 2700, 78, 0.10, "sea"),
            ("IN-VIZ", "LK-CMB", 1100, 36, 0.07, "sea"),
            ("IN-KOC", "SG-SIN", 2400, 72, 0.09, "sea"),
            ("IN-TUT", "LK-CMB", 500, 18, 0.05, "sea"),
            ("IN-PAR", "SG-SIN", 3200, 96, 0.13, "sea"),
            ("IN-KND", "AE-DXB", 1700, 52, 0.08, "sea"),
            ("SG-SIN", "CN-SHA", 3800, 96, 0.13, "sea"),
            ("SG-SIN", "CN-SZX", 3500, 90, 0.12, "sea"),
            ("SG-SIN", "MY-PTG", 400, 12, 0.03, "sea"),
            ("CN-SHA", "CN-SZX", 800, 18, 0.02, "sea"),
            ("CN-SHA", "CN-NGB", 200, 6, 0.01, "sea"),
            ("CN-SHA", "JP-YOK", 1800, 60, 0.10, "sea"),
            ("CN-SHA", "KR-BUS", 1200, 42, 0.08, "sea"),
            ("CN-SHA", "US-LAX", 10400, 384, 0.22, "sea"),
            ("CN-SZX", "US-LAX", 10800, 396, 0.24, "sea"),
            ("AE-DXB", "NL-RTM", 6500, 336, 0.18, "sea"),
            ("AE-DXB", "ZA-DUR", 5800, 264, 0.20, "sea"),
            ("AE-DXB", "DE-HAM", 6200, 340, 0.17, "sea"),
            ("LK-CMB", "SG-SIN", 2600, 72, 0.08, "sea"),
            ("NL-RTM", "US-LAX", 8700, 360, 0.19, "sea"),
            ("NL-RTM", "US-NYC", 5800, 240, 0.15, "sea"),
            ("NL-RTM", "DE-HAM", 400, 10, 0.02, "road"),
            ("US-LAX", "US-NYC", 4500, 120, 0.05, "rail"),
            ("JP-YOK", "US-LAX", 8800, 360, 0.20, "sea"),
            ("KR-BUS", "US-LAX", 9200, 380, 0.21, "sea"),
            ("TH-LCH", "SG-SIN", 1300, 36, 0.06, "sea"),
            ("MY-PTG", "LK-CMB", 2200, 60, 0.07, "sea"),
            ("IN-MUM", "IN-BLR", 1000, 24, 0.04, "road"),
            ("IN-MUM", "IN-PUN", 150, 3, 0.02, "road"),
            ("IN-DEL", "IN-HYD", 1500, 36, 0.05, "rail"),
            ("IN-DEL", "IN-AMD", 900, 22, 0.04, "rail"),
            ("IN-HYD", "IN-BLR", 570, 12, 0.03, "road"),
        ]
        for l in links:
            self.edges.append(Edge(*l))


# ─── SIR Epidemiological Model ───────────────────────────────────────────────

class SIRModel:
    """Network-aware SIR model for disruption spread."""

    def __init__(self, network: SupplyChainNetwork):
        self.net = network
        self.beta = 0.30
        self.gamma = 0.10
        self.ids = list(network.nodes.keys())
        self.n = len(self.ids)
        self.id2idx = {nid: i for i, nid in enumerate(self.ids)}

        self.S = np.ones(self.n)
        self.I = np.zeros(self.n)
        self.R = np.zeros(self.n)
        self.A = self._adjacency()
        self.history: List[dict] = []

    def _adjacency(self) -> np.ndarray:
        A = np.zeros((self.n, self.n))
        for e in self.net.edges:
            if e.src in self.id2idx and e.dst in self.id2idx:
                i, j = self.id2idx[e.src], self.id2idx[e.dst]
                w = 1.0 - e.risk
                A[i, j] = w
                A[j, i] = w
        return A

    def seed(self, node_id: str, severity: float = 0.8):
        idx = self.id2idx[node_id]
        self.I[idx] = severity
        self.S[idx] = 1.0 - severity

    def step(self, dt: float = 0.1) -> dict:
        new_S = self.S.copy()
        new_I = self.I.copy()
        new_R = self.R.copy()

        for i in range(self.n):
            pressure = np.dot(self.A[i], self.I) * self.beta
            dS = -pressure * self.S[i] * dt
            dI = (pressure * self.S[i] - self.gamma * self.I[i]) * dt
            dR = self.gamma * self.I[i] * dt
            new_S[i] = np.clip(self.S[i] + dS, 0, 1)
            new_I[i] = np.clip(self.I[i] + dI, 0, 1)
            new_R[i] = np.clip(self.R[i] + dR, 0, 1)

        self.S, self.I, self.R = new_S, new_I, new_R
        self._sync_nodes()
        self.history.append(dict(S=self.S.copy(), I=self.I.copy(),
                                 R=self.R.copy(), t=len(self.history) * dt))
        return dict(susceptible=self.S.sum(), infected=self.I.sum(),
                    recovered=self.R.sum(), Reff=self._Reff())

    def _sync_nodes(self):
        for i, nid in enumerate(self.ids):
            nd = self.net.nodes[nid]
            if self.I[i] > 0.5:
                nd.status = "disrupted"; nd.congestion = float(self.I[i])
            elif self.I[i] > 0.2:
                nd.status = "stressed"; nd.congestion = float(self.I[i])
            elif self.R[i] > 0.3:
                nd.status = "recovered"; nd.congestion = 0.0
            else:
                nd.status = "normal"; nd.congestion = float(self.I[i])

    def _Reff(self) -> float:
        active = self.I[self.I > 0.1]
        return float(self.beta / self.gamma * np.mean(active)) if len(active) else 0.0

    def herd_immunity_threshold(self) -> float:
        """Minimum fraction of volume to reroute to stop cascade: pc = 1 - 1/R0."""
        r0 = self.beta / self.gamma
        if r0 <= 1:
            return 0.0
        return 1.0 - 1.0 / r0

    def reset(self):
        self.S[:] = 1.0; self.I[:] = 0.0; self.R[:] = 0.0
        self.history.clear()
        for nd in self.net.nodes.values():
            nd.status = "normal"; nd.congestion = 0.0


# ─── Immune System (Antibody Memory) ─────────────────────────────────────────

class ImmuneSystem:
    """Encodes past disruption events as antibody vectors."""

    DIM = 16

    def __init__(self):
        self.threshold = 0.82
        self.library: List[dict] = []
        self._seed_antibodies()

    def _encode(self, desc: str, severity: float) -> np.ndarray:
        rng = np.random.RandomState(hash(desc) % (2**31))
        return rng.randn(self.DIM) * severity

    def _seed_antibodies(self):
        seeds = [
            dict(desc="Port congestion at Nhava Sheva — customs system outage",
                 sev=0.80, kind="port_congestion",
                 footprint=["IN-JNPT", "IN-MUM", "IN-DEL"],
                 actions=["Reroute to Mundra Port", "Pre-buffer inventory at Delhi ICD",
                           "Alert downstream partners", "Activate customs backup channel"]),
            dict(desc="Typhoon warning South China Sea — vessel delays 48-72h",
                 sev=0.70, kind="weather",
                 footprint=["CN-SHA", "CN-SZX", "SG-SIN", "IN-CHN"],
                 actions=["Activate weather alternate routes via Malacca",
                           "Increase safety stock at Chennai by 30%",
                           "Notify customers of potential 48h delays",
                           "Pre-book rail for Shanghai-Ningbo segment"]),
            dict(desc="Suez Canal blockage — rerouting via Cape of Good Hope",
                 sev=0.95, kind="geopolitical",
                 footprint=["NL-RTM", "AE-DXB", "IN-JNPT", "DE-HAM"],
                 actions=["Switch all EU-bound cargo to Cape route",
                           "Book air freight for critical pharma cargo",
                           "Trigger force majeure clauses with carriers",
                           "Activate backup suppliers in Southeast Asia"]),
            dict(desc="Labor strike at Chennai port — 48 hour stoppage",
                 sev=0.60, kind="labor",
                 footprint=["IN-CHN", "IN-BLR", "IN-VIZ"],
                 actions=["Divert to Visakhapatnam Port",
                           "Arrange road transport from Vizag to Bangalore",
                           "Communicate timeline to stakeholders",
                           "Pre-position trucks at Vizag for rapid unloading"]),
            dict(desc="Red Sea security incident — insurance premium spike 200%",
                 sev=0.85, kind="security",
                 footprint=["AE-DXB", "NL-RTM", "IN-JNPT", "IN-MUN"],
                 actions=["Increase insurance coverage for Gulf route",
                           "Reroute via Cape of Good Hope for EU cargo",
                           "Activate backup suppliers in Southeast Asia",
                           "Lock in freight rates before further increases"]),
            dict(desc="Container shortage at Shanghai — 40ft HC unavailable",
                 sev=0.55, kind="equipment",
                 footprint=["CN-SHA", "CN-SZX", "SG-SIN"],
                 actions=["Switch to 20ft standard containers where possible",
                           "Source empty containers from Ningbo depot",
                           "Consolidate shipments to reduce TEU requirement",
                           "Book priority container allocation with COSCO"]),
            dict(desc="Cyclone Biparjoy — Gujarat coast port closure 72h",
                 sev=0.90, kind="weather",
                 footprint=["IN-MUN", "IN-KND", "IN-HAZ", "IN-AMD"],
                 actions=["Evacuate port equipment and secure containers",
                           "Reroute Kandla cargo to JNPT",
                           "Activate emergency warehouse protocol at Ahmedabad",
                           "Issue force majeure notices to all affected shipments"]),
            dict(desc="Cyber attack on Indian Customs EDI system — nationwide delay",
                 sev=0.75, kind="cyber",
                 footprint=["IN-JNPT", "IN-MUN", "IN-CHN", "IN-KOL", "IN-DEL"],
                 actions=["Switch to manual customs filing procedures",
                           "Pre-clear shipments using pre-arrival documentation",
                           "Deploy backup communication channels",
                           "Alert all stakeholders of potential 24-48h delays"]),
        ]
        for s in seeds:
            self.library.append(dict(
                id=f"AB-{len(self.library)+1:04d}",
                embedding=self._encode(s["desc"], s["sev"]),
                severity=s["sev"], type=s["kind"],
                footprint=s["footprint"], description=s["desc"],
                actions=s["actions"],
            ))

    def add_antibody(self, event: dict):
        emb = self._encode(event.get("description", ""), event.get("severity", 0.5))
        self.library.append(dict(
            id=f"AB-{len(self.library)+1:04d}", embedding=emb,
            severity=event.get("severity", 0.5), type=event.get("type", "unknown"),
            footprint=event.get("footprint", []), description=event.get("description", ""),
            actions=event.get("actions", []),
        ))

    def scan(self, sensor_vec: np.ndarray) -> Optional[dict]:
        if not self.library:
            return None
        s_norm = sensor_vec / (np.linalg.norm(sensor_vec) + 1e-8)
        best, best_score = None, 0.0
        for ab in self.library:
            a_norm = ab["embedding"] / (np.linalg.norm(ab["embedding"]) + 1e-8)
            score = float(np.dot(s_norm, a_norm))
            if score > best_score and score > self.threshold:
                best_score = score
                best = ab
        if best is None:
            return None
        magnitude = best["severity"] * (1 / (1 + np.exp(-10 * (best_score - self.threshold))))
        return dict(antibody=best["id"], similarity=best_score,
                    magnitude=magnitude, actions=best["actions"],
                    dtype=best["type"], confidence=best_score * 100,
                    description=best["description"],
                    footprint=best["footprint"])

    def simulate_scan(self) -> Optional[dict]:
        vec = np.random.randn(self.DIM) * random.uniform(0.3, 1.0)
        return self.scan(vec)


# ─── Multi-Agent Route Market ────────────────────────────────────────────────

class RouteAgent:
    """One autonomous carrier agent that bids for shipments."""

    def __init__(self, aid, route, cost, hours, risk, carrier):
        self.aid = aid
        self.route = route
        self.base_cost = cost
        self.hours = hours
        self.risk = risk
        self.carrier = carrier
        self.bid = cost

    def compute_bid(self, urgency: float) -> float:
        premium = self.risk * urgency * 0.2
        discount = self.hours * 0.005 * (1 - urgency)
        self.bid = self.base_cost * (1 + premium - discount)
        return self.bid

    def score(self, urgency, risk_tol, max_cost, max_hours):
        c = self.bid / max_cost
        t = self.hours / max_hours
        r = self.risk
        return (0.4 * (1 - urgency) * (1 - c) +
                0.3 * urgency * (1 - t) +
                0.3 * risk_tol * (1 - r))


class RouteMarket:
    """Market where agents negotiate for a shipment."""

    def __init__(self):
        self.agents = [
            RouteAgent("AG-001", ["IN-JNPT", "SG-SIN", "CN-SHA"], 4200, 192, 0.25, "Maersk"),
            RouteAgent("AG-002", ["IN-JNPT", "LK-CMB", "SG-SIN", "CN-SHA"], 3800, 180, 0.18, "MSC"),
            RouteAgent("AG-003", ["IN-JNPT", "AE-DXB", "CN-SHA"], 5100, 168, 0.30, "CMA CGM"),
            RouteAgent("AG-004", ["IN-MUN", "AE-DXB", "SG-SIN", "CN-SHA"], 4500, 216, 0.22, "COSCO"),
            RouteAgent("AG-005", ["IN-CHN", "SG-SIN", "CN-SHA"], 3600, 180, 0.19, "Hapag-Lloyd"),
            RouteAgent("AG-006", ["IN-JNPT", "TH-LCH", "SG-SIN", "CN-SHA"], 3900, 204, 0.16, "ONE"),
            RouteAgent("AG-007", ["IN-MUN", "SG-SIN", "CN-SZX"], 4100, 188, 0.20, "Evergreen"),
        ]
        self.rounds: List[dict] = []

    def negotiate(self, urgency=0.7, risk_tol=0.5) -> dict:
        for a in self.agents:
            a.compute_bid(urgency)
        mc = max(a.base_cost for a in self.agents)
        mh = max(a.hours for a in self.agents)
        bids = []
        for a in self.agents:
            bids.append(dict(agent=a.aid, carrier=a.carrier, route=a.route,
                             bid=a.bid, score=a.score(urgency, risk_tol, mc, mh),
                             hours=a.hours, risk=a.risk))
        bids.sort(key=lambda b: b["score"], reverse=True)
        result = dict(winner=bids[0], all_bids=bids,
                      round=len(self.rounds) + 1, urgency=urgency)
        self.rounds.append(result)
        return result


# ─── Document Intelligence ───────────────────────────────────────────────────

class DocumentAnalyzer:
    """Financial-document anomaly detector with graph construction."""

    def __init__(self):
        self.docs = self._load_or_generate()

    def _load_or_generate(self) -> list:
        csv_path = os.path.join(DATA_DIR, "financial_documents.csv")
        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)
                docs = []
                for _, row in df.iterrows():
                    signals = row.get("signals", "")
                    docs.append(dict(
                        id=row["doc_id"], type=row["doc_type"],
                        supplier=row["supplier"], route=row["route"],
                        amount=int(row["amount"]), expected=int(row["expected_amount"]),
                        deviation=row["deviation"], terms=row["payment_terms"],
                        date=row["date"], status=row["status"],
                        signals=signals.split("|") if isinstance(signals, str) and signals else [],
                        anomaly_score=row.get("anomaly_score", abs(row["deviation"]) * 5),
                        commodity=row.get("commodity", "General"),
                    ))
                return docs
            except Exception:
                pass
        return self._fallback_docs()

    def _fallback_docs(self) -> list:
        return [
            dict(id="INV-2026-0847", type="Invoice", supplier="Shanghai Electronics Co.",
                 route="CN-SHA → IN-JNPT", amount=245000, expected=230000,
                 deviation=0.065, terms="Net 30", date="2026-04-15",
                 signals=[], status="normal", anomaly_score=0.325),
            dict(id="BL-2026-0392", type="Bill of Lading", supplier="Dubai Petrochemicals LLC",
                 route="AE-DXB → IN-MUN", amount=189000, expected=155000,
                 deviation=0.219, terms="Net 45", date="2026-04-12",
                 signals=["Cost overrun >20%", "Route surcharge detected"], status="alert",
                 anomaly_score=0.876),
            dict(id="PO-2026-0621", type="Purchase Order", supplier="Durban Mining Corp.",
                 route="ZA-DUR → IN-KOL", amount=890000, expected=720000,
                 deviation=0.236, terms="Net 60", date="2026-04-08",
                 signals=["Critical cost overrun >20%", "Expedited shipping requested"], status="critical",
                 anomaly_score=0.944),
        ]

    def summary(self) -> dict:
        return dict(
            total=len(self.docs),
            normal=sum(1 for d in self.docs if d["status"] == "normal"),
            review=sum(1 for d in self.docs if d["status"] == "review"),
            alerts=sum(1 for d in self.docs if d["status"] in ("alert", "critical")),
            avg_dev=np.mean([abs(d["deviation"]) for d in self.docs]),
            total_value=sum(d["amount"] for d in self.docs),
            flagged=[d for d in self.docs if d["status"] in ("alert", "critical")],
        )


# ─── Crowdsourced Ground Truth ──────────────────────────────────────────────

class CrowdSourceEngine:
    """Waze for Supply Chains — crowdsourced ground truth."""

    def __init__(self):
        self.voice_notes: list = []
        self.contributors: list = []
        self.verified_events: list = []
        self._load_data()

    def _load_data(self):
        vn_path = os.path.join(DATA_DIR, "voice_notes.csv")
        if os.path.exists(vn_path):
            try:
                self.voice_notes = pd.read_csv(vn_path).to_dict("records")
            except Exception:
                self.voice_notes = self._sample_voice_notes()
        else:
            self.voice_notes = self._sample_voice_notes()

        cc_path = os.path.join(DATA_DIR, "crowd_contributors.csv")
        if os.path.exists(cc_path):
            try:
                self.contributors = pd.read_csv(cc_path).to_dict("records")
            except Exception:
                self.contributors = self._sample_contributors()
        else:
            self.contributors = self._sample_contributors()

    def _sample_voice_notes(self) -> list:
        return [
            dict(note_id="VN-00001", timestamp="2026-04-27 08:15:00",
                 location_name="Nhava Sheva Port Gate 4", node_id="IN-JNPT",
                 lat=18.95, lon=72.95, language="Hindi", category="congestion",
                 duration_sec=12, contributor_id="CROWD-0001",
                 credibility_score=0.85, verified=True, severity=0.72,
                 nearby_reports=8),
            dict(note_id="VN-00002", timestamp="2026-04-27 09:30:00",
                 location_name="Chennai Harbor Road", node_id="IN-CHN",
                 lat=13.10, lon=80.30, language="Tamil", category="customs_delay",
                 duration_sec=8, contributor_id="CROWD-0015",
                 credibility_score=0.78, verified=True, severity=0.55,
                 nearby_reports=5),
            dict(note_id="VN-00003", timestamp="2026-04-27 10:45:00",
                 location_name="Mumbai-Pune Expressway", node_id="IN-MUM",
                 lat=18.75, lon=73.25, language="Marathi", category="accident",
                 duration_sec=15, contributor_id="CROWD-0042",
                 credibility_score=0.92, verified=False, severity=0.65,
                 nearby_reports=3),
        ]

    def _sample_contributors(self) -> list:
        return [
            dict(contributor_id="CROWD-0001", total_reports=156, verified_reports=142,
                 state="Maharashtra", primary_language="Hindi",
                 credibility_score=0.91, role="truck_driver", impact_score=45),
            dict(contributor_id="CROWD-0015", total_reports=89, verified_reports=76,
                 state="Tamil Nadu", primary_language="Tamil",
                 credibility_score=0.85, role="clearing_agent", impact_score=32),
        ]

    def stats(self) -> dict:
        total = len(self.voice_notes)
        verified = sum(1 for v in self.voice_notes if v.get("verified"))
        active_contributors = len(set(v.get("contributor_id", "") for v in self.voice_notes))
        avg_cred = np.mean([v.get("credibility_score", 0.5) for v in self.voice_notes]) if self.voice_notes else 0
        categories = {}
        for v in self.voice_notes:
            cat = v.get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1
        return dict(
            total_reports=total, verified=verified,
            verification_rate=verified / max(total, 1),
            active_contributors=active_contributors,
            avg_credibility=avg_cred,
            categories=categories,
            network_value=active_contributors ** 1.5 if active_contributors else 0,
        )


# ─── Acoustic Anomaly Detection ─────────────────────────────────────────────

class AcousticDetector:
    """Container acoustic anomaly detection simulation."""

    def __init__(self):
        self.readings: list = []
        self.containers: Dict[str, dict] = {}
        self._load_data()

    def _load_data(self):
        path = os.path.join(DATA_DIR, "acoustic_anomalies.csv")
        if os.path.exists(path):
            try:
                self.readings = pd.read_csv(path).to_dict("records")
            except Exception:
                self.readings = self._sample_readings()
        else:
            self.readings = self._sample_readings()

        for r in self.readings:
            cid = r.get("container_id", "UNKNOWN")
            if cid not in self.containers:
                self.containers[cid] = dict(
                    id=cid, status="unknown",
                    latest_anomaly=r.get("anomaly_score", 0),
                    anomaly_type=r.get("anomaly_type", "none"),
                    node=r.get("node_id", ""),
                )
            if r.get("anomaly_type", "none") != "none":
                self.containers[cid]["status"] = "anomaly"
                self.containers[cid]["anomaly_type"] = r["anomaly_type"]
            else:
                self.containers[cid]["status"] = "normal"

    def _sample_readings(self) -> list:
        return [
            dict(reading_id="ACU-000001", timestamp="2026-04-27 06:00:00",
                 container_id="MSCU-7234567", anomaly_type="refrigeration_failure",
                 anomaly_score=0.87, dominant_freq_hz=1850, rms_energy=0.78,
                 zero_crossing_rate=125, mel_band_50_db=-22, mel_band_100_db=-18,
                 node_id="IN-JNPT", temperature_c=6.2, alert_status="critical"),
            dict(reading_id="ACU-000002", timestamp="2026-04-27 06:01:00",
                 container_id="MSCU-9876543", anomaly_type="none",
                 anomaly_score=0.12, dominant_freq_hz=120, rms_energy=0.15,
                 zero_crossing_rate=12, mel_band_50_db=-55, mel_band_100_db=-50,
                 node_id="IN-CHN", temperature_c=4.8, alert_status="normal"),
        ]

    def stats(self) -> dict:
        total = len(self.readings)
        anomalies = sum(1 for r in self.readings if r.get("anomaly_type", "none") != "none")
        types = {}
        for r in self.readings:
            at = r.get("anomaly_type", "none")
            if at != "none":
                types[at] = types.get(at, 0) + 1
        return dict(
            total_readings=total, anomaly_count=anomalies,
            anomaly_rate=anomalies / max(total, 1),
            types=types,
            monitored_containers=len(self.containers),
        )


# ─── Explainability Engine ───────────────────────────────────────────────────

class ExplainabilityEngine:
    """Generates natural-language explanations for NEXUS decisions."""

    @staticmethod
    def explain_disruption(node_name: str, Reff: float, matched_antibodies: list,
                           affected_nodes: list) -> str:
        parts = [f"**Disruption Analysis for {node_name}**\n\n"]
        if Reff > 1.5:
            parts.append(f"CRITICAL: R-effective is **{Reff:.2f}** (>1.5). This disruption is actively cascading through the network. ")
            parts.append(f"Approximately **{int((1 - 1/Reff)*100)}%** of cargo volume must be rerouted to achieve herd immunity and stop the cascade.\n\n")
        elif Reff > 1.0:
            parts.append(f"WARNING: R-effective is **{Reff:.2f}** (>1.0). The disruption is spreading but can still be contained with targeted intervention.\n\n")
        else:
            parts.append(f"STABLE: R-effective is **{Reff:.2f}** (<1.0). The disruption is self-containing. Monitor for secondary effects.\n\n")

        if matched_antibodies:
            parts.append(f"**Immune Memory Match** ({len(matched_antibodies)} pattern(s)):\n")
            for ab in matched_antibodies[:3]:
                parts.append(f"- {ab.get('antibody', 'Unknown')}: \"{ab.get('description', 'N/A')[:80]}\" "
                             f"(similarity: {ab.get('similarity', 0):.1%})\n")
            parts.append("\n")

        if affected_nodes:
            parts.append(f"**Cascade Path** ({len(affected_nodes)} downstream nodes at risk):\n")
            for n in affected_nodes[:5]:
                parts.append(f"- {n}\n")

        parts.append("\n**Recommended Actions**:\n")
        parts.append("1. Activate immune response protocol\n")
        parts.append("2. Pre-buffer inventory at downstream nodes\n")
        parts.append("3. Engage alternate route market agents\n")

        return "".join(parts)

    @staticmethod
    def explain_route(carrier: str, bid: float, score: float, hours: int,
                      risk: float, urgency: float) -> str:
        parts = [f"**Route Selection Explanation: {carrier}**\n\n"]
        if urgency > 0.7:
            parts.append(f"This shipment is flagged as **urgent** (urgency={urgency:.0%}). ")
            parts.append(f"{carrier} was selected because it offers the best tradeoff between transit time ({hours}h) and risk ({risk:.0%}).\n\n")
        else:
            parts.append(f"With standard urgency (urgency={urgency:.0%}), {carrier} provides the most cost-effective route at ${bid:,.0f} ")
            parts.append(f"while maintaining acceptable risk levels ({risk:.0%}).\n\n")

        if risk > 0.25:
            parts.append(f"⚠ This route carries elevated risk ({risk:.0%}). Recommend activating insurance coverage and pre-positioning backup inventory at the destination.\n")

        parts.append(f"\n**Composite Score**: {score:.4f} (weighted across cost efficiency, transit time, and risk tolerance)\n")

        return "".join(parts)

    @staticmethod
    def explain_document(doc: dict) -> str:
        parts = [f"**Document Analysis: {doc['id']}**\n\n"]
        dev = doc.get("deviation", 0)
        parts.append(f"Type: {doc['type']} | Supplier: {doc['supplier']}\n")
        parts.append(f"Amount: ${doc['amount']:,} vs Expected: ${doc['expected']:,} (deviation: {dev:+.1%})\n\n")

        if abs(dev) > 0.20:
            parts.append(f"🔴 **CRITICAL ANOMALY**: Deviation exceeds 20% threshold. ")
            parts.append("This may indicate cost manipulation, unauthorized intermediaries, or force majeure surcharges.\n\n")
            if doc.get("signals"):
                parts.append("**Detected Signals**:\n")
                for s in doc["signals"]:
                    parts.append(f"- {s}\n")
        elif abs(dev) > 0.10:
            parts.append(f"🟠 **ALERT**: Deviation exceeds 10%. Further review recommended.\n")
        else:
            parts.append(f"🟢 **NORMAL**: Within expected variance bands.\n")

        return "".join(parts)


# ─── Real-time Data Generator ────────────────────────────────────────────────

def generate_alerts(network: SupplyChainNetwork, sir: SIRModel) -> dict:
    alerts = []
    for nid, nd in network.nodes.items():
        if nd.status == "disrupted":
            alerts.append(dict(type="CRITICAL", node=nd.name, node_id=nid,
                               msg=f"Disruption at {nd.name} ({nd.congestion:.0%})",
                               severity=nd.congestion,
                               action="Activate immune response & reroute"))
        elif nd.status == "stressed":
            alerts.append(dict(type="WARNING", node=nd.name, node_id=nid,
                               msg=f"Stress at {nd.name} ({nd.congestion:.0%})",
                               severity=nd.congestion,
                               action="Monitor & pre-buffer inventory"))
    return dict(alerts=sorted(alerts, key=lambda a: a["severity"], reverse=True),
                health=1 - np.mean(sir.I),
                disruption_idx=np.mean(sir.I),
                Reff=sir._Reff())


# ─── Unified Risk Engine ──────────────────────────────────────────────────────

class RiskEngine:
    """Cross-module composite risk scoring (0-100)."""

    WEIGHTS = dict(sir=0.30, docs=0.25, crowd=0.20, immune=0.25)

    def __init__(self, network, sir, doc_analyzer, crowd, immune):
        self.net = network
        self.sir = sir
        self.docs = doc_analyzer
        self.crowd = crowd
        self.immune = immune

    def node_risk(self, node_id: str) -> dict:
        idx = self.sir.id2idx.get(node_id)
        sir_score = float(self.sir.I[idx]) * 100 if idx is not None else 0

        flagged = [d for d in self.docs.docs
                   if node_id in d.get("route", "") and d["status"] in ("alert", "critical")]
        doc_score = min(100, len(flagged) * 15)

        reports = [v for v in self.crowd.voice_notes
                   if v.get("node_id") == node_id and v.get("verified")]
        crowd_score = min(100, np.mean([v["severity"] for v in reports]) * 120) if reports else 0

        immune_score = 0
        for ab in self.immune.library:
            if node_id in ab.get("footprint", []):
                immune_score = max(immune_score, ab["severity"] * 100)

        composite = (self.WEIGHTS["sir"] * sir_score +
                     self.WEIGHTS["docs"] * doc_score +
                     self.WEIGHTS["crowd"] * crowd_score +
                     self.WEIGHTS["immune"] * immune_score)
        return dict(node_id=node_id, composite=round(composite, 1),
                    breakdown=dict(sir=round(sir_score, 1), docs=round(doc_score, 1),
                                   crowd=round(crowd_score, 1), immune=round(immune_score, 1)))

    def all_node_risks(self) -> list:
        return [self.node_risk(nid) for nid in self.net.nodes]

    def shipment_risk(self, row: dict) -> dict:
        o = self.node_risk(row.get("origin_id", ""))
        d = self.node_risk(row.get("dest_id", ""))
        composite = (o["composite"] + d["composite"]) / 2
        if row.get("disruption_flag"):
            composite = min(100, composite * 1.4)
        return dict(shipment_id=row.get("shipment_id", ""),
                    origin_risk=o, dest_risk=d, composite=round(composite, 1))

    def network_health(self) -> float:
        risks = self.all_node_risks()
        return round(100 - np.mean([r["composite"] for r in risks]), 1)

    def top_risks(self, n=10) -> list:
        return sorted(self.all_node_risks(), key=lambda r: r["composite"], reverse=True)[:n]


# ─── Scenario Sandbox ──────────────────────────────────────────────────────────

class ScenarioEngine:
    """What-if scenario simulation with state save/restore."""

    PRESETS = {
        "Suez Canal Closure (7 days)": dict(
            seed_nodes=["AE-DXB", "NL-RTM", "DE-HAM"], severity=0.95, beta_mult=1.5,
            description="Simulates Suez Canal blockage affecting EU-Asia trade routes"),
        "Cyclone hits Gujarat": dict(
            seed_nodes=["IN-MUN", "IN-KND", "IN-HAZ"], severity=0.90, beta_mult=1.3,
            description="Cyclone Biparjoy-scale event closing Gujarat ports"),
        "Fuel price spike 30%": dict(
            seed_nodes=[], severity=0.0, beta_mult=1.0, cost_mult=1.30,
            description="Global bunker fuel price increase raising all shipping costs"),
        "New warehouse in Hyderabad": dict(
            seed_nodes=[], severity=0.0, beta_mult=0.8,
            description="Added capacity reduces network strain, improving recovery"),
    }

    def __init__(self, network, sir):
        self.net = network
        self.sir = sir

    def run_scenario(self, preset_name: str) -> dict:
        config = self.PRESETS[preset_name]
        before_health = 1 - np.mean(self.sir.I)

        saved_S, saved_I, saved_R = self.sir.S.copy(), self.sir.I.copy(), self.sir.R.copy()
        saved_beta = self.sir.beta
        before_hist_len = len(self.sir.history)

        try:
            if config.get("beta_mult"):
                self.sir.beta = saved_beta * config["beta_mult"]
            for nid in config.get("seed_nodes", []):
                if nid in self.sir.id2idx:
                    self.sir.seed(nid, config.get("severity", 0.8))
            for _ in range(30):
                self.sir.step()

            after_health = 1 - np.mean(self.sir.I)
            scenario_history = self.sir.history[before_hist_len:]
            affected = [nid for nid in self.sir.id2idx if self.sir.I[self.sir.id2idx[nid]] > 0.2]
            cost = len(affected) * 150000
        finally:
            self.sir.S, self.sir.I, self.sir.R = saved_S, saved_I, saved_R
            self.sir.beta = saved_beta
            self.sir.history = self.sir.history[:before_hist_len]
            self.sir._sync_nodes()

        return dict(name=preset_name, description=config["description"],
                    before_health=round(before_health * 100, 1),
                    after_health=round(after_health * 100, 1),
                    health_delta=round((after_health - before_health) * 100, 1),
                    affected_nodes=affected, cost_estimate=cost,
                    scenario_history=scenario_history)


# ─── Decision Audit Log ───────────────────────────────────────────────────────

class DecisionLog:
    """Audit trail for all user actions with learning feedback."""

    def __init__(self):
        self.entries: List[dict] = []

    def log(self, action_type: str, target: str, details: dict = None):
        import datetime as _dt
        self.entries.append(dict(
            timestamp=_dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            action_type=action_type, target=target,
            details=details or {}))

    def reroute_entries(self) -> list:
        return [e for e in self.entries if e["action_type"] == "reroute"]

    def summary(self) -> dict:
        types = {}
        for e in self.entries:
            types[e["action_type"]] = types.get(e["action_type"], 0) + 1
        return dict(total=len(self.entries), by_type=types)

    def agent_trust_scores(self, market) -> dict:
        reroutes = self.reroute_entries()
        if not reroutes:
            return {}
        scores = {}
        for r in reroutes:
            carrier = r["details"].get("carrier", "unknown")
            outcome = r["details"].get("outcome", "pending")
            if carrier not in scores:
                scores[carrier] = dict(total=0, positive=0)
            scores[carrier]["total"] += 1
            if outcome in ("accepted", "delivered_on_time"):
                scores[carrier]["positive"] += 1
        return {k: round(v["positive"] / v["total"], 2) for k, v in scores.items()}


# ─── Situation Briefing ────────────────────────────────────────────────────────

class SituationBriefing:
    """Generates executive situation briefings."""

    def __init__(self, risk_engine, decision_log, network, sir, crowd, doc_analyzer):
        self.risk = risk_engine
        self.log = decision_log
        self.net = network
        self.sir = sir
        self.crowd = crowd
        self.docs = doc_analyzer

    def generate(self) -> str:
        risks = self.risk.top_risks(5)
        Reff = self.sir._Reff()
        health = self.risk.network_health()
        log_s = self.log.summary()
        high_risk = [r for r in self.risk.all_node_risks() if r["composite"] > 40]
        crowd_s = self.crowd.stats()
        doc_s = self.docs.summary()

        parts = [f"**Network Health:** {health}/100 | **R-effective:** {Reff:.2f} | "
                 f"**High-Risk Nodes:** {len(high_risk)} | "
                 f"**Crowd Reports:** {crowd_s['total_reports']:,} | "
                 f"**Doc Anomalies:** {doc_s['alerts']}"]

        if risks and risks[0]["composite"] > 20:
            parts.append(f"\n### Top Risk: {self.net.nodes.get(risks[0]['node_id'], type('obj',(object,),{'name':risks[0]['node_id']})()).name} "
                         f"({risks[0]['composite']}/100)")
            bd = risks[0]["breakdown"]
            parts.append(f"SIR: {bd['sir']} | Docs: {bd['docs']} | Crowd: {bd['crowd']} | Immune: {bd['immune']}")

        if Reff > 1.0:
            pc = self.sir.herd_immunity_threshold()
            parts.append(f"\n**CRITICAL — Cascade Active.** R-effective {Reff:.2f} > 1. "
                         f"Reroute {pc:.0%} of volume to achieve herd immunity.")
        elif high_risk:
            parts.append(f"\n**Action Required:** {len(high_risk)} nodes above risk threshold 40. "
                         "Review and prioritize by composite score.")

        if log_s["total"]:
            parts.append(f"\n**Decisions today:** {log_s['total']} — {log_s['by_type']}")

        parts.append(f"\n### Recommendations")
        if Reff > 1.0:
            parts.append("1. Activate herd immunity rerouting immediately")
        parts.append("2. Review document anomalies on affected trade routes")
        parts.append("3. Cross-check crowd reports with immune memory matches")
        if doc_s["alerts"] > 5:
            parts.append(f"4. Elevated document anomalies ({doc_s['alerts']}) — compliance review needed")

        return "\n".join(parts)

    def generate_gemini(self, api_key: str) -> str:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            context = self.generate()
            prompt = (f"You are NEXUS, a supply chain intelligence assistant. Based on this data, "
                     f"write a concise executive briefing with: active disruptions, shipments at risk, "
                     f"recommended actions, and cost projections. Use bullet points. Data:\n\n{context}")
            resp = model.generate_content(prompt)
            return resp.text
        except Exception as e:
            return self.generate() + f"\n\n*[Gemini unavailable: {str(e)[:60]}]*"


# ─── Historical Trend Analyzer ─────────────────────────────────────────────────

class HistoricalAnalyzer:
    """Analyzes disruption_events.csv for trends over time."""

    def __init__(self, disruptions_df: pd.DataFrame, shipments_df: pd.DataFrame):
        self.disr_df = disruptions_df
        self.ship_df = shipments_df

    def health_trend_30d(self) -> pd.DataFrame:
        if self.disr_df.empty:
            return pd.DataFrame()
        df = self.disr_df.copy()
        df["date"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("date")
        daily = df.groupby(df["date"].dt.date).agg(
            event_count=("event_id", "count"),
            avg_severity=("severity", "mean"),
            total_loss=("economic_loss_usd", "sum"),
        ).reset_index()
        daily["health_score"] = (100 - (daily["avg_severity"] * 100).clip(0, 100)).round(1)
        return daily

    def week_comparison(self) -> dict:
        if self.disr_df.empty:
            return dict(this_week=0, last_week=0, delta=0, this_loss=0, last_loss=0)
        df = self.disr_df.copy()
        df["date"] = pd.to_datetime(df["timestamp"])
        latest = df["date"].max()
        this_w = df[df["date"] > latest - pd.Timedelta(days=7)]
        last_w = df[(df["date"] <= latest - pd.Timedelta(days=7)) &
                     (df["date"] > latest - pd.Timedelta(days=14))]
        return dict(this_week=len(this_w), last_week=len(last_w),
                    delta=len(this_w) - len(last_w),
                    this_loss=int(this_w["economic_loss_usd"].sum()),
                    last_loss=int(last_w["economic_loss_usd"].sum()))

    def most_disrupted(self, top_n=10) -> pd.DataFrame:
        if self.disr_df.empty:
            return pd.DataFrame()
        return (self.disr_df.groupby("port_name")
                .agg(events=("event_id", "count"), avg_severity=("severity", "mean"),
                     total_loss=("economic_loss_usd", "sum"), avg_recovery_h=("recovery_hours", "mean"))
                .sort_values("events", ascending=False).head(top_n).reset_index())

    def fastest_recovery(self, top_n=10) -> pd.DataFrame:
        if self.disr_df.empty:
            return pd.DataFrame()
        return (self.disr_df[self.disr_df["status"] == "resolved"]
                .groupby("port_name")
                .agg(avg_recovery_h=("recovery_hours", "mean"), events=("event_id", "count"))
                .sort_values("avg_recovery_h").head(top_n).reset_index())
