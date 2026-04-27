"""
NEXUS — Plotly Visualizations
Interactive maps, SIR curves, heatmaps, agent charts, document analysis,
crowd visualizations, acoustic displays, and advanced analytics
"""

import plotly.graph_objects as go
import plotly.express as px
import numpy as np
import pandas as pd
from typing import List, Dict


THEME = "plotly_dark"
ACCENT = "#00d4aa"
WARN = "#ff6b35"
CRIT = "#ff3333"
RECOVER = "#7b68ee"
INFO = "#4fc3f7"
BG = "#0e1117"
CARD = "#1a1a2e"

STATUS_COLOR = dict(normal=ACCENT, stressed="#ffa726", disrupted=CRIT, recovered=RECOVER)

PLOTLY_LAYOUT = dict(
    margin=dict(l=40, r=20, t=40, b=30),
    paper_bgcolor=BG,
    plot_bgcolor=BG,
    font=dict(color="#ccc", size=12),
)


def _base_layout(**kwargs):
    layout = dict(**PLOTLY_LAYOUT)
    layout.update(kwargs)
    return layout


# ─── Global Network Map ──────────────────────────────────────────────────────

def network_map(network) -> go.Figure:
    fig = go.Figure()

    for e in network.edges:
        src, dst = network.nodes.get(e.src), network.nodes.get(e.dst)
        if not src or not dst:
            continue
        color = CRIT if e.risk > 0.20 else (WARN if e.risk > 0.15 else "rgba(0,212,170,0.3)")
        width = 2.5 if e.risk > 0.20 else (1.8 if e.risk > 0.15 else 1.0)
        fig.add_trace(go.Scattergeo(
            lon=[src.lon, dst.lon], lat=[src.lat, dst.lat],
            mode="lines", line=dict(width=width, color=color),
            opacity=0.5, hoverinfo="skip", showlegend=False,
        ))

    lats, lons, texts, colors, sizes = [], [], [], [], []
    for nd in network.nodes.values():
        lats.append(nd.lat); lons.append(nd.lon)
        c = STATUS_COLOR.get(nd.status, ACCENT)
        colors.append(c)
        sizes.append(16 if nd.kind == "port" else 10)
        texts.append(f"<b>{nd.name}</b><br>Status: {nd.status}<br>"
                     f"Congestion: {nd.congestion:.0%}<br>"
                     f"Load: {nd.load:,}/{nd.capacity:,}")

    fig.add_trace(go.Scattergeo(
        lon=lons, lat=lats, mode="markers+text",
        marker=dict(size=sizes, color=colors, line=dict(width=1.5, color="white"),
                    symbol="circle", opacity=0.9),
        text=[n.name for n in network.nodes.values()],
        textposition="top center", textfont=dict(size=8, color="white"),
        hovertext=texts, hoverinfo="text",
        showlegend=False,
    ))

    fig.update_geos(
        projection_type="natural earth", showland=True, landcolor="#1a1a2e",
        showocean=True, oceancolor="#0d1b2a", showcountries=True,
        countrycolor="#333", showlakes=False, coastlinecolor="#333",
        center=dict(lat=15, lon=75), lonaxis_range=[-120, 140], lataxis_range=[-40, 55],
    )
    fig.update_layout(
        margin=dict(l=0, r=0, t=0, b=0), paper_bgcolor=BG, height=520,
        geo=dict(bgcolor=BG),
    )
    return fig


# ─── Animated Network Map ─────────────────────────────────────────────────────

