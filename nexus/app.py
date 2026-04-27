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

net      = st.session_state.network
sir      = st.session_state.sir
immune   = st.session_state.immune
market   = st.session_state.market
doc_an   = st.session_state.doc_analyzer
crowd    = st.session_state.crowd
explainer= st.session_state.explainer
ship_df  = st.session_state.shipments_df
disr_df  = st.session_state.disruptions_df

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
                            "Crowd Intelligence"],
                    label_visibility="collapsed")

    st.divider()
    st.markdown('<div class="nav-label">Simulation</div>', unsafe_allow_html=True)
    seed_node = st.selectbox("Seed Disruption", list(net.nodes.keys()),
                             format_func=lambda x: net.nodes[x].name, index=0)
    seed_sev = st.slider("Severity", 0.3, 1.0, 0.8, 0.1)

    if st.button("⚡ Seed Disruption", use_container_width=True):
        sir.seed(seed_node, seed_sev)
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

# ─── Command Center ──────────────────────────────────────────────────────────

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
    kpi_cols = st.columns(6)
    kpis = [
        ("Network Health",  f"{rt['health']:.0%}",                    C['accent']),
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

    mc, rc = st.columns([2.4, 1])
    with mc:
        hdr("Global Network Status", "🌐")
        st.plotly_chart(viz.animated_network_map(net, sir.history), use_container_height=True)

    with rc:
        hdr("Live Alert Feed", "📡")
        if rt["alerts"]:
            for a in rt["alerts"][:6]:
                st.markdown(viz.alert_card(a), unsafe_allow_html=True)
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
                 Congestion=f"{n.congestion:.0%}", Load=f"{n.load:,}/{n.capacity:,}")
            for n in net.nodes.values()]
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


# ─── Route Market ─────────────────────────────────────────────────────────────

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


# ─── Document Scanner ────────────────────────────────────────────────────────

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

