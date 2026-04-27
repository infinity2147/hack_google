"""
NEXUS — Neural Supply Chain Organism
Google Solution Challenge India 2026
Main Streamlit Application — Production SaaS Quality UI
"""

import streamlit as st
import numpy as np
import pandas as pd
import os
import time

import simulation as sim
import visualizations as viz

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# ─── Page Config ──────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="NEXUS — Neural Supply Chain Organism",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Custom Theme CSS ─────────────────────────────────────────────────────────

st.markdown("""<style>
    /* Global */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    .block-container { padding-top: 1.2rem; padding-bottom: 2rem; font-family: 'Inter', sans-serif; }
    .stApp { background: #0a0e17; }

    /* Sidebar */
    section[data-testid="stSidebar"] { background: linear-gradient(180deg, #0d1117 0%, #0a0e17 100%); }
    section[data-testid="stSidebar"] .sidebar-content { border-right: 1px solid #1e2736; }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] { gap: 4px; background: #1a1a2e; border-radius: 10px; padding: 4px; }
    .stTabs [data-baseweb="tab"] { padding: 8px 18px; font-size: 13px; font-weight: 500; border-radius: 8px; color: #888; }
    .stTabs [data-baseweb="tab"]:hover { color: #ccc; }
    .stTabs [data-baseweb="tab"][aria-selected="true"] { background: #00d4aa22; color: #00d4aa; }

    /* Metric cards */
    div[data-testid="stMetric"] { background: #1a1a2e; border-radius: 12px;
        padding: 14px; border-left: 3px solid #00d4aa; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    div[data-testid="stMetricValue"] { font-size: 24px; font-weight: 700; }
    div[data-testid="stMetricLabel"] { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Dataframe */
    .stDataFrame { border-radius: 10px; overflow: hidden; }
    table { border-collapse: separate; border-spacing: 0; }
    thead tr th { background: #1a1a2e !important; color: #00d4aa !important;
        font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #00d4aa44 !important; }
    tbody tr td { background: #0e1117 !important; color: #ccc !important; font-size: 12px; border-bottom: 1px solid #1a1a2e !important; }
    tbody tr:hover td { background: #1a1a2e !important; }

    /* Buttons */
    .stButton > button { border-radius: 8px; font-weight: 600; transition: all 0.2s; }
    .stButton > button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,212,170,0.2); }

    /* Sidebar nav */
    .nav-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
        color: #555; margin-top: 8px; margin-bottom: 4px; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0a0e17; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }

    /* Expander */
    .streamlit-expanderHeader { background: #1a1a2e; border-radius: 8px; font-size: 13px; }

    /* Section headers */
    .section-header { font-size: 18px; font-weight: 700; color: #fff;
        margin: 20px 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #1e2736; }

    /* Animations */
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .pulse { animation: pulse 2s infinite; }

    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); } }
    .slide-in { animation: slideIn 0.4s ease-out; }
</style>""", unsafe_allow_html=True)


# ─── Helper Functions ─────────────────────────────────────────────────────────

def load_csv(name: str) -> pd.DataFrame:
    path = os.path.join(DATA_DIR, name)
    if os.path.exists(path):
        try:
            return pd.read_csv(path)
        except Exception:
            return pd.DataFrame()
    return pd.DataFrame()


def section_header(text: str, icon: str = ""):
    st.markdown(f'<div class="section-header">{icon} {text}</div>', unsafe_allow_html=True)


# ─── Session State Init ──────────────────────────────────────────────────────

if "network" not in st.session_state:
    st.session_state.network = sim.SupplyChainNetwork()
    st.session_state.sir = sim.SIRModel(st.session_state.network)
    st.session_state.immune = sim.ImmuneSystem()
    st.session_state.market = sim.RouteMarket()
    st.session_state.doc_analyzer = sim.DocumentAnalyzer()
    st.session_state.crowd = sim.CrowdSourceEngine()
    st.session_state.acoustic = sim.AcousticDetector()
    st.session_state.explainer = sim.ExplainabilityEngine()
    st.session_state.scan_log: list = []
    st.session_state.shipments_df = load_csv("historical_shipments.csv")
    st.session_state.disruptions_df = load_csv("disruption_events.csv")
    st.session_state.sensor_df = load_csv("sensor_readings.csv")

net = st.session_state.network
sir = st.session_state.sir
immune = st.session_state.immune
market = st.session_state.market
doc_an = st.session_state.doc_analyzer
crowd = st.session_state.crowd
acoustic = st.session_state.acoustic
explainer = st.session_state.explainer
shipments_df = st.session_state.shipments_df
disruptions_df = st.session_state.disruptions_df