def animated_network_map(network, history: list) -> go.Figure:
    """Network map with disruption intensity shown via animation frames."""
    fig = go.Figure()

    lats, lons, names = [], [], []
    for nd in network.nodes.values():
        lats.append(nd.lat); lons.append(nd.lon); names.append(nd.name)

    if history:
        last = history[-1]
        colors = []
        sizes = []
        for i, nd in enumerate(network.nodes.values()):
            inf = last["I"][i]
            if inf > 0.5:
                colors.append(CRIT)
                sizes.append(20 + inf * 15)
            elif inf > 0.2:
                colors.append(WARN)
                sizes.append(14 + inf * 10)
            else:
                colors.append(ACCENT)
                sizes.append(10)
    else:
        colors = [ACCENT] * len(lats)
        sizes = [10] * len(lats)

    for e in network.edges:
        src, dst = network.nodes.get(e.src), network.nodes.get(e.dst)
        if src and dst:
            fig.add_trace(go.Scattergeo(
                lon=[src.lon, dst.lon], lat=[src.lat, dst.lat],
                mode="lines", line=dict(width=1.2, color="rgba(0,212,170,0.25)"),
                hoverinfo="skip", showlegend=False,
            ))

    fig.add_trace(go.Scattergeo(
        lon=lons, lat=lats, mode="markers",
        marker=dict(size=sizes, color=colors, line=dict(width=1, color="white"),
                    opacity=0.9),
        text=names, textposition="top center", textfont=dict(size=7, color="white"),
        hovertext=[f"<b>{n}</b>" for n in names], hoverinfo="text",
        showlegend=False,
    ))

    fig.update_geos(
        projection_type="natural earth", showland=True, landcolor="#1a1a2e",
        showocean=True, oceancolor="#0d1b2a", showcountries=True,
        countrycolor="#333", coastlinecolor="#333",
        center=dict(lat=15, lon=75), lonaxis_range=[-120, 140], lataxis_range=[-40, 55],
    )
    fig.update_layout(margin=dict(l=0, r=0, t=0, b=0), paper_bgcolor=BG, height=520,
                      geo=dict(bgcolor=BG))
    return fig


# ─── SIR Curves ──────────────────────────────────────────────────────────────

def sir_curves(history: List[dict]) -> go.Figure:
    if not history:
        return go.Figure().update_layout(title="Run simulation to see curves",
                                          template=THEME, height=350)
    ts = [h["t"] for h in history]
    S = [h["S"].sum() for h in history]
    I = [h["I"].sum() for h in history]
    R = [h["R"].sum() for h in history]

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ts, y=S, name="Susceptible", fill="tozeroy",
                             fillcolor="rgba(0,212,170,0.08)",
                             line=dict(color=ACCENT, width=2.5)))
    fig.add_trace(go.Scatter(x=ts, y=I, name="Infected", fill="tozeroy",
                             fillcolor="rgba(255,51,51,0.08)",
                             line=dict(color=CRIT, width=2.5)))
    fig.add_trace(go.Scatter(x=ts, y=R, name="Recovered", fill="tozeroy",
                             fillcolor="rgba(123,104,238,0.08)",
                             line=dict(color=RECOVER, width=2.5)))
    fig.update_layout(**_base_layout(height=380),
                      xaxis_title="Time Step", yaxis_title="Nodes",
                      legend=dict(orientation="h", yanchor="bottom", y=1.02,
                                  xanchor="right", x=1, font=dict(size=11)))
    return fig


# ─── Per-node disruption bar ─────────────────────────────────────────────────

def node_disruption_bars(network) -> go.Figure:
    names = [n.name for n in network.nodes.values()]
    vals = [n.congestion for n in network.nodes.values()]
    cols = [STATUS_COLOR.get(n.status, ACCENT) for n in network.nodes.values()]

    fig = go.Figure(go.Bar(x=names, y=vals, marker_color=cols,
                           marker_line=dict(color="white", width=0.5)))
    fig.update_layout(**_base_layout(height=300),
                      xaxis_tickangle=-45, yaxis_title="Disruption Level",
                      yaxis_range=[0, 1])
    return fig


# ─── Agent negotiation chart ─────────────────────────────────────────────────

def agent_chart(bids: List[dict]) -> go.Figure:
    carriers = [b["carrier"] for b in bids]
    fig = go.Figure()
    fig.add_trace(go.Bar(name="Bid (USD)", x=carriers,
                         y=[b["bid"] for b in bids], marker_color=WARN,
                         marker_line=dict(width=0.5, color="white")))
    fig.add_trace(go.Bar(name="Score×10k", x=carriers,
                         y=[b["score"] * 10000 for b in bids], marker_color=ACCENT,
                         marker_line=dict(width=0.5, color="white")))
    fig.update_layout(**_base_layout(height=350), barmode="group",
                      yaxis_title="Value")
    return fig


# ─── Agent score radar ────────────────────────────────────────────────────────

