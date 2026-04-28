# NEXUS — Neural Supply Chain Organism

**Real-time supply chain disruption intelligence platform** that combines epidemiological modeling, AI-powered anomaly detection, and market-based route optimization to predict, detect, and respond to global supply chain disruptions.

Built for Google Hackathon 2026.

---

## Problem Statement

Global supply chains face cascading disruptions — port congestions, geopolitical events, natural disasters — with no unified intelligence layer to predict and respond in real time. NEXUS treats the supply chain as a living organism, applying epidemiological models (SIR), immune-system-inspired AI, and game-theory auctions to keep goods moving.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         React 19 · TypeScript · Vite             │
│     Tailwind CSS · Recharts · Framer Motion      │
│         Zustand · Google Maps Platform            │
└──────────────────────┬───────────────────────────┘
                       │  REST API (proxy /api)
┌──────────────────────┴───────────────────────────┐
│                   Backend                         │
│          FastAPI · Uvicorn · Python 3.12          │
│            NumPy · Pandas · Pydantic              │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────┐
│              Simulation Engine                     │
│  SIR Model · RouteMarket · ImmuneSystem           │
│  ScenarioEngine · DecisionLog · DataLoader        │
└───────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 6, Vite 8, Tailwind CSS 3 |
| **State Management** | Zustand 5 |
| **Data Visualization** | Recharts 3 (bar, scatter, radar, area charts) |
| **Animations** | Framer Motion 12 |
| **Maps** | Google Maps Platform (Vis.gl React wrapper) |
| **Routing** | React Router 7 (HashRouter) |
| **Backend** | FastAPI, Uvicorn, Python 3.12 |
| **Data Processing** | NumPy, Pandas |
| **Validation** | Pydantic v2 |

---

## Features

### 1. Command Center
Real-time operational dashboard with network health metrics, live alert feed, disruption timeline, and top disrupted routes. Single pane of glass for supply chain operators.

### 2. Global Supply Chain Network
Interactive network visualization of 31 nodes (major ports, ICDs, carrier hubs, airports) and 99 weighted trade lanes. Color-coded by SIR infection state with real-time simulation controls.

### 3. Epidemiological Disruption Model
Full SIR (Susceptible-Infected-Recovered) simulation engine modeling disruption cascades across the supply chain network. Tracks R₀ (reproduction number), herd immunity thresholds, and infection trajectories over time.

### 4. Immune Intelligence
AI-powered anomaly detection system inspired by biological immune systems. Uses cosine similarity matching against 8 disruption pattern antibodies with configurable threshold (τ = 0.82). Triggers automated response actions when threats are detected.

### 5. Route Negotiation Market
Multi-agent Vickrey second-price auction where 7+ carrier agents submit sealed bids. Winners pay the second-highest price, ensuring truthful bidding. Congestion pricing and SIR risk premiums are factored into composite scoring.

### 6. Document Scanner
Upload and analyze trade documents (invoices, bills of lading, customs declarations) with anomaly scoring. GraphSAGE pipeline detects entity irregularities, payment stress indicators, and round-trip transactions. **Registered documents can create new carrier agents** that participate in the Route Market.

### 7. Live Traffic & Routes
Google Maps integration showing global trade routes, port congestion zones, and real-time traffic layers. Interactive port markers with SIR state overlays and risk severity indicators.

### 8. Shipment Tracker
Track individual shipments with composite risk scoring (70% shipment risk + 30% network infection risk), status filtering (in-transit, delayed, disrupted), and one-click reroute actions.

### 9. Scenario Sandbox
"What-if" disruption simulator with preset scenarios (Suez Canal closure, cyclone events, fuel spikes, new warehouse capacity). Runs 30-step SIR projections and estimates health delta and economic impact.

### 10. Network Trends
Historical analysis of disruption patterns, recovery trajectories, and network health over time. Identifies seasonal patterns and predicts future disruption windows.

### 11. Decision History
Complete audit trail of all user actions (route acceptances, reroutes, investigations, scenario runs) with agent trust scoring and decision analytics.

---

## Core Simulation Engine

| Component | Description |
|---|---|
| **SIRModel** | Epidemiological engine tracking 31 nodes through S → I → R transitions with configurable β (transmission) and γ (recovery) parameters |
| **RouteMarket** | Vickrey auction with dynamic carrier agents, congestion-adjusted bidding, and second-price settlement |
| **ImmuneSystem** | Pattern matching engine using cosine similarity against antibody library for real-time threat detection |
| **ScenarioEngine** | Disruption projection engine that seeds events and simulates 30-step cascades with cost estimation |
| **DecisionLog** | Persistent action ledger with timestamp, action type, target, and metadata tracking |
| **DataLoader** | CSV-based data pipeline for shipments, documents, disruptions, and crowd-sourced intelligence |

---

## Project Structure

```
hack_google/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── simulation.py           # Core simulation engine (SIR, Market, Immune, Scenarios)
│   ├── requirements.txt        # Python dependencies
│   └── routers/
│       ├── health.py           # Command center aggregation
│       ├── network.py          # Network topology & SIR state
│       ├── sir.py              # SIR simulation control
│       ├── market.py           # Route negotiation & carrier management
│       ├── documents.py        # Document upload & anomaly detection
│       ├── shipments.py        # Shipment tracking & stats
│       ├── immune.py           # Immune system scanning
│       ├── scenarios.py        # Scenario sandbox
│       ├── disruptions.py      # Historical disruption data
│       ├── decisions.py        # Decision logging
│       └── crowd.py            # Crowd-sourced intelligence
├── web/
│   ├── package.json
│   ├── vite.config.ts          # Vite config with API proxy
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx             # Router configuration
│       ├── api/                # API client & React Query hooks
│       ├── components/         # Shared UI components
│       ├── data/               # Mock data & constants
│       ├── pages/              # 11 page components
│       ├── store/              # Zustand state store
│       ├── types/              # TypeScript type definitions
│       └── utils/              # Helper functions
├── data/
│   ├── disruption_events.csv
│   ├── financial_documents.csv
│   ├── historical_shipments.csv
│   ├── crowd_contributors.csv
│   └── voice_notes.csv
└── README.md
```

---

## Setup

### Prerequisites

- **Node.js** >= 18
- **Python** >= 3.12
- **Google Maps API Key** (optional, for Live Traffic map)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd web
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. API calls are proxied to the backend via Vite.

### 3. Google Maps (Optional)

Create a `.env` file in the `web/` directory:

```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

Requires **Maps JavaScript API** enabled in Google Cloud Console.

---

## How It Works

1. **Monitor** — The SIR model continuously simulates disruption spread across 31 supply chain nodes. The Command Center shows real-time health metrics and alerts.

2. **Detect** — The Immune Intelligence module scans for anomalies using cosine similarity against known disruption patterns, triggering automated responses.

3. **Respond** — The Route Market runs Vickrey auctions to find optimal alternative routes. Documents can register new carrier agents. Operators can reroute shipments with one click.

4. **Simulate** — The Scenario Sandbox lets operators test "what-if" disruptions (port closures, cyclones, geopolitical events) and see projected impact before committing.

5. **Learn** — Every decision is logged and tracked. Network Trends analyzes historical patterns to improve future predictions.

---

## License

Competition project — all rights reserved.