# ─── Sidebar ──────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("""
    <div style="text-align:center;padding:10px 0">
        <div style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#00d4aa,#4fc3f7);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent">NEXUS</div>
        <div style="font-size:11px;color:#666;margin-top:2px">Neural Supply Chain Organism</div>
    </div>""", unsafe_allow_html=True)
    st.divider()

    st.markdown('<div class="nav-label">Dashboard</div>', unsafe_allow_html=True)
    page = st.radio(
        "Navigation",
        ["Command Center", "Global Network", "Epidemiological Model",
         "Immune Intelligence", "Route Market", "Document Scanner",
         "Crowd Intelligence", "Acoustic Monitoring"],
        label_visibility="collapsed",
    )

    st.divider()
    st.markdown('<div class="nav-label">Simulation Controls</div>', unsafe_allow_html=True)

    seed_node = st.selectbox("Seed Disruption At",
                             options=list(net.nodes.keys()),
                             format_func=lambda x: net.nodes[x].name,
                             index=0)
    seed_sev = st.slider("Severity", 0.3, 1.0, 0.8, 0.1)

    if st.button("⚡ Seed Disruption", use_container_width=True):
        sir.seed(seed_node, seed_sev)
        st.toast(f"Disruption seeded at {net.nodes[seed_node].name}", icon="⚡")

    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("▶ Step", use_container_width=True):
            sir.step()
    with col2:
        if st.button("▶▶×10", use_container_width=True):
            for _ in range(10):
                sir.step()
    with col3:
        if st.button("▶▶×50", use_container_width=True):
            for _ in range(50):
                sir.step()

    if st.button("🔄 Reset Simulation", use_container_width=True):
        sir.reset()

    st.divider()
    with st.expander("⚙ SIR Parameters"):
        sir.beta = st.slider("β (transmission rate)", 0.05, 0.80, sir.beta, 0.05)
        sir.gamma = st.slider("γ (recovery rate)", 0.01, 0.40, sir.gamma, 0.01)
        r0 = sir.beta / sir.gamma
        pc = sir.herd_immunity_threshold()
        st.markdown(f"""
        <div style="background:#1a1a2e;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:11px;color:#888">R₀ (Basic Reproduction)</div>
            <div style="font-size:28px;font-weight:700;color:{('#ff3333' if r0 > 1 else '#00d4aa')}">{r0:.2f}</div>
            <div style="font-size:11px;color:#888;margin-top:6px">Herd Immunity Threshold</div>
            <div style="font-size:20px;font-weight:700;color:#ff6b35">{pc:.1%}</div>
            <div style="font-size:10px;color:#666">Min. volume to reroute to stop cascade</div>
        </div>""", unsafe_allow_html=True)

    st.divider()
    st.markdown("""
    <div style="text-align:center;padding:8px 0">
        <div style="font-size:10px;color:#444">Google Solution Challenge India 2026</div>
        <div style="font-size:10px;color:#333;margin-top:2px">Gemini 1.5 Pro · Google Cloud · Vertex AI</div>
    </div>""", unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGES
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Command Center ──────────────────────────────────────────────────────────

if page == "Command Center":
    st.markdown("""
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="font-size:32px;font-weight:800;background:linear-gradient(135deg,#00d4aa,#4fc3f7);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent">NEXUS</div>
        <div style="font-size:16px;color:#666">Command Center</div>
    </div>""", unsafe_allow_html=True)
    st.markdown("---")

    # KPI row
    rt = sim.generate_alerts(net, sir)
    ds = doc_an.summary()
    cs = crowd.stats()
    ac = acoustic.stats()
    pc = sir.herd_immunity_threshold()

    kpi_cols = st.columns(7)
    kpi_data = [
        ("Network Health", f"{rt['health']:.0%}", "#00d4aa", "🟢"),
        ("Disruption Idx", f"{rt['disruption_idx']:.1%}", "#ff6b35", "⚠️"),
        ("R effective", f"{rt['Reff']:.2f}", "#ff3333" if rt['Reff'] > 1 else "#00d4aa", "🔬"),
        ("Active Alerts", str(len(rt["alerts"])), "#ff3333" if rt["alerts"] else "#00d4aa", "🚨"),
        ("Doc Anomalies", str(ds["alerts"]), "#ff3333" if ds["alerts"] else "#00d4aa", "📄"),
        ("Crowd Reports", str(cs["total_reports"]), "#4fc3f7", "👥"),
        ("Containers Mon.", str(ac["monitored_containers"]), "#7b68ee", "📦"),
    ]
    for col, (label, value, color, icon) in zip(kpi_cols, kpi_data):
        col.markdown(viz.kpi_html(label, value, color=color, icon=icon), unsafe_allow_html=True)

    st.markdown("---")

    # Map + Alerts + Explainability
    map_col, right_col = st.columns([2.4, 1])
    with map_col:
        section_header("Global Network Status", "🌐")
        st.plotly_chart(viz.animated_network_map(net, sir.history), use_container_height=True)

    with right_col:
        section_header("Live Alert Feed", "📡")
        if rt["alerts"]:
            for a in rt["alerts"][:6]:
                st.markdown(viz.alert_card(a), unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="background:#1a1a2e;padding:20px;border-radius:10px;text-align:center">
                <div style="font-size:28px">✅</div>
                <div style="color:#00d4aa;font-size:14px;font-weight:600">All Systems Nominal</div>
                <div style="color:#666;font-size:12px;margin-top:4px">Seed a disruption to see alerts</div>
            </div>""", unsafe_allow_html=True)

        section_header("Herd Immunity", "🛡")
        st.plotly_chart(viz.herd_immunity_gauge(pc, sir.beta / sir.gamma), use_container_height=True)

    # SIR + R number
    section_header("Epidemiological Progression", "🔬")
    sir_col, reff_col = st.columns([1.5, 1])
    with sir_col:
        st.plotly_chart(viz.sir_curves(sir.history), use_container_height=True)
    with reff_col:
        st.plotly_chart(viz.r_number_chart(sir.history, sir.beta, sir.gamma), use_container_height=True)

    # Explainability panel
    if rt["alerts"]:
        section_header("AI Explainability", "🧠")
        affected = [a["node"] for a in rt["alerts"]]
        explanation = explainer.explain_disruption(
            rt["alerts"][0]["node"], rt["Reff"], [], affected)
        st.markdown(f"""
        <div style="background:#1a1a2e;padding:20px;border-radius:12px;border:1px solid #1e2736">
            {explanation.replace(chr(10), '<br>')}
        </div>""", unsafe_allow_html=True)