def agent_radar(bids: List[dict]) -> go.Figure:
    categories = ["Cost Efficiency", "Speed", "Safety", "Overall Score"]
    fig = go.Figure()
    for b in bids:
        vals = [
            1 - b["bid"] / max(x["bid"] for x in bids),
            1 - b["hours"] / max(x["hours"] for x in bids),
            1 - b["risk"],
            b["score"],
        ]
        fig.add_trace(go.Scatterpolar(r=vals, theta=categories, fill="toself",
                                       name=b["carrier"], opacity=0.5,
                                       line=dict(width=2)))
    fig.update_layout(**_base_layout(height=400),
                      polar=dict(radialaxis=dict(visible=True, range=[0, 1],
                                                  gridcolor="#333", linecolor="#333"),
                                  bgcolor=BG),
                      showlegend=True, legend=dict(font=dict(size=10)))
    return fig


# ─── Document analysis chart ─────────────────────────────────────────────────

def doc_deviation_chart(docs: List[dict]) -> go.Figure:
    names = [f"{d['id'][:12]}" for d in docs]
    devs = [d["deviation"] * 100 for d in docs]
    cols = [CRIT if abs(d["deviation"]) > 0.15 else (WARN if abs(d["deviation"]) > 0.08 else ACCENT)
            for d in docs]

    fig = go.Figure(go.Bar(x=names, y=devs, marker_color=cols,
                           marker_line=dict(color="white", width=0.5)))
    fig.add_hline(y=15, line_dash="dash", line_color=CRIT, annotation_text="Critical",
                  annotation=dict(font=dict(size=10, color=CRIT)))
    fig.add_hline(y=-15, line_dash="dash", line_color=CRIT)
    fig.add_hline(y=8, line_dash="dot", line_color=WARN, annotation_text="Warning",
                  annotation=dict(font=dict(size=10, color=WARN)))
    fig.add_hline(y=-8, line_dash="dot", line_color=WARN)
    fig.update_layout(**_base_layout(height=320),
                      xaxis_tickangle=-45, yaxis_title="Deviation (%)")
    return fig


# ─── Document anomaly scatter ────────────────────────────────────────────────

def doc_anomaly_scatter(docs: List[dict]) -> go.Figure:
    amounts = [d["amount"] for d in docs]
    scores = [d.get("anomaly_score", abs(d["deviation"]) * 5) for d in docs]
    statuses = [d["status"] for d in docs]
    names = [d["id"][:12] for d in docs]
    cols = [CRIT if s == "critical" else (WARN if s == "alert" else (INFO if s == "review" else ACCENT))
            for s in statuses]

    fig = go.Figure(go.Scatter(x=amounts, y=scores, mode="markers+text",
                                marker=dict(size=12, color=cols, line=dict(width=1, color="white")),
                                text=names, textposition="top center",
                                textfont=dict(size=8, color="#aaa"),
                                hovertext=[f"{d['id']}<br>{d['supplier']}<br>${d['amount']:,}"
                                           for d in docs],
                                hoverinfo="text"))
    fig.add_hline(y=0.5, line_dash="dash", line_color=WARN,
                  annotation_text="Anomaly threshold")
    fig.update_layout(**_base_layout(height=350),
                      xaxis_title="Amount (USD)", yaxis_title="Anomaly Score")
    return fig


# ─── R-number over time ──────────────────────────────────────────────────────

def r_number_chart(history: List[dict], beta: float, gamma: float) -> go.Figure:
    if not history:
        return go.Figure().update_layout(title="No data", template=THEME, height=250)
    ts = [h["t"] for h in history]
    Rs = [beta / gamma * np.mean(h["I"][h["I"] > 0.1]) if np.any(h["I"] > 0.1) else 0
          for h in history]

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ts, y=Rs, line=dict(color=WARN, width=2.5),
                              fill="tozeroy", fillcolor="rgba(255,107,53,0.1)"))
    fig.add_hline(y=1.0, line_dash="dash", line_color=ACCENT, line_width=2,
                  annotation_text="R=1 (containment)", annotation_font_size=10)
    fig.update_layout(**_base_layout(height=250),
                      xaxis_title="Time", yaxis_title="R effective")
    return fig


# ─── Herd Immunity Gauge ─────────────────────────────────────────────────────

