"""
NEXUS — Neural Supply Chain Organism
Google Solution Challenge India 2026
"""

import streamlit as st
import numpy as np
import pandas as pd
import os
import time

import simulation as sim
import visualizations as viz

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

st.set_page_config(page_title="NEXUS — Neural Supply Chain Organism",
                   page_icon="🧬", layout="wide", initial_sidebar_state="expanded")

# ─── Design tokens ────────────────────────────────────────────────────────────

C = dict(
    bg="#ffffff", card="#f1f5f9", card2="#e2e8f0",
    border="#cbd5e1", border2="#94a3b8",
    txt="#0f172a", txt2="#334155", txt3="#64748b", txt4="#94a3b8",
    accent="#0d9488", warn="#ea580c", crit="#dc2626", blue="#2563eb", purple="#7c3aed",
    green_bg="#ecfdf5", red_bg="#fef2f2", yellow_bg="#fef9c3",
    sidebar="#f8fafc",
)

st.markdown(f"""<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    .block-container {{ padding-top:2.5rem; padding-left:3rem; padding-right:3rem; font-family:'Inter',system-ui,sans-serif; }}

    /* Sidebar */
    section[data-testid="stSidebar"] {{ background:{C['sidebar']}; border-right:1px solid {C['border']}; }}

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {{ gap:3px; background:{C['card']}; border-radius:8px; padding:3px; border:1px solid {C['border']}; }}
    .stTabs [data-baseweb="tab"] {{ padding:7px 16px; font-size:13px; font-weight:500; border-radius:6px; color:{C['txt3']}; }}
    .stTabs [data-baseweb="tab"]:hover {{ color:{C['txt2']}; }}
    .stTabs [data-baseweb="tab"][aria-selected="true"] {{ background:#0d948814; color:{C['accent']}; }}

    /* Metrics */
    div[data-testid="stMetric"] {{ background:{C['card']}; border-radius:10px; padding:12px;
        border:1px solid {C['border']}; }}
    div[data-testid="stMetricValue"] {{ font-size:22px; font-weight:700; color:{C['txt']}; }}
    div[data-testid="stMetricLabel"] {{ font-size:11px; text-transform:uppercase; letter-spacing:.5px;
        color:{C['txt3']}; font-weight:600; }}

    /* Dataframe */
    .stDataFrame {{ border-radius:8px; overflow:hidden; border:1px solid {C['border']}; }}
    thead tr th {{ background:{C['card']} !important; color:{C['txt2']} !important;
        font-size:11px; text-transform:uppercase; letter-spacing:.4px; font-weight:600;
        border-bottom:2px solid {C['border']} !important; }}
    tbody tr td {{ background:{C['bg']} !important; color:{C['txt2']} !important;
        font-size:12px; border-bottom:1px solid {C['border']} !important; }}
    tbody tr:hover td {{ background:{C['card']} !important; }}

    /* Buttons */
    .stButton > button {{ border-radius:7px; font-weight:600; border:1px solid {C['border']};
        color:{C['txt2']}; background:{C['bg']}; }}
    .stButton > button:hover {{ border-color:{C['accent']}; color:{C['accent']};
        box-shadow:0 1px 4px rgba(13,148,136,0.12); }}

    /* Expander */
    .streamlit-expanderHeader {{ background:{C['card']}; border-radius:7px;
        border:1px solid {C['border']}; }}

    /* Headers */
    .section-header {{ font-size:15px; font-weight:700; color:{C['txt']};
        margin:18px 0 10px; padding-bottom:8px; border-bottom:2px solid {C['border']}; }}

    /* Nav label */
    .nav-label {{ font-size:10px; text-transform:uppercase; letter-spacing:1px;
        color:{C['txt4']}; margin-top:6px; margin-bottom:2px; font-weight:600; }}

    hr {{ border-color:{C['border']}; }}

    /* Scrollbar */
    ::-webkit-scrollbar {{ width:5px; }}
    ::-webkit-scrollbar-track {{ background:{C['bg']}; }}
    ::-webkit-scrollbar-thumb {{ background:{C['border']}; border-radius:3px; }}
</style>""", unsafe_allow_html=True)


def load_csv(name):
    p = os.path.join(DATA_DIR, name)
    if os.path.exists(p):
        try: return pd.read_csv(p)
        except: return pd.DataFrame()
    return pd.DataFrame()


def hdr(text, icon=""):
    st.markdown(f'<div class="section-header">{icon} {text}</div>', unsafe_allow_html=True)


# ─── Session State ────────────────────────────────────────────────────────────

if "network" not in st.session_state:
    st.session_state.network = sim.SupplyChainNetwork()
    st.session_state.sir = sim.SIRModel(st.session_state.network)
    st.session_state.immune = sim.ImmuneSystem()
    st.session_state.market = sim.RouteMarket()
    st.session_state.doc_analyzer = sim.DocumentAnalyzer()
    st.session_state.crowd = sim.CrowdSourceEngine()
    st.session_state.explainer = sim.ExplainabilityEngine()
    st.session_state.scan_log = []
    st.session_state.shipments_df = load_csv("historical_shipments.csv")
    st.session_state.disruptions_df = load_csv("disruption_events.csv")
    st.session_state.decision_log = sim.DecisionLog()
    st.session_state.risk_engine = sim.RiskEngine(
        st.session_state.network, st.session_state.sir,
        st.session_state.doc_analyzer, st.session_state.crowd, st.session_state.immune)
    st.session_state.scenario = sim.ScenarioEngine(st.session_state.network, st.session_state.sir)
    st.session_state.historical = sim.HistoricalAnalyzer(
        st.session_state.disruptions_df, st.session_state.shipments_df)
    st.session_state.briefing = sim.SituationBriefing(
        st.session_state.risk_engine, st.session_state.decision_log,
        st.session_state.network, st.session_state.sir,
        st.session_state.crowd, st.session_state.doc_analyzer)
    st.session_state.last_scenario = None

net      = st.session_state.network
sir      = st.session_state.sir
immune   = st.session_state.immune
market   = st.session_state.market
doc_an   = st.session_state.doc_analyzer
crowd    = st.session_state.crowd
explainer= st.session_state.explainer
ship_df  = st.session_state.shipments_df
disr_df  = st.session_state.disruptions_df
dlog     = st.session_state.decision_log
risk_eng = st.session_state.risk_engine
scenario = st.session_state.scenario
historical = st.session_state.historical
briefing = st.session_state.briefing