# ─── Global Network ──────────────────────────────────────────────────────────

elif page == "Global Network":
    st.title("🌍 Global Supply Chain Network")
    st.markdown("Interactive map of all nodes, routes, and disruption states across the supply chain organism.")
    st.plotly_chart(viz.network_map(net), use_container_height=True)

    section_header("Node Details", "📍")
    details = []
    for nd in net.nodes.values():
        details.append(dict(Name=nd.name, Type=nd.kind, Status=nd.status,
                            Lat=nd.lat, Lon=nd.lon,
                            Congestion=f"{nd.congestion:.0%}",
                            Load=f"{nd.load:,}/{nd.capacity:,}"))
    st.dataframe(pd.DataFrame(details), use_container_width=True, hide_index=True)

    section_header("Route Risk Analysis", "🔗")
    edge_data = []
    for e in net.edges:
        sn = net.nodes.get(e.src)
        dn = net.nodes.get(e.dst)
        if sn and dn:
            edge_data.append(dict(From=sn.name, To=dn.name, Mode=e.mode,
                                  Distance=f"{e.dist_km:,} km",
                                  Transit=f"{e.hours}h", Risk=f"{e.risk:.0%}"))
    st.dataframe(pd.DataFrame(edge_data), use_container_width=True, hide_index=True)

    # Shipment flow from CSV
    if not shipments_df.empty:
        section_header("Shipment Flow (Historical Data)", "📊")
        tab1, tab2 = st.tabs(["Summary Stats", "Data Explorer"])
        with tab1:
            sc1, sc2, sc3, sc4 = st.columns(4)
            sc1.metric("Total Shipments", f"{len(shipments_df):,}")
            sc2.metric("Avg Transit Days", f"{shipments_df['transit_days_actual'].mean():.1f}")
            sc3.metric("Delayed (>7d)", f"{(shipments_df['delay_days'] > 7).sum():,}")
            sc4.metric("Disrupted", f"{shipments_df['disruption_flag'].sum():,}")
        with tab2:
            st.dataframe(shipments_df.head(200), use_container_width=True, hide_index=True)


# ─── Epidemiological Model ───────────────────────────────────────────────────