def herd_immunity_gauge(pc: float, Reff: float) -> go.Figure:
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=pc * 100,
        delta=dict(reference=50, suffix="%", font=dict(size=16)),
        domain=dict(x=[0, 1], y=[0, 1]),
        title=dict(text=f"R₀ = {Reff:.2f}", font=dict(size=16, color="#ccc")),
        gauge=dict(axis=dict(range=[0, 100], tickwidth=1, tickcolor="#666"),
                   bar=dict(color=WARN if pc > 0.5 else ACCENT, thickness=0.7),
                   steps=[dict(range=[0, 30], color="#0a2a1a"),
                          dict(range=[30, 60], color="#1a2a0a"),
                          dict(range=[60, 100], color="#2a1a0a")],
                   threshold=dict(line=dict(color="white", width=3), value=pc * 100)),
        number=dict(suffix="%", font=dict(size=32)),
    ))
    fig.update_layout(**_base_layout(height=280))
    return fig


# ─── Immune system similarity gauge ──────────────────────────────────────────

def immune_gauge(similarity: float) -> go.Figure:
    fig = go.Figure(go.Indicator(
        mode="gauge+number", value=similarity * 100,
        domain=dict(x=[0, 1], y=[0, 1]),
        gauge=dict(axis=dict(range=[0, 100]),
                   bar=dict(color=CRIT if similarity > 0.82 else ACCENT),
                   steps=[dict(range=[0, 82], color="#1a1a2e"),
                          dict(range=[82, 100], color="#2a1a1e")],
                   threshold=dict(line=dict(color="white", width=3), value=82)),
        number=dict(suffix="%", font=dict(size=28)),
    ))
    fig.update_layout(**_base_layout(height=280))
    return fig


# ─── Crowd Contribution Map ──────────────────────────────────────────────────

def crowd_map(voice_notes: list) -> go.Figure:
    if not voice_notes:
        return go.Figure().update_layout(title="No crowd data", template=THEME, height=400)

    lats = [v.get("lat", 0) for v in voice_notes]
    lons = [v.get("lon", 0) for v in voice_notes]
    sev = [v.get("severity", 0) for v in voice_notes]
    texts = [f"{v.get('location_name', 'N/A')}<br>{v.get('category', '').replace('_', ' ').title()}<br>"
             f"Severity: {v.get('severity', 0):.0%}<br>Language: {v.get('language', 'N/A')}"
             for v in voice_notes]
    verified = [v.get("verified", False) for v in voice_notes]
    colors = [ACCENT if v else "#666" for v in verified]

    fig = go.Figure(go.Scattergeo(
        lon=lons, lat=lats, mode="markers",
        marker=dict(size=[6 + s * 12 for s in sev], color=colors,
                    line=dict(width=1, color="white"), opacity=0.7,
                    symbol="circle"),
        hovertext=texts, hoverinfo="text", showlegend=False,
    ))
    fig.update_geos(
        projection_type="natural earth", showland=True, landcolor="#1a1a2e",
        showocean=True, oceancolor="#0d1b2a", showcountries=True,
        countrycolor="#333", showlakes=False,
        center=dict(lat=20, lon=78), lonaxis_range=[68, 92], lataxis_range=[6, 36],
    )
    fig.update_layout(margin=dict(l=0, r=0, t=30, b=0), paper_bgcolor=BG, height=420,
                      title=dict(text="Crowd-Sourced Reports — India Focus", font=dict(size=14, color="#ccc")),
                      geo=dict(bgcolor=BG))
    return fig


# ─── Crowd Category Distribution ─────────────────────────────────────────────

def crowd_category_chart(categories: dict) -> go.Figure:
    cats = list(categories.keys())
    vals = list(categories.values())
    colors = [ACCENT, WARN, CRIT, INFO, RECOVER, "#ffa726", "#ab47bc"][:len(cats)]

    fig = go.Figure(go.Bar(x=cats, y=vals, marker_color=colors,
                           marker_line=dict(width=0.5, color="white")))
    fig.update_layout(**_base_layout(height=280),
                      xaxis_tickangle=-30, yaxis_title="Reports",
                      title=dict(text="Report Categories", font=dict(size=14, color="#ccc")))
    return fig


# ─── Crowd Network Value Chart ───────────────────────────────────────────────