# ─── Sidebar ──────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown(f"""
    <div style="text-align:center;padding:8px 0">
        <div style="font-size:26px;font-weight:800;color:{C['accent']}">NEXUS</div>
        <div style="font-size:10px;color:{C['txt4']};margin-top:1px;font-weight:500">Neural Supply Chain Organism</div>
    </div>""", unsafe_allow_html=True)
    st.divider()

    st.markdown('<div class="nav-label">Pages</div>', unsafe_allow_html=True)
    page = st.radio("Nav", ["Command Center","Global Network","Epidemiological Model",
                            "Immune Intelligence","Route Market","Document Scanner",
                            "Crowd Intelligence","Shipment Tracker","Scenario Sandbox",
                            "Network Trends","Decision History"],
                    label_visibility="collapsed")

    st.divider()
    st.markdown('<div class="nav-label">Simulation</div>', unsafe_allow_html=True)
    seed_node = st.selectbox("Seed Disruption", list(net.nodes.keys()),
                             format_func=lambda x: net.nodes[x].name, index=0)
    seed_sev = st.slider("Severity", 0.3, 1.0, 0.8, 0.1)

    if st.button("⚡ Seed Disruption", use_container_width=True):
        sir.seed(seed_node, seed_sev)
        dlog.log("seed", seed_node, dict(severity=seed_sev))
        st.toast(f"Seeded at {net.nodes[seed_node].name}", icon="⚡")

    c1, c2, c3 = st.columns(3)
    with c1:
        if st.button("▶", use_container_width=True): sir.step()
    with c2:
        if st.button("×10", use_container_width=True):
            for _ in range(10): sir.step()
    with c3:
        if st.button("×50", use_container_width=True):
            for _ in range(50): sir.step()

    if st.button("🔄 Reset", use_container_width=True): sir.reset()

    st.divider()
    with st.expander("⚙ SIR Parameters"):
        sir.beta  = st.slider("β (transmission)", 0.05, 0.80, sir.beta, 0.05)
        sir.gamma = st.slider("γ (recovery)", 0.01, 0.40, sir.gamma, 0.01)
        r0 = sir.beta / sir.gamma
        pc = sir.herd_immunity_threshold()
        r0c = C['crit'] if r0 > 1 else C['accent']
        st.markdown(f"""
        <div style="background:{C['card']};padding:12px;border-radius:8px;text-align:center;
            border:1px solid {C['border']}">
            <div style="font-size:10px;color:{C['txt4']};text-transform:uppercase;font-weight:600">R₀</div>
            <div style="font-size:28px;font-weight:700;color:{r0c}">{r0:.2f}</div>
            <div style="font-size:10px;color:{C['txt4']};margin-top:4px;text-transform:uppercase;font-weight:600">Herd Immunity</div>
            <div style="font-size:18px;font-weight:700;color:{C['warn']}">{pc:.1%}</div>
        </div>""", unsafe_allow_html=True)

    st.divider()
    st.markdown(f"""
    <div style="text-align:center;padding:4px 0">
        <div style="font-size:9px;color:{C['txt4']}">Google Solution Challenge India 2026</div>
    </div>""", unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════════

# ─── Command Center (Modified) ────────────────────────────────────────────────

if page == "Command Center":
    st.markdown(f"""
    <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
        <div style="font-size:28px;font-weight:800;color:{C['accent']}">NEXUS</div>
        <div style="font-size:14px;color:{C['txt4']}">Command Center</div>
    </div>""", unsafe_allow_html=True)
    st.markdown("---")

    rt = sim.generate_alerts(net, sir)
    ds = doc_an.summary()
    cs = crowd.stats()
    health = risk_eng.network_health()
    kpi_cols = st.columns(6)
    kpis = [
        ("Network Health",  f"{health:.1f}/100",                      C['accent']),
        ("Disruption Idx",  f"{rt['disruption_idx']:.1%}",            C['warn']),
        ("R effective",     f"{rt['Reff']:.2f}",                      C['crit'] if rt['Reff']>1 else C['accent']),
        ("Active Alerts",   str(len(rt["alerts"])),                   C['crit'] if rt["alerts"] else C['accent']),
        ("Doc Anomalies",   str(ds["alerts"]),                        C['crit'] if ds["alerts"] else C['accent']),
        ("Crowd Reports",   str(cs["total_reports"]),                 C['blue']),
    ]
    icons = ["🟢","⚠️","🔬","🚨","📄","👥"]
    for col, (label, value, color), icon in zip(kpi_cols, kpis, icons):
        col.markdown(viz.kpi_html(label, value, color=color, icon=icon), unsafe_allow_html=True)

    st.markdown("---")

    # Daily Briefing Section
    hdr("Daily Briefing", "📡")
    briefing_text = briefing.generate()
    st.markdown(f"""
    <div style="background:{C['card']};padding:18px;border-radius:10px;border:1px solid {C['border']};
        color:{C['txt2']};font-size:13px;line-height:1.7">{briefing_text.replace(chr(10),'<br>')}</div>
    """, unsafe_allow_html=True)

    with st.expander("🤖 Generate Gemini Briefing"):
        api_key = st.text_input("Gemini API Key", type="password", key="gemini_key_cc")
        if st.button("Generate AI Briefing"):
            if api_key:
                with st.spinner("Generating briefing..."):
                    ai_text = briefing.generate_gemini(api_key)
                    st.markdown(ai_text)
            else:
                st.warning("Enter a Gemini API key to use AI briefing.")

    st.markdown("---")

    mc, rc = st.columns([2.4, 1])
    with mc:
        hdr("Global Network Status", "🌐")
        st.plotly_chart(viz.animated_network_map(net, sir.history), use_container_height=True)

    with rc:
        # Risk Heat Bar
        hdr("Node Risk Heatmap", "🔥")
        risks = risk_eng.all_node_risks()
        st.plotly_chart(viz.risk_heat_bar(risks), use_container_height=True)

        # Action Queue (replaces alert feed)
        hdr("Action Queue", "⚡")
        if rt["alerts"]:
            for a in rt["alerts"][:6]:
                st.markdown(viz.alert_card(a), unsafe_allow_html=True)
                ac1, ac2 = st.columns(2)
                with ac1:
                    if st.button(f"🔀 Reroute", key=f"reroute_{a['node_id']}"):
                        dlog.log("reroute", a["node_id"], dict(from_node=a["node_id"], action=a["action"]))
                        st.toast(f"Reroute logged for {a['node']}", icon="🔀")
                with ac2:
                    if st.button(f"📋 Monitor", key=f"monitor_{a['node_id']}"):
                        dlog.log("monitor", a["node_id"], dict(severity=a["severity"]))
                        st.toast(f"Monitoring {a['node']}", icon="📋")
        else:
            st.markdown(f"""
            <div style="background:{C['green_bg']};padding:20px;border-radius:10px;text-align:center;
                border:1px solid #bbf7d0">
                <div style="font-size:24px">✅</div>
                <div style="color:{C['accent']};font-size:14px;font-weight:600">All Systems Nominal</div>
                <div style="color:{C['txt3']};font-size:12px;margin-top:4px">Seed a disruption to begin</div>
            </div>""", unsafe_allow_html=True)

        hdr("Herd Immunity", "🛡")
        st.plotly_chart(viz.herd_immunity_gauge(pc, r0), use_container_height=True)

    hdr("Epidemiological Progression", "🔬")
    sc, rc2 = st.columns([1.5, 1])
    with sc: st.plotly_chart(viz.sir_curves(sir.history), use_container_height=True)
    with rc2: st.plotly_chart(viz.r_number_chart(sir.history, sir.beta, sir.gamma), use_container_height=True)

    if rt["alerts"]:
        hdr("AI Explainability", "🧠")
        affected = [a["node"] for a in rt["alerts"]]
        exp = explainer.explain_disruption(rt["alerts"][0]["node"], rt["Reff"], [], affected)
        st.markdown(f"""
        <div style="background:{C['card']};padding:18px;border-radius:10px;border:1px solid {C['border']};
            color:{C['txt2']};font-size:13px;line-height:1.7">{exp.replace(chr(10),'<br>')}</div>
        """, unsafe_allow_html=True)


# ─── Global Network ──────────────────────────────────────────────────────────

elif page == "Global Network":
    st.title("🌍 Global Supply Chain Network")
    st.markdown("Interactive map of all nodes, routes, and disruption states.")
    st.plotly_chart(viz.network_map(net), use_container_height=True)

    hdr("Node Details", "📍")
    rows = [dict(Name=n.name, Type=n.kind, Status=n.status, Lat=n.lat, Lon=n.lon,
                 Congestion=f"{n.congestion:.0%}", Load=f"{n.load:,}/{n.capacity:,}",
                 Risk=risk_eng.node_risk(nid)["composite"])
            for nid, n in net.nodes.items()]
    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    hdr("Route Risk Analysis", "🔗")
    edata = []
    for e in net.edges:
        s, d = net.nodes.get(e.src), net.nodes.get(e.dst)
        if s and d:
            edata.append(dict(From=s.name, To=d.name, Mode=e.mode,
                              Distance=f"{e.dist_km:,} km", Transit=f"{e.hours}h", Risk=f"{e.risk:.0%}"))
    st.dataframe(pd.DataFrame(edata), use_container_width=True, hide_index=True)

    if not ship_df.empty:
        hdr("Shipment Flow (Historical Data)", "📊")
        t1, t2 = st.tabs(["Summary", "Data Explorer"])
        with t1:
            m1,m2,m3,m4 = st.columns(4)
            m1.metric("Total Shipments", f"{len(ship_df):,}")
            m2.metric("Avg Transit", f"{ship_df['transit_days_actual'].mean():.1f} d")
            m3.metric("Delayed (>7d)", f"{(ship_df['delay_days']>7).sum():,}")
            m4.metric("Disrupted", f"{ship_df['disruption_flag'].sum():,}")
        with t2:
            st.dataframe(ship_df.head(200), use_container_width=True, hide_index=True)


# ─── Epidemiological Model ───────────────────────────────────────────────────

elif page == "Epidemiological Model":
    st.title("🔬 Epidemiological Disruption Spreading")
    st.markdown("NEXUS models disruptions using the **SIR framework**. "
                "Each node: **Susceptible** → **Infected** → **Recovered**.")
    st.markdown(r"**Per node *i*:**  $\frac{dI_i}{dt} = \beta S_i \sum_j A_{ij} I_j - \gamma I_i$")

    r0 = sir.beta / sir.gamma; pc = sir.herd_immunity_threshold()
    eq = st.columns(3)
    data = [
        ("R₀ (Reproduction)", f"{r0:.2f}", f"β/γ = {sir.beta:.2f}/{sir.gamma:.2f}", C['crit'] if r0>1 else C['accent']),
        ("Herd Immunity", f"{pc:.1%}", "p<sub>c</sub> = 1 − 1/R₀", C['warn']),
        ("Current R<sub>eff</sub>", f"{sir._Reff():.2f}", "CASCADE" if sir._Reff()>1 else "CONTAINED",
         C['crit'] if sir._Reff()>1 else C['accent']),
    ]
    for col, (label, value, sub, color) in zip(eq, data):
        col.markdown(f"""
        <div style="background:{C['card']};padding:16px;border-radius:10px;text-align:center;
            border:1px solid {C['border']}">
            <div style="font-size:10px;color:{C['txt4']};text-transform:uppercase;font-weight:600">{label}</div>
            <div style="font-size:34px;font-weight:800;color:{color};margin:4px 0">{value}</div>
            <div style="font-size:11px;color:{C['txt3']}">{sub}</div>
        </div>""", unsafe_allow_html=True)

    st.markdown("---")
    hdr("Simulation Progression", "📈")
    a, b = st.columns([1.5, 1])
    with a: st.plotly_chart(viz.sir_curves(sir.history), use_container_height=True)
    with b: st.plotly_chart(viz.r_number_chart(sir.history, sir.beta, sir.gamma), use_container_height=True)

    hdr("Per-Node Disruption", "📊")
    st.plotly_chart(viz.node_disruption_bars(net), use_container_height=True)

    hdr("Disruption Spread Map", "🌐")
    st.plotly_chart(viz.animated_network_map(net, sir.history), use_container_height=True)

    if not disr_df.empty:
        hdr("Historical Disruption Database", "🗄")
        dc = st.columns(4)
        dc[0].metric("Events", f"{len(disr_df):,}")
        dc[1].metric("Avg Severity", f"{disr_df['severity'].mean():.2f}")
        dc[2].metric("Avg R-number", f"{disr_df['r_number'].mean():.2f}")
        dc[3].metric("Total Loss", f"${disr_df['economic_loss_usd'].sum():,.0f}")
        st.dataframe(disr_df.head(100), use_container_width=True, hide_index=True)


# ─── Immune Intelligence ─────────────────────────────────────────────────────

elif page == "Immune Intelligence":
    st.title("🛡 Immune Intelligence — Antibody Memory")
    st.markdown("Disruptions encoded as **antibody vectors**. Fire pre-emptive response when "
                "cosine similarity > **τ = 0.82**.")

    ac = st.columns(4)
    ac[0].metric("Antibody Library", f"{len(immune.library)}")
    ac[1].metric("Threshold (τ)", f"{immune.threshold:.2f}")
    ac[2].metric("Dimensions", f"{immune.DIM}")
    ac[3].metric("Scans Run", str(len(st.session_state.scan_log)))
    st.markdown("---")

    left, right = st.columns([1.1, 1])
    with left:
        hdr("Antibody Library", "🧬")
        for ab in immune.library:
            sc = C['crit'] if ab["severity"]>.8 else (C['warn'] if ab["severity"]>.6 else C['accent'])
            st.markdown(f"""
            <div style="background:{C['card']};padding:12px;border-radius:8px;
                border-left:3px solid {sc};margin-bottom:8px;border:1px solid {C['border']};
                border-left:3px solid {sc}">
                <div style="font-size:13px;color:{C['txt']};font-weight:600">{ab['id']} — {ab['type'].replace('_',' ').title()}</div>
                <div style="font-size:12px;color:{C['txt3']};margin-top:3px">{ab['description']}</div>
                <div style="display:flex;gap:14px;margin-top:6px;font-size:11px">
                    <span style="color:{sc};font-weight:600">Severity: {ab['severity']:.0%}</span>
                    <span style="color:{C['accent']}">Footprint: {', '.join(ab['footprint'][:3])}</span>
                </div>
                <div style="font-size:11px;color:{C['txt4']};margin-top:3px">
                    Actions: {'; '.join(ab['actions'][:2])}{'…' if len(ab['actions'])>2 else ''}</div>
            </div>""", unsafe_allow_html=True)

    with right:
        hdr("Live Sensor Scan", "🔍")
        if st.button("🔍 Scan Sensor Data", use_container_width=True, type="primary"):
            result = immune.simulate_scan()
            st.session_state.scan_log.append(result)
            st.toast(f"Match: {result['antibody']}" if result else "No match", icon="⚠️" if result else "✅")

        if st.session_state.scan_log:
            last = st.session_state.scan_log[-1]
            if last:
                st.plotly_chart(viz.immune_gauge(last["similarity"]), use_container_height=True)
                st.markdown(f"""
                <div style="background:{C['red_bg']};padding:16px;border-radius:10px;border:1px solid #fecaca">
                    <div style="color:{C['crit']};font-size:15px;font-weight:700;margin-bottom:8px">⚠ Immune Response Activated</div>
                    <div style="color:{C['txt2']};font-size:13px;line-height:1.7">
                        <b>Antibody:</b> {last['antibody']}<br>
                        <b>Similarity:</b> {last['similarity']:.1%}<br>
                        <b>Confidence:</b> {last['confidence']:.1f}%<br>
                        <b>Type:</b> {last['dtype'].replace('_',' ').title()}<br>
                        <b>Magnitude:</b> {last['magnitude']:.2f}<br>
                        <b>Footprint:</b> {', '.join(last.get('footprint',[]))}
                    </div>
                </div>""", unsafe_allow_html=True)
                st.markdown("**Recommended Actions:**")
                for i, act in enumerate(last["actions"], 1):
                    st.markdown(f"**{i}.** {act}")
                with st.expander("🧠 AI Explanation"):
                    st.markdown(explainer.explain_disruption(
                        last.get("dtype",""), last["similarity"], [last], last.get("footprint",[])))
            else:
                st.markdown(f"""
                <div style="background:{C['green_bg']};padding:18px;border-radius:10px;text-align:center;
                    border:1px solid #bbf7d0">
                    <div style="font-size:24px">✅</div>
                    <div style="color:{C['accent']};font-size:15px;font-weight:700;margin-top:6px">No Threat Detected</div>
                    <div style="color:{C['txt3']};font-size:12px;margin-top:3px">All antibodies below τ = 0.82</div>
                </div>""", unsafe_allow_html=True)

        if len(st.session_state.scan_log) > 1:
            hdr("Scan History", "📜")
            m = sum(1 for s in st.session_state.scan_log if s)
            st.markdown(f"**{len(st.session_state.scan_log)}** scans | **{m}** matches | "
                        f"Rate: **{m/len(st.session_state.scan_log):.0%}**")


# ─── Route Market (Modified) ─────────────────────────────────────────────────

elif page == "Route Market":
    st.title("🤝 Multi-Agent Route Negotiation")
    st.markdown("Autonomous carrier agents compete via **Vickrey auction** (second-price sealed bid).")

    c1, c2 = st.columns(2)
    with c1: urgency = st.slider("Urgency", 0.0, 1.0, 0.7, 0.05)
    with c2: risk_tol = st.slider("Risk Tolerance", 0.0, 1.0, 0.5, 0.05)

    if st.button("🏁 Run Negotiation", use_container_width=True, type="primary"):
        st.session_state.last_neg = market.negotiate(urgency, risk_tol)
        st.toast(f"Winner: {st.session_state.last_neg['winner']['carrier']}", icon="🏆")

    if "last_neg" in st.session_state:
        w = st.session_state.last_neg["winner"]
        rc = C['crit'] if w['risk']>.2 else C['accent']
        st.markdown(f"""
        <div style="background:{C['green_bg']};padding:18px;border-radius:10px;
            border:2px solid {C['accent']};margin:12px 0">
            <div style="color:{C['accent']};font-size:18px;font-weight:700">🏆 {w['carrier']}</div>
            <div style="color:{C['txt3']};font-size:11px">{w['agent']}</div>
            <div style="color:{C['txt2']};font-size:13px;margin-top:8px;line-height:1.7">
                Route: {' → '.join(w['route'])}<br>
                Bid: <b style="color:{C['warn']}">${w['bid']:,.0f}</b> |
                Transit: <b>{w['hours']}h</b> |
                Risk: <b style="color:{rc}">{w['risk']:.0%}</b>
            </div>
        </div>""", unsafe_allow_html=True)

        # Action buttons for route decision
        hdr("Route Decision", "🎯")
        ab1, ab2, ab3 = st.columns(3)
        with ab1:
            if st.button("✅ Accept Winner", key="accept_route", use_container_width=True):
                dlog.log("accept", w["carrier"], dict(carrier=w["carrier"], bid=w["bid"],
                        route=" → ".join(w["route"]), outcome="accepted"))
                st.toast(f"Accepted {w['carrier']} at ${w['bid']:,.0f}", icon="✅")
        with ab2:
            if st.button("🔄 Alternative Route", key="alt_route", use_container_width=True):
                if len(st.session_state.last_neg["all_bids"]) > 1:
                    alt = st.session_state.last_neg["all_bids"][1]
                    dlog.log("alternative", alt["carrier"], dict(carrier=alt["carrier"], bid=alt["bid"],
                            route=" → ".join(alt["route"]), outcome="alternative"))
                    st.toast(f"Switched to {alt['carrier']}", icon="🔄")
                else:
                    st.warning("No alternative available.")
        with ab3:
            if st.button("❌ Reject All", key="reject_route", use_container_width=True):
                dlog.log("reject", "all", dict(urgency=urgency, reason="all_rejected"))
                st.toast("All bids rejected", icon="❌")

        g1, g2 = st.columns([1.2, 1])
        with g1: st.plotly_chart(viz.agent_chart(st.session_state.last_neg["all_bids"]), use_container_height=True)
        with g2: st.plotly_chart(viz.agent_radar(st.session_state.last_neg["all_bids"]), use_container_height=True)

        with st.expander("🧠 AI Explanation"):
            st.markdown(explainer.explain_route(w["carrier"], w["bid"], w["score"], w["hours"], w["risk"], urgency))

        hdr("All Bids", "📋")
        bd = pd.DataFrame(st.session_state.last_neg["all_bids"])
        bd["route"] = bd["route"].apply(lambda r: " → ".join(r))
        bd = bd.rename(columns=dict(agent="Agent", carrier="Carrier", route="Route",
                                     bid="Bid ($)", hours="Transit (h)", risk="Risk", score="Score"))
        st.dataframe(bd, use_container_width=True, hide_index=True)
    else:
        st.info("Click **Run Negotiation** to start.")

    if market.rounds:
        hdr("Market History", "📜")
        h = [dict(Round=r["round"], Winner=r["winner"]["carrier"],
                  Bid=f"${r['winner']['bid']:,.0f}", Score=f"{r['winner']['score']:.4f}",
                  Urgency=f"{r['urgency']:.0%}") for r in market.rounds]
        st.dataframe(pd.DataFrame(h), use_container_width=True, hide_index=True)


# ─── Document Scanner (Modified) ─────────────────────────────────────────────

elif page == "Document Scanner":
    st.title("📄 Document Intelligence")
    st.markdown("Detects anomalies **2–3 weeks before physical disruptions** using **GraphSAGE** on trade entity graphs.")

    ds = doc_an.summary()
    m = st.columns(5)
    m[0].metric("Total Docs", ds["total"])
    m[1].metric("Normal", ds["normal"])
    m[2].metric("Flagged", ds["alerts"], delta=f"⚠ {ds['alerts']}" if ds["alerts"] else "0")
    m[3].metric("Review", ds.get("review", 0))
    m[4].metric("Total Value", f"${ds['total_value']:,.0f}")
    st.markdown("---")

    t1, t2 = st.tabs(["📊 Deviation Analysis", "🔵 Anomaly Scatter"])
    with t1: st.plotly_chart(viz.doc_deviation_chart(doc_an.docs), use_container_height=True)
    with t2: st.plotly_chart(viz.doc_anomaly_scatter(doc_an.docs), use_container_height=True)

    hdr("Document Details", "📋")
    fc1, fc2 = st.columns(2)
    with fc1: sf = st.multiselect("Status", ["normal","review","alert","critical"], default=["critical","alert"])
    with fc2: tf = st.multiselect("Type", list(set(d["type"] for d in doc_an.docs)),
                                   default=list(set(d["type"] for d in doc_an.docs)))

    filtered = [d for d in doc_an.docs if d["status"] in sf and d["type"] in tf]
    st.caption(f"Showing {len(filtered)} of {len(doc_an.docs)}")

    for d in filtered[:30]:
        st.markdown(viz.doc_card(d), unsafe_allow_html=True)
        # Action buttons per document
        db1, db2, db3 = st.columns(3)
        with db1:
            if st.button(f"🔍 Investigate", key=f"inv_{d['id']}"):
                dlog.log("investigate", d["id"], dict(supplier=d.get("supplier",""),
                        deviation=d.get("deviation",0), status=d["status"]))
                st.toast(f"Investigating {d['id']}", icon="🔍")
        with db2:
            if st.button(f"⚠️ False Positive", key=f"fp_{d['id']}"):
                dlog.log("false_positive", d["id"], dict(original_status=d["status"]))
                d["status"] = "normal"
                st.toast(f"Marked {d['id']} as false positive", icon="⚠️")
        with db3:
            if st.button(f"📋 Compliance", key=f"comp_{d['id']}"):
                dlog.log("compliance", d["id"], dict(supplier=d.get("supplier",""),
                        amount=d.get("amount",0), signals=d.get("signals",[])))
                st.toast(f"Compliance review for {d['id']}", icon="📋")
        with st.expander(f"🧠 Analysis — {d['id']}"):
            st.markdown(explainer.explain_document(d))

    hdr("Upload Document", "📤")
    up = st.file_uploader("Upload CSV/PDF for analysis", type=["csv","txt","pdf"])
    if up:
        st.success(f"'{up.name}' — analyzing with Gemini 1.5 Pro...")
        time.sleep(1.2)
        st.markdown(f"""
        <div style="background:{C['green_bg']};padding:14px;border-radius:8px;border:1px solid #bbf7d0">
            <div style="color:{C['accent']};font-weight:600">✅ Document Processed</div>
            <div style="color:{C['txt3']};font-size:13px;margin-top:6px">
                <b>Entities:</b> 12 companies, 5 ports, 3 commodity codes<br>
                <b>Trade Graph:</b> 3 nodes, 2 anomaly edges<br>
                <b>Score:</b> <span style="color:{C['warn']}">0.34</span> (normal)
            </div>
        </div>""", unsafe_allow_html=True)


# ─── Crowd Intelligence ──────────────────────────────────────────────────────

elif page == "Crowd Intelligence":
    st.title("👥 Crowd Intelligence — Waze for Supply Chains")
    st.markdown("Drivers & workers contribute **10-second voice notes** via WhatsApp. "
                "**3 reports** within 5 km / 30 min auto-verify. Value ∝ n^1.5.")

    cs = crowd.stats()
    sc = st.columns(6)
    sc[0].metric("Reports", f"{cs['total_reports']:,}")
    sc[1].metric("Verified", f"{cs['verified']:,}")
    sc[2].metric("Rate", f"{cs['verification_rate']:.0%}")
    sc[3].metric("Contributors", str(cs['active_contributors']))
    sc[4].metric("Credibility", f"{cs['avg_credibility']:.2f}")
    sc[5].metric("Network Value", f"{cs['network_value']:.0f}")
    st.markdown("---")

    mc, cc = st.columns([1.5, 1])
    with mc:
        hdr("Crowd Report Map — India", "🗺")
        st.plotly_chart(viz.crowd_map(crowd.voice_notes), use_container_height=True)
    with cc:
        hdr("Categories", "📊")
        if cs["categories"]:
            st.plotly_chart(viz.crowd_category_chart(cs["categories"]), use_container_height=True)
        hdr("Network Effect", "📈")
        st.plotly_chart(viz.crowd_network_value_chart(cs["active_contributors"]), use_container_height=True)

    hdr("Latest Voice Notes", "🎤")
    st.markdown(f"""
    <div style="background:{C['card']};padding:8px;border-radius:6px;margin-bottom:10px;
        display:flex;justify-content:space-between;font-size:11px;color:{C['txt3']};
        border:1px solid {C['border']}">
        <span>🟢 Verified</span><span>⚪ Unverified</span><span>Hindi · Tamil · Bengali · Marathi</span>
    </div>""", unsafe_allow_html=True)

    for vn in crowd.voice_notes[:15]:
        v = vn.get("verified", False)
        ic = "🟢" if v else "⚪"
        sev = vn.get("severity", 0)
        sc2 = C['crit'] if sev>.7 else (C['warn'] if sev>.4 else C['accent'])
        bc = C['accent'] if v else C['txt4']
        cat = vn.get("category","").replace("_"," ").title()
        st.markdown(f"""
        <div style="background:{C['card']};padding:10px;border-radius:7px;
            border-left:3px solid {bc};margin-bottom:6px;border:1px solid {C['border']};
            border-left:3px solid {bc}">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-size:13px;color:{C['txt']};font-weight:600">{ic} {vn.get('location_name','')}</div>
                <div style="font-size:10px;color:{C['txt4']}">{vn.get('timestamp','')[:16]}</div>
            </div>
            <div style="font-size:12px;color:{C['txt3']};margin-top:3px">
                {cat} | {vn.get('language','')} | {vn.get('duration_sec',0)}s | Cred: {vn.get('credibility_score',0):.0%}
            </div>
            <div style="display:flex;gap:14px;margin-top:4px;font-size:11px">
                <span style="color:{sc2};font-weight:600">Sev: {sev:.0%}</span>
                <span style="color:{C['blue']}">Nearby: {vn.get('nearby_reports',0)}</span>
                <span style="color:{C['txt4']}">{vn.get('contributor_id','')}</span>
            </div>
        </div>""", unsafe_allow_html=True)

    if crowd.contributors:
        hdr("Top Contributors", "🏅")
        cdf = pd.DataFrame(crowd.contributors).sort_values("credibility_score", ascending=False).head(20)
        cdf = cdf[["contributor_id","role","state","total_reports","verified_reports","credibility_score","impact_score"]].copy()
        cdf.columns = ["ID","Role","State","Reports","Verified","Cred","Impact"]
        st.dataframe(cdf, use_container_width=True, hide_index=True)

    hdr("WhatsApp Bot", "💬")
    st.markdown(f"""
    <div style="background:{C['green_bg']};padding:16px;border-radius:10px;border:1px solid #bbf7d0">
        <div style="color:{C['accent']};font-weight:600;font-size:13px;margin-bottom:8px">How it works</div>
        <div style="font-size:12px;color:{C['txt2']};line-height:1.7">
            1. Driver sends <b>10s voice note</b> via WhatsApp Business API<br>
            2. Gemini transcribes & classifies: congestion / weather / accident / customs / strike<br>
            3. GPS or landmark geocoding via Google Maps<br>
            4. Bayesian credibility from contributor history<br>
            5. <b>3 reports</b> within 5km/30min → auto-verified disruption<br>
            6. All contributors get aggregated intelligence
        </div>
    </div>""", unsafe_allow_html=True)
    bc = st.columns(3)
    with bc[0]:
        if st.button("🎤 Hindi", use_container_width=True): st.toast("Transcribing…", icon="🎤")
    with bc[1]:
        if st.button("🎤 Tamil", use_container_width=True): st.toast("Processing…", icon="🎤")
    with bc[2]:
        if st.button("🎤 Bengali", use_container_width=True): st.toast("Processing…", icon="🎤")


# ═══════════════════════════════════════════════════════════════════════════════
# NEW PAGES
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Shipment Tracker (Improvement 1) ────────────────────────────────────────

elif page == "Shipment Tracker":
    st.title("📦 Shipment Tracker")
    st.markdown("Search, filter, and track shipments with risk flags and reroute actions.")

    if ship_df.empty:
        st.warning("No shipment data loaded. Run `python generate_data.py` first.")
    else:
        # KPIs
        total = len(ship_df)
        in_transit = (ship_df["status"] == "in_transit").sum()
        delayed = (ship_df["status"] == "delayed").sum()
        disrupted = (ship_df["status"] == "disrupted").sum()
        on_time_pct = 1 - (ship_df["delay_days"] > 0).mean()

        k1, k2, k3, k4, k5 = st.columns(5)
        k1.metric("Total Shipments", f"{total:,}")
        k2.metric("In Transit", f"{in_transit:,}")
        k3.metric("Delayed", f"{delayed:,}")
        k4.metric("Disrupted", f"{disrupted:,}")
        k5.metric("On-Time Rate", f"{on_time_pct:.1%}")
        st.markdown("---")

        # Filters
        hdr("Filters", "🔍")
        f1, f2, f3, f4 = st.columns(4)
        with f1:
            search = st.text_input("Search ID / Origin / Dest", "")
        with f2:
            status_filter = st.multiselect("Status", ship_df["status"].unique().tolist(),
                                           default=ship_df["status"].unique().tolist())
        with f3:
            commodity_filter = st.multiselect("Commodity", ship_df["commodity"].unique().tolist(),
                                              default=[])
        with f4:
            risk_threshold = st.slider("Min Risk Score", 0.0, 1.0, 0.0, 0.05)

        # Apply filters
        filtered = ship_df[ship_df["status"].isin(status_filter)].copy()
        if search:
            mask = (filtered["shipment_id"].str.contains(search, case=False) |
                    filtered["origin_name"].str.contains(search, case=False) |
                    filtered["dest_name"].str.contains(search, case=False))
            filtered = filtered[mask]
        if commodity_filter:
            filtered = filtered[filtered["commodity"].isin(commodity_filter)]
        if risk_threshold > 0:
            filtered = filtered[filtered["risk_score"] >= risk_threshold]

        st.caption(f"Showing {len(filtered)} of {total} shipments")

        # Risk-flagged shipments
        high_risk = filtered[filtered["risk_score"] > 0.3].sort_values("risk_score", ascending=False)
        if not high_risk.empty:
            hdr("Risk-Flagged Shipments", "🚩")
            for _, row in high_risk.head(10).iterrows():
                risk_info = risk_eng.shipment_risk(row.to_dict())
                rc = C['crit'] if risk_info["composite"] > 50 else (C['warn'] if risk_info["composite"] > 25 else C['accent'])
                st.markdown(f"""
                <div style="background:{C['card']};padding:12px;border-radius:8px;
                    border-left:3px solid {rc};margin-bottom:8px;border:1px solid {C['border']};
                    border-left:3px solid {rc}">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div style="font-size:13px;color:{C['txt']};font-weight:600">
                            📦 {row['shipment_id']} — {row['commodity']}
                        </div>
                        <div style="font-size:12px;color:{rc};font-weight:700">Risk: {risk_info['composite']}/100</div>
                    </div>
                    <div style="font-size:12px;color:{C['txt3']};margin-top:3px">
                        {row['origin_name']} → {row['dest_name']} | {row['carrier']} | {row['status']} |
                        Delay: {row['delay_days']}d | TEU: {row['teu']} | ${row['total_cost_usd']:,}
                    </div>
                </div>""", unsafe_allow_html=True)
                rb1, rb2 = st.columns(2)
                with rb1:
                    if st.button(f"🔀 Reroute", key=f"ship_reroute_{row['shipment_id']}"):
                        dlog.log("reroute", row["shipment_id"],
                                dict(carrier=row["carrier"], origin=row["origin_name"],
                                     dest=row["dest_name"], predicted_savings=int(row["total_cost_usd"] * 0.15),
                                     outcome="pending"))
                        st.toast(f"Reroute requested for {row['shipment_id']}", icon="🔀")
                with rb2:
                    if st.button(f"📋 Details", key=f"ship_detail_{row['shipment_id']}"):
                        st.toast(f"Opening {row['shipment_id']}", icon="📋")

        # Full data table
        hdr("All Filtered Shipments", "📊")
        display_cols = ["shipment_id","booking_date","eta","origin_name","dest_name",
                        "commodity","carrier","status","delay_days","risk_score","total_cost_usd"]
        show_cols = [c for c in display_cols if c in filtered.columns]
        st.dataframe(filtered[show_cols].head(200), use_container_width=True, hide_index=True)


# ─── Scenario Sandbox (Improvement 4) ────────────────────────────────────────

elif page == "Scenario Sandbox":
    st.title("🎮 Scenario Sandbox")
    st.markdown("What-if analysis. Run preset disruptions to see impact on the network. "
                "**SIR state is fully restored after each run.**")

    preset_names = list(sim.ScenarioEngine.PRESETS.keys())
    health_now = risk_eng.network_health()

    k1, k2 = st.columns(2)
    with k1:
        st.markdown(viz.kpi_html("Current Network Health", f"{health_now:.1f}/100",
                                  color=C['accent'], icon="🟢"), unsafe_allow_html=True)
    with k2:
        st.markdown(viz.kpi_html("Scenarios Available", str(len(preset_names)),
                                  color=C['blue'], icon="🎮"), unsafe_allow_html=True)
    st.markdown("---")

    selected = st.selectbox("Select Scenario", preset_names)
    preset = sim.ScenarioEngine.PRESETS[selected]
    st.markdown(f"""
    <div style="background:{C['card']};padding:14px;border-radius:8px;border:1px solid {C['border']};
        margin-bottom:12px">
        <div style="font-size:13px;color:{C['txt']};font-weight:600">{selected}</div>
        <div style="font-size:12px;color:{C['txt3']};margin-top:4px">{preset['description']}</div>
        <div style="font-size:11px;color:{C['txt4']};margin-top:6px">
            Seed nodes: {', '.join(preset.get('seed_nodes',[])) or 'None'} |
            Severity: {preset.get('severity', 0):.0%} |
            Beta multiplier: {preset.get('beta_mult', 1.0):.1f}x
        </div>
    </div>""", unsafe_allow_html=True)

    if st.button("🚀 Run Scenario", use_container_width=True, type="primary"):
        with st.spinner("Running 30-step simulation..."):
            result = scenario.run_scenario(selected)
            st.session_state.last_scenario = result
            dlog.log("scenario", selected, dict(health_delta=result["health_delta"],
                                                 cost=result["cost_estimate"]))
            st.toast(f"Scenario complete: {result['health_delta']:+.1f} health", icon="🚀")

    if st.session_state.last_scenario:
        r = st.session_state.last_scenario

        hdr("Results", "📊")
        r1, r2, r3, r4 = st.columns(4)
        r1.markdown(viz.kpi_html("Before Health", f"{r['before_health']:.1f}",
                                  color=C['accent'], icon="🟢"), unsafe_allow_html=True)
        r2.markdown(viz.kpi_html("After Health", f"{r['after_health']:.1f}",
                                  delta=f"{r['health_delta']:+.1f}",
                                  color=C['crit'] if r['health_delta'] < -10 else C['warn'],
                                  icon="🔴"), unsafe_allow_html=True)
        r3.markdown(viz.kpi_html("Affected Nodes", str(len(r['affected_nodes'])),
                                  color=C['warn'], icon="📍"), unsafe_allow_html=True)
        r4.markdown(viz.kpi_html("Cost Estimate", f"${r['cost_estimate']:,}",
                                  color=C['crit'], icon="💰"), unsafe_allow_html=True)

        g1, g2 = st.columns([1.2, 1])
        with g1:
            st.plotly_chart(viz.scenario_comparison(r), use_container_height=True)
        with g2:
            if r.get("scenario_history"):
                st.plotly_chart(viz.sir_curves(r["scenario_history"]), use_container_height=True)

        if r["affected_nodes"]:
            hdr("Affected Nodes", "📍")
            for nid in r["affected_nodes"]:
                nd = net.nodes.get(nid)
                name = nd.name if nd else nid
                st.markdown(f"- **{name}** ({nid})")


# ─── Network Trends (Improvement 6) ──────────────────────────────────────────

elif page == "Network Trends":
    st.title("📈 Network Trends & Historical Analysis")
    st.markdown("Analyze disruption patterns, recovery times, and network health over time.")

    if disr_df.empty:
        st.warning("No disruption data loaded. Run `python generate_data.py` first.")
    else:
        tab1, tab2, tab3, tab4 = st.tabs(["30-Day Health Trend", "Week Comparison",
                                           "Most Disrupted Corridors", "Fastest Recovery"])

        with tab1:
            hdr("Network Health — 30 Day Trend", "📉")
            daily = historical.health_trend_30d()
            if not daily.empty:
                st.plotly_chart(viz.health_trend_chart(daily), use_container_height=True)
                st.dataframe(daily.tail(30), use_container_width=True, hide_index=True)
            else:
                st.info("No data available.")

        with tab2:
            hdr("Week-over-Week Comparison", "📊")
            wc = historical.week_comparison()
            w1, w2, w3, w4 = st.columns(4)
            w1.metric("This Week Events", wc["this_week"])
            w2.metric("Last Week Events", wc["last_week"])
            w3.metric("Delta", wc["delta"],
                      delta_color="inverse" if wc["delta"] > 0 else "normal")
            w4.metric("This Week Loss", f"${wc['this_loss']:,}")

            w5, w6 = st.columns(2)
            with w5:
                st.markdown(viz.kpi_html("This Week Loss", f"${wc['this_loss']:,}",
                            color=C['crit'] if wc['this_loss'] > wc['last_loss'] else C['accent'],
                            icon="💰"), unsafe_allow_html=True)
            with w6:
                st.markdown(viz.kpi_html("Last Week Loss", f"${wc['last_loss']:,}",
                            color=C['warn'], icon="💰"), unsafe_allow_html=True)

        with tab3:
            hdr("Most Disrupted Corridors", "🔴")
            top_n = st.slider("Show top N", 5, 20, 10, key="top_disrupted")
            md = historical.most_disrupted(top_n)
            if not md.empty:
                st.dataframe(md, use_container_width=True, hide_index=True)
                if "total_loss" in md.columns:
                    fig = viz.go.Figure()
                    fig.add_trace(viz.go.Bar(x=md["port_name"], y=md["total_loss"],
                                             marker_color=viz.CRIT,
                                             marker_line=dict(width=0.5, color=viz.WHITE)))
                    fig.update_layout(**viz._layout(height=350), xaxis_title="Port",
                                      yaxis_title="Total Loss ($)",
                                      title=viz._title("Economic Loss by Port"))
                    st.plotly_chart(fig, use_container_height=True)
            else:
                st.info("No data available.")

        with tab4:
            hdr("Fastest Recovery Times", "⚡")
            top_n2 = st.slider("Show top N", 5, 20, 10, key="top_recovery")
            fr = historical.fastest_recovery(top_n2)
            if not fr.empty:
                st.dataframe(fr, use_container_width=True, hide_index=True)
                fig = viz.go.Figure()
                fig.add_trace(viz.go.Bar(x=fr["port_name"], y=fr["avg_recovery_h"],
                                         marker_color=viz.ACCENT,
                                         marker_line=dict(width=0.5, color=viz.WHITE)))
                fig.update_layout(**viz._layout(height=350), xaxis_title="Port",
                                  yaxis_title="Avg Recovery (hours)",
                                  title=viz._title("Fastest Recovery Ports"))
                st.plotly_chart(fig, use_container_height=True)
            else:
                st.info("No data available.")


# ─── Decision History (Improvement 7) ────────────────────────────────────────

elif page == "Decision History":
    st.title("📝 Decision History & Audit Trail")
    st.markdown("Every action you take is logged. Review past decisions, track outcomes, and measure agent trust.")

    summary = dlog.summary()
    entries = dlog.entries

    k1, k2 = st.columns(2)
    k1.metric("Total Decisions", summary["total"])
    with k2:
        if summary["by_type"]:
            type_str = " | ".join(f"{k}: {v}" for k, v in summary["by_type"].items())
            st.markdown(f"**By Type:** {type_str}")
        else:
            st.info("No decisions logged yet.")
    st.markdown("---")

    if entries:
        # Filter
        all_types = list(set(e["action_type"] for e in entries))
        ft = st.multiselect("Filter by Action Type", all_types, default=all_types)
        filtered_entries = [e for e in entries if e["action_type"] in ft]

        hdr("Audit Trail", "📜")
        for entry in reversed(filtered_entries[-50:]):
            st.markdown(viz.audit_entry_html(entry), unsafe_allow_html=True)

        # Reroute outcomes chart
        reroutes = dlog.reroute_entries()
        if reroutes:
            hdr("Reroute Outcomes", "🔀")
            st.plotly_chart(viz.reroute_history_chart(reroutes), use_container_height=True)

        # Agent trust scores
        hdr("Agent Trust Scores", "🏆")
        trust = dlog.agent_trust_scores(market)
        if trust:
            for carrier, score in trust.items():
                tc = C['accent'] if score > 0.7 else (C['warn'] if score > 0.4 else C['crit'])
                bar_width = int(score * 100)
                st.markdown(f"""
                <div style="margin-bottom:8px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                        <span style="font-size:13px;color:{C['txt']};font-weight:600">{carrier}</span>
                        <span style="font-size:13px;color:{tc};font-weight:700">{score:.0%}</span>
                    </div>
                    <div style="background:{C['card']};border-radius:4px;height:8px;overflow:hidden">
                        <div style="background:{tc};width:{bar_width}%;height:100%;border-radius:4px"></div>
                    </div>
                </div>""", unsafe_allow_html=True)
        else:
            st.info("Accept or reject routes to build trust scores.")
    else:
        st.markdown(f"""
        <div style="background:{C['card']};padding:30px;border-radius:10px;text-align:center;
            border:1px solid {C['border']}">
            <div style="font-size:36px">📋</div>
            <div style="color:{C['txt']};font-size:16px;font-weight:600;margin-top:8px">No Decisions Yet</div>
            <div style="color:{C['txt3']};font-size:13px;margin-top:6px;line-height:1.6">
                Start making decisions to see your audit trail here.<br>
                Try: seed a disruption, accept/reject routes, investigate documents, or reroute shipments.
            </div>
        </div>""", unsafe_allow_html=True)