elif page == "Epidemiological Model":
    st.title("🔬 Epidemiological Disruption Spreading")
    st.markdown("""
    NEXUS models supply-chain disruptions like infectious diseases using the **SIR framework**.
    Each node can be **Susceptible** → **Infected** (disrupted) → **Recovered**.
    The adjacency matrix of the logistics network determines how disruptions propagate.
    """)
    st.markdown(r"""
    **Equations per node *i*:**
    - $\frac{dS_i}{dt} = -\sum_j A_{ij} \cdot \beta \cdot S_i \cdot I_j$
    - $\frac{dI_i}{dt} = \sum_j A_{ij} \cdot \beta \cdot S_i \cdot I_j - \gamma \cdot I_i$
    - $\frac{dR_i}{dt} = \gamma \cdot I_i$
    """)

    # Key equations
    r0 = sir.beta / sir.gamma
    pc = sir.herd_immunity_threshold()
    eq_cols = st.columns(3)
    eq_cols[0].markdown(f"""
    <div style="background:#1a1a2e;padding:16px;border-radius:10px;text-align:center;
        border:1px solid #1e2736">
        <div style="font-size:11px;color:#888;text-transform:uppercase">R₀ (Reproduction Number)</div>
        <div style="font-size:36px;font-weight:800;color:{('#ff3333' if r0 > 1 else '#00d4aa')}">{r0:.2f}</div>
        <div style="font-size:11px;color:#666">β/γ = {sir.beta:.2f}/{sir.gamma:.2f}</div>
    </div>""", unsafe_allow_html=True)
    eq_cols[1].markdown(f"""
    <div style="background:#1a1a2e;padding:16px;border-radius:10px;text-align:center;
        border:1px solid #1e2736">
        <div style="font-size:11px;color:#888;text-transform:uppercase">Herd Immunity Threshold</div>
        <div style="font-size:36px;font-weight:800;color:#ff6b35">{pc:.1%}</div>
        <div style="font-size:11px;color:#666">p<sub>c</sub> = 1 − 1/R₀</div>
    </div>""", unsafe_allow_html=True)
    eq_cols[2].markdown(f"""
    <div style="background:#1a1a2e;padding:16px;border-radius:10px;text-align:center;
        border:1px solid #1e2736">
        <div style="font-size:11px;color:#888;text-transform:uppercase">Current R effective</div>
        <div style="font-size:36px;font-weight:800;color:{('#ff3333' if sir._Reff() > 1 else '#00d4aa')}">{sir._Reff():.2f}</div>
        <div style="font-size:11px;color:#666">{'CASCADE ACTIVE' if sir._Reff() > 1 else 'CONTAINED'}</div>
    </div>""", unsafe_allow_html=True)

    st.markdown("---")

    section_header("Simulation Progression", "📈")
    c1, c2 = st.columns([1.5, 1])
    with c1:
        st.plotly_chart(viz.sir_curves(sir.history), use_container_height=True)
    with c2:
        st.plotly_chart(viz.r_number_chart(sir.history, sir.beta, sir.gamma), use_container_height=True)

    section_header("Per-Node Disruption Level", "📊")
    st.plotly_chart(viz.node_disruption_bars(net), use_container_height=True)

    section_header("Disruption Spread on Network Map", "🌐")
    st.plotly_chart(viz.animated_network_map(net, sir.history), use_container_height=True)

    # Historical disruption data
    if not disruptions_df.empty:
        section_header("Historical Disruption Database", "🗄")
        d_cols = st.columns(4)
        d_cols[0].metric("Total Events", f"{len(disruptions_df):,}")
        d_cols[1].metric("Avg Severity", f"{disruptions_df['severity'].mean():.2f}")
        d_cols[2].metric("Avg R-number", f"{disruptions_df['r_number'].mean():.2f}")
        d_cols[3].metric("Total Loss", f"${disruptions_df['economic_loss_usd'].sum():,.0f}")
        st.dataframe(disruptions_df.head(100), use_container_width=True, hide_index=True)


# ─── Immune Intelligence ─────────────────────────────────────────────────────

elif page == "Immune Intelligence":
    st.title("🛡 Immune Intelligence — Antibody Memory")
    st.markdown("""
    Every historical disruption is encoded as an **antibody pattern** — a vector embedding of
    preceding sensor signals, severity, and geographic footprint.

    When incoming data cosine-similarity-matches a stored antibody above threshold **τ = 0.82**,
    NEXUS fires a **pre-emptive immune response** before the disruption is confirmed.
    """)
    st.markdown(r"""
    **Trigger condition:** $\exists k : \frac{s_t \cdot a_k}{\|s_t\| \cdot \|a_k\|} > \tau, \quad \tau = 0.82$
    """)

    # Stats row
    ab_cols = st.columns(4)
    ab_cols[0].metric("Antibody Library", f"{len(immune.library)} patterns")
    ab_cols[1].metric("Threshold (τ)", f"{immune.threshold:.2f}")
    ab_cols[2].metric("Dimensions", f"{immune.DIM}")
    ab_cols[3].metric("Scans Run", str(len(st.session_state.scan_log)))

    st.markdown("---")

    c1, c2 = st.columns([1.1, 1])
    with c1:
        section_header("Antibody Library", "🧬")
        for ab in immune.library:
            severity_color = "#ff3333" if ab["severity"] > 0.8 else ("#ff6b35" if ab["severity"] > 0.6 else "#00d4aa")
            st.markdown(f"""
            <div style="background:#1a1a2e;padding:14px;border-radius:10px;
                border-left:3px solid {severity_color};margin-bottom:10px;
                box-shadow:0 1px 4px rgba(0,0,0,0.2)">
                <div style="font-size:13px;color:#fff;font-weight:600">{ab['id']} — {ab['type'].replace('_', ' ').title()}</div>
                <div style="font-size:12px;color:#aaa;margin-top:4px">{ab['description']}</div>
                <div style="display:flex;gap:16px;margin-top:8px">
                    <div style="font-size:11px;color:{severity_color}">Severity: {ab['severity']:.0%}</div>
                    <div style="font-size:11px;color:#00d4aa">Footprint: {', '.join(ab['footprint'][:3])}</div>
                </div>
                <div style="font-size:11px;color:#666;margin-top:4px">
                    Actions: {'; '.join(ab['actions'][:2])}{'...' if len(ab['actions']) > 2 else ''}
                </div>
            </div>""", unsafe_allow_html=True)

    with c2:
        section_header("Live Sensor Scan", "🔍")
        if st.button("🔍 Scan Sensor Data", use_container_width=True, type="primary"):
            result = immune.simulate_scan()
            st.session_state.scan_log.append(result)
            if result:
                st.toast(f"Match: {result['antibody']} ({result['similarity']:.1%})", icon="⚠️")
            else:
                st.toast("No match — all clear", icon="✅")

        if st.session_state.scan_log:
            last = st.session_state.scan_log[-1]
            if last:
                st.plotly_chart(viz.immune_gauge(last["similarity"]), use_container_height=True)

                st.markdown(f"""
                <div style="background:#2a1a1e;padding:18px;border-radius:12px;border:1px solid #ff333355">
                    <div style="color:#ff3333;font-size:16px;font-weight:700;margin-bottom:10px">
                        ⚠ Immune Response Activated
                    </div>
                    <div style="color:#fff;font-size:13px;line-height:1.8">
                        <b>Antibody:</b> {last['antibody']}<br>
                        <b>Similarity:</b> {last['similarity']:.1%}<br>
                        <b>Confidence:</b> {last['confidence']:.1f}%<br>
                        <b>Disruption Type:</b> {last['dtype'].replace('_', ' ').title()}<br>
                        <b>Magnitude:</b> {last['magnitude']:.2f}<br>
                        <b>Footprint:</b> {', '.join(last.get('footprint', []))}
                    </div>
                </div>""", unsafe_allow_html=True)

                st.markdown("**Recommended Actions:**")
                for i, act in enumerate(last["actions"], 1):
                    st.markdown(f"**{i}.** {act}")

                # Explainability
                with st.expander("🧠 AI Explanation"):
                    st.markdown(explainer.explain_disruption(
                        last.get("dtype", "Unknown"), last["similarity"],
                        [last], last.get("footprint", [])))
            else:
                st.markdown("""
                <div style="background:#1a2e1a;padding:20px;border-radius:12px;border:1px solid #00d4aa44;
                    text-align:center">
                    <div style="font-size:28px">✅</div>
                    <div style="color:#00d4aa;font-size:16px;font-weight:700;margin-top:8px">No Threat Detected</div>
                    <div style="color:#888;font-size:13px;margin-top:4px">All antibodies below threshold τ = 0.82</div>
                </div>""", unsafe_allow_html=True)

        # Scan history
        if len(st.session_state.scan_log) > 1:
            section_header("Scan History", "📜")
            matches = sum(1 for s in st.session_state.scan_log if s is not None)
            st.markdown(f"**{len(st.session_state.scan_log)}** scans | **{matches}** matches | "
                        f"Match rate: **{matches/len(st.session_state.scan_log):.0%}**")