def crowd_network_value_chart(n_contributors: int) -> go.Figure:
    ns = np.arange(1, max(n_contributors + 1, 50))
    vals = ns ** 1.5
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ns, y=vals, fill="tozeroy",
                              fillcolor="rgba(0,212,170,0.1)",
                              line=dict(color=ACCENT, width=2)))
    fig.add_trace(go.Scatter(x=[n_contributors], y=[n_contributors**1.5],
                              mode="markers+text", marker=dict(size=14, color=CRIT),
                              text=[f"Current: {n_contributors}"],
                              textposition="top center",
                              textfont=dict(size=11, color=CRIT)))
    fig.update_layout(**_base_layout(height=280),
                      xaxis_title="Contributors (n)", yaxis_title="Network Value (∝ n^1.5)",
                      title=dict(text="Network Effect Scaling", font=dict(size=14, color="#ccc")))
    return fig


# ─── Acoustic Spectrogram ────────────────────────────────────────────────────

def acoustic_spectrogram(readings: list) -> go.Figure:
    """Simulated mel-spectrogram for acoustic readings."""
    if not readings:
        return go.Figure().update_layout(title="No acoustic data", template=THEME, height=300)

    anomaly = [r for r in readings if r.get("anomaly_type", "none") != "none"]
    normal = [r for r in readings if r.get("anomaly_type", "none") == "none"]

    fig = go.Figure()
    if normal:
        fig.add_trace(go.Scatter(
            x=[r.get("dominant_freq_hz", 0) for r in normal],
            y=[r.get("rms_energy", 0) for r in normal],
            mode="markers", name="Normal",
            marker=dict(size=8, color=ACCENT, opacity=0.5),
            text=[f"Container: {r.get('container_id', 'N/A')[:10]}" for r in normal],
        ))
    if anomaly:
        fig.add_trace(go.Scatter(
            x=[r.get("dominant_freq_hz", 0) for r in anomaly],
            y=[r.get("rms_energy", 0) for r in anomaly],
            mode="markers", name="Anomaly",
            marker=dict(size=12, color=CRIT, symbol="x", opacity=0.8),
            text=[f"{r.get('anomaly_type', 'N/A')}<br>Score: {r.get('anomaly_score', 0):.2f}"
                  for r in anomaly],
        ))

    fig.update_layout(**_base_layout(height=350),
                      xaxis_title="Dominant Frequency (Hz)",
                      yaxis_title="RMS Energy",
                      title=dict(text="Acoustic Feature Space", font=dict(size=14, color="#ccc")),
                      legend=dict(orientation="h", y=1.02))
    return fig


# ─── Acoustic Anomaly Timeline ───────────────────────────────────────────────

def acoustic_timeline(readings: list) -> go.Figure:
    if not readings:
        return go.Figure().update_layout(title="No data", template=THEME, height=280)

    scores = [r.get("anomaly_score", 0) for r in readings[:100]]
    types = [r.get("anomaly_type", "none") for r in readings[:100]]
    cols = [CRIT if t != "none" else ACCENT for t in types]

    fig = go.Figure(go.Bar(y=scores, marker_color=cols,
                           marker_line=dict(width=0.3, color="#333")))
    fig.add_hline(y=0.5, line_dash="dash", line_color=WARN,
                  annotation_text="Anomaly threshold")
    fig.update_layout(**_base_layout(height=280),
                      xaxis_title="Reading #", yaxis_title="Anomaly Score",
                      title=dict(text="Anomaly Score Timeline", font=dict(size=14, color="#ccc")))
    return fig


# ─── Container Health Gauge ──────────────────────────────────────────────────

def container_health_gauge(score: float) -> go.Figure:
    fig = go.Figure(go.Indicator(
        mode="gauge+number", value=score * 100,
        domain=dict(x=[0, 1], y=[0, 1]),
        gauge=dict(axis=dict(range=[0, 100]),
                   bar=dict(color=CRIT if score > 0.6 else (WARN if score > 0.3 else ACCENT)),
                   steps=[dict(range=[0, 30], color="#1a2e1a"),
                          dict(range=[30, 60], color="#2a2e1a"),
                          dict(range=[60, 100], color="#2a1a1e")],
                   threshold=dict(line=dict(color="white", width=2), value=60)),
        number=dict(suffix="%", font=dict(size=24)),
    ))
    fig.update_layout(**_base_layout(height=220))
    return fig


# ─── Shipment Flow Sankey ─────────────────────────────────────────────────────