# ─── Route Market ─────────────────────────────────────────────────────────────

elif page == "Route Market":
    st.title("🤝 Multi-Agent Route Negotiation Market")
    st.markdown("""
    Autonomous carrier agents bid for shipments in a real-time marketplace.
    Each agent evaluates route cost, transit time, and risk to compute a competitive bid.
    The winning route is selected by a composite score weighted by shipment urgency.
    **Vickrey auction mechanism** (second-price sealed bid) prevents gaming.
    """)

    c1, c2 = st.columns(2)
    with c1:
        urgency = st.slider("Shipment Urgency", 0.0, 1.0, 0.7, 0.05,
                            help="Higher urgency prioritizes speed over cost")
    with c2:
        risk_tol = st.slider("Risk Tolerance", 0.0, 1.0, 0.5, 0.05,
                             help="Higher tolerance accepts riskier routes")

    if st.button("🏁 Run Negotiation Round", use_container_width=True, type="primary"):
        result = market.negotiate(urgency, risk_tol)
        st.session_state.last_negotiation = result
        st.toast(f"Winner: {result['winner']['carrier']}", icon="🏆")

    if "last_negotiation" in st.session_state:
        res = st.session_state.last_negotiation
        winner = res["winner"]

        st.markdown(f"""
        <div style="background:linear-gradient(135deg,#1a2e1a,#0a1e0a);padding:20px;border-radius:12px;
            border:2px solid #00d4aa;margin:16px 0;box-shadow:0 4px 16px rgba(0,212,170,0.15)">
            <div style="color:#00d4aa;font-size:20px;font-weight:700">🏆 Winner: {winner['carrier']}</div>
            <div style="color:#aaa;font-size:12px;margin-top:2px">{winner['agent']}</div>
            <div style="color:#fff;font-size:14px;margin-top:10px;line-height:1.8">
                Route: {' → '.join(winner['route'])}<br>
                Bid: <b style="color:#ff6b35">${winner['bid']:,.0f}</b> &nbsp;|&nbsp;
                Transit: <b>{winner['hours']}h</b> &nbsp;|&nbsp;
                Risk: <b style="color:{('#ff3333' if winner['risk'] > 0.2 else '#00d4aa')}">{winner['risk']:.0%}</b>
            </div>
        </div>""", unsafe_allow_html=True)

        chart_c1, chart_c2 = st.columns([1.2, 1])
        with chart_c1:
            st.plotly_chart(viz.agent_chart(res["all_bids"]), use_container_height=True)
        with chart_c2:
            st.plotly_chart(viz.agent_radar(res["all_bids"]), use_container_height=True)

        # Explainability
        with st.expander("🧠 AI Route Explanation"):
            st.markdown(explainer.explain_route(
                winner["carrier"], winner["bid"], winner["score"],
                winner["hours"], winner["risk"], urgency))

        section_header("All Bids", "📋")
        bid_df = pd.DataFrame(res["all_bids"])
        bid_df["route"] = bid_df["route"].apply(lambda r: " → ".join(r))
        bid_df = bid_df.rename(columns=dict(agent="Agent", carrier="Carrier",
                                             route="Route", bid="Bid ($)",
                                             hours="Transit (h)", risk="Risk",
                                             score="Score"))
        st.dataframe(bid_df, use_container_width=True, hide_index=True)
    else:
        st.info("Click **Run Negotiation Round** to start the agent market.")

    if market.rounds:
        section_header("Market History", "📜")
        hist = []
        for r in market.rounds:
            hist.append(dict(Round=r["round"], Winner=r["winner"]["carrier"],
                             Bid=f"${r['winner']['bid']:,.0f}",
                             Score=f"{r['winner']['score']:.4f}",
                             Urgency=f"{r['urgency']:.0%}"))
        st.dataframe(pd.DataFrame(hist), use_container_width=True, hide_index=True)


# ─── Document Scanner ────────────────────────────────────────────────────────

elif page == "Document Scanner":
    st.title("📄 Document Intelligence — Financial Early Warning")
    st.markdown("""
    NEXUS ingests financial documents (invoices, bills of lading, customs declarations)
    and detects anomalies **2–3 weeks before physical disruptions materialize**.
    Cost overruns, insurance spikes, and tariff changes are early warning signals.
    **GraphSAGE anomaly detection** on a trade entity graph powers the scoring engine.
    """)

    ds = doc_an.summary()
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Total Documents", ds["total"])
    c2.metric("Normal", ds["normal"], delta=f"+{ds['normal']}")
    c3.metric("Flagged", ds["alerts"],
              delta=f"⚠ {ds['alerts']}" if ds["alerts"] else "0")
    c4.metric("Under Review", ds.get("review", 0))
    c5.metric("Total Value", f"${ds['total_value']:,.0f}")

    st.markdown("---")

    tab1, tab2 = st.tabs(["📊 Deviation Analysis", "🔵 Anomaly Scatter"])
    with tab1:
        st.plotly_chart(viz.doc_deviation_chart(doc_an.docs), use_container_height=True)
    with tab2:
        st.plotly_chart(viz.doc_anomaly_scatter(doc_an.docs), use_container_height=True)

    section_header("Document Details", "📋")
    # Filter
    filter_col1, filter_col2 = st.columns(2)
    with filter_col1:
        status_filter = st.multiselect("Filter by Status",
                                        ["normal", "review", "alert", "critical"],
                                        default=["critical", "alert"])
    with filter_col2:
        doc_type_filter = st.multiselect("Filter by Type",
                                          list(set(d["type"] for d in doc_an.docs)),
                                          default=list(set(d["type"] for d in doc_an.docs)))

    filtered = [d for d in doc_an.docs
                if d["status"] in status_filter and d["type"] in doc_type_filter]
    st.caption(f"Showing {len(filtered)} of {len(doc_an.docs)} documents")

    for d in filtered[:30]:
        st.markdown(viz.doc_card(d), unsafe_allow_html=True)
        with st.expander(f"🧠 AI Analysis — {d['id']}"):
            st.markdown(explainer.explain_document(d))

    # Upload simulation
    section_header("Upload Document", "📤")
    uploaded = st.file_uploader("Upload CSV/Invoice for analysis",
                                 type=["csv", "txt", "pdf"],
                                 help="Simulated: upload any file to trigger analysis")
    if uploaded:
        st.success(f"File '{uploaded.name}' received — analyzing with Gemini 1.5 Pro...")
        with st.spinner("Extracting entities with Document AI..."):
            time.sleep(1.5)
        st.markdown("""
        <div style="background:#1a2e1a;padding:16px;border-radius:10px;border:1px solid #00d4aa44">
            <div style="color:#00d4aa;font-weight:600">✅ Document Processed</div>
            <div style="color:#aaa;font-size:13px;margin-top:8px">
                <b>Entities Extracted:</b> 12 companies, 5 ports, 3 commodity codes<br>
                <b>Trade Graph:</b> 3 new nodes added, 2 anomaly edges detected<br>
                <b>Anomaly Score:</b> <span style="color:#ff6b35">0.34</span> (within normal range)
            </div>
        </div>""", unsafe_allow_html=True)


# ─── Crowd Intelligence ──────────────────────────────────────────────────────