def shipment_sankey(shipments_df: pd.DataFrame) -> go.Figure:
    if shipments_df.empty:
        return go.Figure().update_layout(title="No shipment data", template=THEME, height=400)

    top_origins = shipments_df["origin_name"].value_counts().head(10).index.tolist()
    top_dests = shipments_df["dest_name"].value_counts().head(10).index.tolist()
    flow = shipments_df[shipments_df["origin_name"].isin(top_origins) &
                        shipments_df["dest_name"].isin(top_dests)]
    grouped = flow.groupby(["origin_name", "dest_name"]).size().reset_index(name="count")
    all_labels = list(dict.fromkeys(grouped["origin_name"].tolist() + grouped["dest_name"].tolist()))
    label_map = {l: i for i, l in enumerate(all_labels)}

    fig = go.Figure(go.Sankey(
        node=dict(pad=15, thickness=20, line=dict(color="white", width=0.5),
                  label=all_labels, color=ACCENT),
        link=dict(source=[label_map[r["origin_name"]] for _, r in grouped.iterrows()],
                  target=[label_map[r["dest_name"]] for _, r in grouped.iterrows()],
                  value=grouped["count"].tolist(),
                  color="rgba(0,212,170,0.3)"),
    ))
    fig.update_layout(**_base_layout(height=450),
                      title=dict(text="Shipment Flow Network", font=dict(size=14, color="#ccc")))
    return fig


# ─── KPI card helper ─────────────────────────────────────────────────────────

def kpi_html(label: str, value: str, delta: str = "", color: str = ACCENT,
             icon: str = "") -> str:
    arrow = ""
    if delta:
        dc = ACCENT if delta.startswith("+") else CRIT
        arrow = f'<div style="font-size:11px;color:{dc};margin-top:4px">{delta}</div>'
    return f"""
    <div style="background:{CARD};padding:18px 16px;border-radius:12px;
        border-left:4px solid {color};text-align:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);min-height:90px">
        <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;
            letter-spacing:0.5px">{icon} {label}</div>
        <div style="font-size:26px;font-weight:700;color:{color};line-height:1.2">{value}</div>
        {arrow}
    </div>"""


def alert_card(alert: dict) -> str:
    a = alert
    border = CRIT if a["type"] == "CRITICAL" else WARN
    icon = "🔴" if a["type"] == "CRITICAL" else "🟠"
    return f"""
    <div style="background:{CARD};padding:10px 14px;border-radius:8px;
        border-left:3px solid {border};margin-bottom:8px;
        box-shadow:0 1px 4px rgba(0,0,0,0.2)">
        <div style="font-size:13px;color:#fff">{icon} <b>{a['node']}</b></div>
        <div style="font-size:12px;color:#aaa;margin-top:2px">{a['msg']}</div>
        <div style="font-size:11px;color:{ACCENT};margin-top:4px">→ {a['action']}</div>
    </div>"""


def doc_card(doc: dict) -> str:
    status_icon = {"normal": "✅", "review": "🔍", "alert": "⚠️", "critical": "🔴"}
    border_color = {"normal": ACCENT, "review": "#ffa726", "alert": WARN, "critical": CRIT}
    bc = border_color.get(doc["status"], ACCENT)
    icon = status_icon.get(doc["status"], "📄")
    signals_html = ""
    if doc.get("signals"):
        valid = [s for s in doc["signals"] if s]
        if valid:
            signals_html = f"""<div style='font-size:11px;color:{WARN};margin-top:6px'>
                Signals: {'; '.join(valid[:3])}</div>"""
    return f"""
    <div style="background:{CARD};padding:14px;border-radius:8px;
        border-left:4px solid {bc};margin-bottom:10px;
        box-shadow:0 1px 4px rgba(0,0,0,0.2)">
        <div style="font-size:14px;color:#fff">
            {icon} <b>{doc['id']}</b> — {doc['type']}
            <span style="float:right;color:{bc};font-size:11px;font-weight:600;
                text-transform:uppercase">{doc['status']}</span>
        </div>
        <div style="font-size:12px;color:#aaa;margin-top:4px">
            {doc.get('supplier', 'N/A')} | {doc.get('route', 'N/A')}
        </div>
        <div style="font-size:12px;color:#aaa">
            ${doc['amount']:,} / ${doc['expected']:,} expected
            | Deviation: <span style="color:{bc};font-weight:600">{doc['deviation']:+.1%}</span>
            | {doc.get('terms', '')} | {doc.get('date', '')}
        </div>
        {signals_html}
    </div>"""