elif page == "Crowd Intelligence":
    st.title("👥 Crowd Intelligence — Waze for Supply Chains")
    st.markdown("""
    NEXUS builds a collective intelligence network where truck drivers, warehouse workers,
    and port agents contribute anonymized ground-truth signals via **10-second voice notes**.
    Every contributor receives aggregated intelligence in return.

    **Three independent reports** within a 5km radius and 30-minute window auto-verify a disruption.
    **Network value scales as V(n) ∝ n^1.5** — superlinear Metcalfe-like growth.
    """)

    cs = crowd.stats()

    # Stats
    stat_cols = st.columns(6)
    stat_cols[0].metric("Total Reports", f"{cs['total_reports']:,}")
    stat_cols[1].metric("Verified", f"{cs['verified']:,}")
    stat_cols[2].metric("Verification Rate", f"{cs['verification_rate']:.0%}")
    stat_cols[3].metric("Active Contributors", str(cs['active_contributors']))
    stat_cols[4].metric("Avg Credibility", f"{cs['avg_credibility']:.2f}")
    stat_cols[5].metric("Network Value", f"{cs['network_value']:.0f}")

    st.markdown("---")

    map_col, chart_col = st.columns([1.5, 1])
    with map_col:
        section_header("Crowd Report Map — India Focus", "🗺")
        st.plotly_chart(viz.crowd_map(crowd.voice_notes), use_container_height=True)

    with chart_col:
        section_header("Report Categories", "📊")
        if cs["categories"]:
            st.plotly_chart(viz.crowd_category_chart(cs["categories"]), use_container_height=True)

        section_header("Network Effect Value", "📈")
        st.plotly_chart(viz.crowd_network_value_chart(cs["active_contributors"]),
                        use_container_height=True)

    # Voice note feed
    section_header("Latest Voice Notes", "🎤")
    st.markdown("""
    <div style="background:#1a1a2e;padding:12px;border-radius:8px;margin-bottom:12px;
        display:flex;justify-content:space-between;font-size:12px;color:#888">
        <span>🟢 = Verified (3+ nearby reports)</span>
        <span>⚪ = Unverified (awaiting confirmation)</span>
        <span>Languages: Hindi, Tamil, Bengali, Marathi, Telugu, Kannada</span>
    </div>""", unsafe_allow_html=True)

    for vn in crowd.voice_notes[:15]:
        verified = vn.get("verified", False)
        v_icon = "🟢" if verified else "⚪"
        sev = vn.get("severity", 0)
        sev_color = "#ff3333" if sev > 0.7 else ("#ff6b35" if sev > 0.4 else "#00d4aa")
        cat = vn.get("category", "").replace("_", " ").title()
        lang = vn.get("language", "N/A")

        st.markdown(f"""
        <div style="background:#1a1a2e;padding:12px;border-radius:8px;
            border-left:3px solid {('#00d4aa' if verified else '#666')};margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-size:13px;color:#fff">{v_icon} <b>{vn.get('location_name', 'N/A')}</b></div>
                <div style="font-size:11px;color:#666">{vn.get('timestamp', '')[:16]}</div>
            </div>
            <div style="font-size:12px;color:#aaa;margin-top:4px">
                {cat} | Language: {lang} | Duration: {vn.get('duration_sec', 0)}s
                | Credibility: {vn.get('credibility_score', 0):.0%}
            </div>
            <div style="display:flex;gap:16px;margin-top:6px;font-size:11px">
                <span style="color:{sev_color}">Severity: {sev:.0%}</span>
                <span style="color:#4fc3f7">Nearby: {vn.get('nearby_reports', 0)} reports</span>
                <span style="color:#888">By: {vn.get('contributor_id', 'N/A')}</span>
            </div>
        </div>""", unsafe_allow_html=True)

    # Contributor leaderboard
    if crowd.contributors:
        section_header("Top Contributors", "🏅")
        contrib_df = pd.DataFrame(crowd.contributors)
        contrib_df = contrib_df.sort_values("credibility_score", ascending=False)
        top = contrib_df.head(20)
        display_df = top[["contributor_id", "role", "state", "total_reports",
                          "verified_reports", "credibility_score", "impact_score"]].copy()
        display_df.columns = ["ID", "Role", "State", "Reports", "Verified", "Credibility", "Impact"]
        st.dataframe(display_df, use_container_width=True, hide_index=True)

    # WhatsApp Bot Simulation
    section_header("WhatsApp Bot Simulation", "💬")
    st.markdown("""
    <div style="background:#1a2e1a;padding:18px;border-radius:12px;border:1px solid #00d4aa33">
        <div style="color:#00d4aa;font-weight:600;font-size:14px;margin-bottom:10px">
            How it works — Zero friction, no app install
        </div>
        <div style="font-size:13px;color:#aaa;line-height:1.8">
            1. Driver sends <b>10-second voice note</b> via WhatsApp Business API<br>
            2. Gemini transcribes & classifies: congestion / weather / accident / customs / strike<br>
            3. Location from GPS or mentioned landmark (Google Maps geocoding)<br>
            4. Credibility score based on contributor history (Bayesian reputation)<br>
            5. <b>3 independent reports</b> within 5km/30min → auto-verified disruption<br>
            6. All contributors receive aggregated intelligence in return
        </div>
    </div>""", unsafe_allow_html=True)

    simulate_cols = st.columns(3)
    with simulate_cols[0]:
        if st.button("🎤 Simulate Voice Note (Hindi)", use_container_width=True):
            st.toast("Voice note received — Transcribing with Gemini...", icon="🎤")
    with simulate_cols[1]:
        if st.button("🎤 Simulate Voice Note (Tamil)", use_container_width=True):
            st.toast("Voice note received — Processing...", icon="🎤")
    with simulate_cols[2]:
        if st.button("🎤 Simulate Voice Note (Bengali)", use_container_width=True):
            st.toast("Voice note received — Processing...", icon="🎤")


# ─── Acoustic Monitoring ─────────────────────────────────────────────────────

elif page == "Acoustic Monitoring":
    st.title("🔊 Acoustic Anomaly Detection — Container Health")
    st.markdown("""
    Every supply chain IoT deployment uses temperature, humidity, and GPS. **None use sound.**
    NEXUS deploys low-cost MEMS microphone modules (<$2 BOM) to detect:
    - **Refrigeration failures** 4–8h before temperature sensors trip
    - **Structural stress** from improper container stacking
    - **Tamper events** including seal breaks and cargo shifts

    Log-mel spectrograms computed on-device, transmitted over NB-IoT. Only <50 bytes per inference.
    """)

    ac = acoustic.stats()

    # Stats
    ac_cols = st.columns(6)
    ac_cols[0].metric("Total Readings", f"{ac['total_readings']:,}")
    ac_cols[1].metric("Anomalies Detected", str(ac['anomaly_count']))
    ac_cols[2].metric("Anomaly Rate", f"{ac['anomaly_rate']:.1%}")
    ac_cols[3].metric("Containers Monitored", str(ac["monitored_containers"]))
    ac_cols[4].metric("Sensor Cost", "< $2 BOM")
    ac_cols[5].metric("Data per Reading", "< 50 bytes")

    st.markdown("---")

    chart_col1, chart_col2 = st.columns([1.3, 1])
    with chart_col1:
        section_header("Acoustic Feature Space", "🎵")
        st.plotly_chart(viz.acoustic_spectrogram(acoustic.readings), use_container_height=True)
    with chart_col2:
        section_header("Anomaly Score Timeline", "📈")
        st.plotly_chart(viz.acoustic_timeline(acoustic.readings), use_container_height=True)

    # Anomaly type breakdown
    if ac["types"]:
        section_header("Anomaly Type Distribution", "📊")
        type_cols = st.columns(len(ac["types"]))
        for i, (atype, count) in enumerate(ac["types"].items()):
            color = "#ff3333" if count > 20 else "#ff6b35"
            type_cols[i % len(type_cols)].metric(
                atype.replace("_", " ").title(), str(count))

    # Container health cards
    section_header("Container Health Monitor", "📦")
    anomaly_containers = {k: v for k, v in acoustic.containers.items()
                          if v.get("status") == "anomaly"}
    normal_containers = {k: v for k, v in acoustic.containers.items()
                         if v.get("status") == "normal"}

    if anomaly_containers:
        st.markdown('<div style="color:#ff3333;font-weight:600;margin-bottom:8px">⚠ Anomalous Containers</div>',
                    unsafe_allow_html=True)
        for cid, cinfo in list(anomaly_containers.items())[:5]:
            st.markdown(f"""
            <div style="background:#2a1a1e;padding:14px;border-radius:10px;
                border-left:3px solid #ff3333;margin-bottom:8px">
                <div style="font-size:14px;color:#fff;font-weight:600">📦 {cid}</div>
                <div style="font-size:12px;color:#ff6b35;margin-top:4px">
                    Anomaly: {cinfo.get('anomaly_type', 'Unknown').replace('_', ' ').title()}
                    | Score: {cinfo.get('latest_anomaly', 0):.2f}
                    | Node: {cinfo.get('node', 'N/A')}
                </div>
            </div>""", unsafe_allow_html=True)

    st.markdown(f"""
    <div style="background:#1a1a2e;padding:16px;border-radius:10px;margin-top:16px;
        border:1px solid #1e2736">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#aaa">
            <span>📦 <b style="color:#00d4aa">{len(normal_containers)}</b> Normal</span>
            <span>⚠️ <b style="color:#ff3333">{len(anomaly_containers)}</b> Anomalous</span>
            <span>Total: <b>{len(acoustic.containers)}</b> containers</span>
        </div>
    </div>""", unsafe_allow_html=True)

    # Technical details
    section_header("Technical Architecture", "🔧")
    st.markdown("""
    <div style="background:#1a1a2e;padding:18px;border-radius:12px;border:1px solid #1e2736">
        <div style="font-size:13px;color:#aaa;line-height:2">
            <b style="color:#fff">Hardware:</b> MEMS microphone module (<$2) + ARM Cortex-M33<br>
            <b style="color:#fff">Feature Extraction:</b> Log-mel spectrogram (128 bins, 25ms windows, 10ms hop)<br>
            <b style="color:#fff">Model:</b> MobileNet-V3 audio CNN, pre-trained on Google AudioSet (632 classes)<br>
            <b style="color:#fff">Fine-tuned on:</b> Industrial sounds (Freesound.org), container stress, silence anomalies<br>
            <b style="color:#fff">Inference:</b> TFLite quantized, 60-second intervals, <50 bytes per reading<br>
            <b style="color:#fff">Anomaly Detection:</b> One-class SVM: f(x) = sgn(Σ αᵢK(xᵢ,x) − ρ)<br>
            <b style="color:#fff">Connectivity:</b> NB-IoT — compressed spectrogram only (not raw audio)
        </div>
    </div>""", unsafe_allow_html=True)
