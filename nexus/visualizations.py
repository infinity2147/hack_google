"""
NEXUS — Plotly Visualizations
Clean light professional theme with proper contrast
"""

import plotly.graph_objects as go
import plotly.express as px
import numpy as np
import pandas as pd
from typing import List, Dict


# ─── Palette ──────────────────────────────────────────────────────────────────
ACCENT  = "#0d9488"   # teal — primary
WARN    = "#ea580c"   # orange
CRIT    = "#dc2626"   # red
RECOVER = "#7c3aed"   # purple
INFO    = "#2563eb"   # blue
BG      = "#ffffff"
CARD    = "#f1f5f9"   # slate-100 — card/panel backgrounds
GRID    = "#e2e8f0"   # slate-200
BORDER  = "#cbd5e1"   # slate-300
TXT     = "#0f172a"   # slate-900 — primary text
TXT2    = "#334155"   # slate-700 — secondary text
TXT3    = "#64748b"   # slate-500 — muted text
WHITE   = "#ffffff"

STATUS_COLOR = dict(normal=ACCENT, stressed="#d97706", disrupted=CRIT, recovered=RECOVER)


def _layout(**kw):
    base = dict(
        margin=dict(l=48, r=24, t=44, b=36),
        paper_bgcolor=BG, plot_bgcolor=BG,
        font=dict(color=TXT, size=12, family="Inter, -apple-system, sans-serif"),
        xaxis=dict(gridcolor=GRID, linecolor=BORDER, tickfont=dict(color=TXT3)),
        yaxis=dict(gridcolor=GRID, linecolor=BORDER, tickfont=dict(color=TXT3)),
    )
    base.update(kw)
    return base


def _title(text):
    return dict(text=text, font=dict(size=15, color=TXT, family="Inter, sans-serif"))


# ─── Network Map ──────────────────────────────────────────────────────────────

def network_map(network) -> go.Figure:
    fig = go.Figure()

    for e in network.edges:
        src, dst = network.nodes.get(e.src), network.nodes.get(e.dst)
        if not src or not dst:
            continue
        color = CRIT if e.risk > 0.20 else (WARN if e.risk > 0.15 else "rgba(13,148,136,0.22)")
        width = 2.5 if e.risk > 0.20 else (1.8 if e.risk > 0.15 else 1.0)
        fig.add_trace(go.Scattergeo(
            lon=[src.lon, dst.lon], lat=[src.lat, dst.lat],
            mode="lines", line=dict(width=width, color=color),
            opacity=0.55, hoverinfo="skip", showlegend=False,
        ))

    lats, lons, texts, colors, sizes = [], [], [], [], []
    for nd in network.nodes.values():
        lats.append(nd.lat); lons.append(nd.lon)
        colors.append(STATUS_COLOR.get(nd.status, ACCENT))
        sizes.append(14 if nd.kind == "port" else 8)
        texts.append(f"<b>{nd.name}</b><br>Status: {nd.status}<br>"
                     f"Congestion: {nd.congestion:.0%}<br>"
                     f"Load: {nd.load:,}/{nd.capacity:,}")

    fig.add_trace(go.Scattergeo(
        lon=lons, lat=lats, mode="markers+text",
        marker=dict(size=sizes, color=colors, line=dict(width=1, color=WHITE), opacity=0.9),
        text=[n.name for n in network.nodes.values()],
        textposition="top center", textfont=dict(size=7, color=TXT2),
        hovertext=texts, hoverinfo="text", showlegend=False,
    ))

    fig.update_geos(
        projection_type="natural earth",
        showland=True, landcolor="#dde4ed",
        showocean=True, oceancolor="#c9daf0",
        showcountries=True, countrycolor="#a0aec0",
        showlakes=False, coastlinecolor="#a0aec0",
        center=dict(lat=15, lon=75),
        lonaxis_range=[-120, 140], lataxis_range=[-40, 55],
    )
    fig.update_layout(margin=dict(l=0, r=0, t=0, b=0), paper_bgcolor=BG, height=520,
                      geo=dict(bgcolor="#dce8f5"))
    return fig


def animated_network_map(network, history: list) -> go.Figure:
    fig = go.Figure()
    lats, lons, names = [], [], []
    for nd in network.nodes.values():
        lats.append(nd.lat); lons.append(nd.lon); names.append(nd.name)

    if history:
        last = history[-1]
        colors, sizes = [], []
        for i, nd in enumerate(network.nodes.values()):
            inf = last["I"][i]
            if inf > 0.5:
                colors.append(CRIT); sizes.append(20 + inf * 12)
            elif inf > 0.2:
                colors.append(WARN); sizes.append(14 + inf * 8)
            else:
                colors.append(ACCENT); sizes.append(8)
    else:
        colors = [ACCENT] * len(lats)
        sizes = [8] * len(lats)

    for e in network.edges:
        src, dst = network.nodes.get(e.src), network.nodes.get(e.dst)
        if src and dst:
            fig.add_trace(go.Scattergeo(
                lon=[src.lon, dst.lon], lat=[src.lat, dst.lat],
                mode="lines", line=dict(width=1, color="rgba(13,148,136,0.15)"),
                hoverinfo="skip", showlegend=False,
            ))

    fig.add_trace(go.Scattergeo(
        lon=lons, lat=lats, mode="markers",
        marker=dict(size=sizes, color=colors, line=dict(width=1, color=WHITE), opacity=0.9),
        text=names, textposition="top center", textfont=dict(size=7, color=TXT2),
        hovertext=[f"<b>{n}</b>" for n in names], hoverinfo="text", showlegend=False,
    ))

    fig.update_geos(
        projection_type="natural earth",
        showland=True, landcolor="#dde4ed",
        showocean=True, oceancolor="#c9daf0",
        showcountries=True, countrycolor="#a0aec0", coastlinecolor="#a0aec0",
        center=dict(lat=15, lon=75),
        lonaxis_range=[-120, 140], lataxis_range=[-40, 55],
    )
    fig.update_layout(margin=dict(l=0, r=0, t=0, b=0), paper_bgcolor=BG, height=520,
                      geo=dict(bgcolor="#dce8f5"))
    return fig


# ─── SIR Curves ───────────────────────────────────────────────────────────────

def sir_curves(history: List[dict]) -> go.Figure:
    if not history:
        fig = go.Figure()
        fig.update_layout(**_layout(height=350),
                          title=_title("Run the simulation to see curves"))
        return fig

    ts = [h["t"] for h in history]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ts, y=[h["S"].sum() for h in history],
                             name="Susceptible", fill="tozeroy",
                             fillcolor="rgba(13,148,136,0.07)",
                             line=dict(color=ACCENT, width=2.5)))
    fig.add_trace(go.Scatter(x=ts, y=[h["I"].sum() for h in history],
                             name="Infected", fill="tozeroy",
                             fillcolor="rgba(220,38,38,0.06)",
                             line=dict(color=CRIT, width=2.5)))
    fig.add_trace(go.Scatter(x=ts, y=[h["R"].sum() for h in history],
                             name="Recovered", fill="tozeroy",
                             fillcolor="rgba(124,58,237,0.06)",
                             line=dict(color=RECOVER, width=2.5)))
    fig.update_layout(**_layout(height=380), xaxis_title="Time Step", yaxis_title="Nodes",
                      legend=dict(orientation="h", y=1.06, x=1, xanchor="right",
                                  font=dict(size=11, color=TXT2)))
    return fig


def node_disruption_bars(network) -> go.Figure:
    names = [n.name for n in network.nodes.values()]
    vals = [n.congestion for n in network.nodes.values()]
    cols = [STATUS_COLOR.get(n.status, ACCENT) for n in network.nodes.values()]
    fig = go.Figure(go.Bar(x=names, y=vals, marker_color=cols,
                           marker_line=dict(color=WHITE, width=0.5)))
    fig.update_layout(**_layout(height=300), xaxis_tickangle=-45,
                      yaxis_title="Disruption Level", yaxis_range=[0, 1])
    return fig


# ─── Agent Charts ─────────────────────────────────────────────────────────────

def agent_chart(bids: List[dict]) -> go.Figure:
    carriers = [b["carrier"] for b in bids]
    fig = go.Figure()
    fig.add_trace(go.Bar(name="Bid ($)", x=carriers,
                         y=[b["bid"] for b in bids], marker_color=WARN,
                         marker_line=dict(width=0.5, color=WHITE)))
    fig.add_trace(go.Bar(name="Score ×10k", x=carriers,
                         y=[b["score"] * 10000 for b in bids], marker_color=ACCENT,
                         marker_line=dict(width=0.5, color=WHITE)))
    fig.update_layout(**_layout(height=350), barmode="group", yaxis_title="Value")
    return fig


def agent_radar(bids: List[dict]) -> go.Figure:
    cats = ["Cost Efficiency", "Speed", "Safety", "Overall Score"]
    fig = go.Figure()
    for b in bids:
        vals = [1 - b["bid"] / max(x["bid"] for x in bids),
                1 - b["hours"] / max(x["hours"] for x in bids),
                1 - b["risk"], b["score"]]
        fig.add_trace(go.Scatterpolar(r=vals, theta=cats, fill="toself",
                                       name=b["carrier"], opacity=0.35, line=dict(width=2)))
    fig.update_layout(**_layout(height=400),
                      polar=dict(radialaxis=dict(visible=True, range=[0, 1],
                                                  gridcolor=GRID, linecolor=GRID,
                                                  tickfont=dict(color=TXT3)),
                                  bgcolor="#f8fafc"),
                      legend=dict(font=dict(size=10, color=TXT2)))
    return fig


# ─── Document Charts ──────────────────────────────────────────────────────────

def doc_deviation_chart(docs: List[dict]) -> go.Figure:
    names = [d['id'][:12] for d in docs]
    devs = [d["deviation"] * 100 for d in docs]
    cols = [CRIT if abs(d["deviation"]) > 0.15 else (WARN if abs(d["deviation"]) > 0.08 else ACCENT)
            for d in docs]
    fig = go.Figure(go.Bar(x=names, y=devs, marker_color=cols,
                           marker_line=dict(color=WHITE, width=0.5)))
    fig.add_hline(y=15, line_dash="dash", line_color=CRIT,
                  annotation_text="Critical", annotation_font=dict(size=10, color=CRIT))
    fig.add_hline(y=-15, line_dash="dash", line_color=CRIT)
    fig.add_hline(y=8, line_dash="dot", line_color=WARN,
                  annotation_text="Warning", annotation_font=dict(size=10, color=WARN))
    fig.add_hline(y=-8, line_dash="dot", line_color=WARN)
    fig.update_layout(**_layout(height=320), xaxis_tickangle=-45, yaxis_title="Deviation (%)")
    return fig


def doc_anomaly_scatter(docs: List[dict]) -> go.Figure:
    amounts = [d["amount"] for d in docs]
    scores = [d.get("anomaly_score", abs(d["deviation"]) * 5) for d in docs]
    statuses = [d["status"] for d in docs]
    names = [d["id"][:12] for d in docs]
    cols = [CRIT if s == "critical" else (WARN if s == "alert" else (INFO if s == "review" else ACCENT))
            for s in statuses]
    fig = go.Figure(go.Scatter(x=amounts, y=scores, mode="markers+text",
                                marker=dict(size=12, color=cols, line=dict(width=1, color=WHITE)),
                                text=names, textposition="top center",
                                textfont=dict(size=8, color=TXT3),
                                hovertext=[f"{d['id']}<br>{d['supplier']}<br>${d['amount']:,}"
                                           for d in docs], hoverinfo="text"))
    fig.add_hline(y=0.5, line_dash="dash", line_color=WARN, annotation_text="Threshold")
    fig.update_layout(**_layout(height=350), xaxis_title="Amount (USD)", yaxis_title="Anomaly Score")
    return fig


# ─── R-number Chart ───────────────────────────────────────────────────────────

def r_number_chart(history: List[dict], beta: float, gamma: float) -> go.Figure:
    if not history:
        fig = go.Figure(); fig.update_layout(**_layout(height=250), title=_title("No data"))
        return fig
    ts = [h["t"] for h in history]
    Rs = [beta / gamma * np.mean(h["I"][h["I"] > 0.1]) if np.any(h["I"] > 0.1) else 0
          for h in history]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ts, y=Rs, line=dict(color=WARN, width=2.5),
                              fill="tozeroy", fillcolor="rgba(234,88,12,0.06)"))
    fig.add_hline(y=1.0, line_dash="dash", line_color=ACCENT, line_width=2,
                  annotation_text="R = 1", annotation_font=dict(size=10, color=TXT2))
    fig.update_layout(**_layout(height=250), xaxis_title="Time", yaxis_title="R effective")
    return fig


# ─── Gauges ───────────────────────────────────────────────────────────────────

def herd_immunity_gauge(pc: float, Reff: float) -> go.Figure:
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta", value=pc * 100,
        delta=dict(reference=50, suffix="%", font=dict(size=14, color=TXT3)),
        domain=dict(x=[0, 1], y=[0, 1]),
        title=dict(text=f"R₀ = {Reff:.2f}", font=dict(size=15, color=TXT2)),
        gauge=dict(axis=dict(range=[0, 100], tickwidth=1, tickcolor=TXT3,
                              tickfont=dict(color=TXT3)),
                   bar=dict(color=WARN if pc > 0.5 else ACCENT, thickness=0.65),
                   steps=[dict(range=[0, 30], color="#ecfdf5"),
                          dict(range=[30, 60], color="#fef9c3"),
                          dict(range=[60, 100], color="#fef2f2")],
                   threshold=dict(line=dict(color=TXT, width=3), value=pc * 100)),
        number=dict(suffix="%", font=dict(size=30, color=TXT)),
    ))
    fig.update_layout(**_layout(height=280, margin=dict(l=24, r=24, t=44, b=20)))
    return fig


def immune_gauge(similarity: float) -> go.Figure:
    fig = go.Figure(go.Indicator(
        mode="gauge+number", value=similarity * 100,
        domain=dict(x=[0, 1], y=[0, 1]),
        gauge=dict(axis=dict(range=[0, 100], tickcolor=TXT3, tickfont=dict(color=TXT3)),
                   bar=dict(color=CRIT if similarity > 0.82 else ACCENT),
                   steps=[dict(range=[0, 82], color="#ecfdf5"),
                          dict(range=[82, 100], color="#fef2f2")],
                   threshold=dict(line=dict(color=TXT, width=3), value=82)),
        number=dict(suffix="%", font=dict(size=28, color=TXT)),
    ))
    fig.update_layout(**_layout(height=280), margin=dict(l=24, r=24, t=30, b=20))
    return fig


def container_health_gauge(score: float) -> go.Figure:
    fig = go.Figure(go.Indicator(
        mode="gauge+number", value=score * 100,
        domain=dict(x=[0, 1], y=[0, 1]),
        gauge=dict(axis=dict(range=[0, 100], tickcolor=TXT3, tickfont=dict(color=TXT3)),
                   bar=dict(color=CRIT if score > 0.6 else (WARN if score > 0.3 else ACCENT)),
                   steps=[dict(range=[0, 30], color="#ecfdf5"),
                          dict(range=[30, 60], color="#fef9c3"),
                          dict(range=[60, 100], color="#fef2f2")],
                   threshold=dict(line=dict(color=TXT, width=2), value=60)),
        number=dict(suffix="%", font=dict(size=24, color=TXT)),
    ))
    fig.update_layout(**_layout(height=220))
    return fig


# ─── Crowd Charts ─────────────────────────────────────────────────────────────

def crowd_map(voice_notes: list) -> go.Figure:
    if not voice_notes:
        fig = go.Figure(); fig.update_layout(**_layout(height=400), title=_title("No data"))
        return fig
    lats = [v.get("lat", 0) for v in voice_notes]
    lons = [v.get("lon", 0) for v in voice_notes]
    sev = [v.get("severity", 0) for v in voice_notes]
    texts = [f"{v.get('location_name', 'N/A')}<br>{v.get('category','').replace('_',' ').title()}<br>"
             f"Severity: {v.get('severity',0):.0%}<br>Lang: {v.get('language','N/A')}"
             for v in voice_notes]
    colors = [ACCENT if v.get("verified") else TXT3 for v in voice_notes]

    fig = go.Figure(go.Scattergeo(
        lon=lons, lat=lats, mode="markers",
        marker=dict(size=[6 + s * 12 for s in sev], color=colors,
                    line=dict(width=1, color=WHITE), opacity=0.75),
        hovertext=texts, hoverinfo="text", showlegend=False,
    ))
    fig.update_geos(
        projection_type="natural earth",
        showland=True, landcolor="#dde4ed",
        showocean=True, oceancolor="#c9daf0",
        showcountries=True, countrycolor="#a0aec0", showlakes=False,
        center=dict(lat=20, lon=78), lonaxis_range=[68, 92], lataxis_range=[6, 36],
    )
    fig.update_layout(margin=dict(l=0, r=0, t=36, b=0), paper_bgcolor=BG, height=420,
                      title=_title("Crowd-Sourced Reports — India"), geo=dict(bgcolor="#dce8f5"))
    return fig


def crowd_category_chart(categories: dict) -> go.Figure:
    cats = list(categories.keys())
    vals = list(categories.values())
    palette = [ACCENT, WARN, CRIT, INFO, RECOVER, "#d97706", "#9333ea"]
    fig = go.Figure(go.Bar(x=cats, y=vals, marker_color=palette[:len(cats)],
                           marker_line=dict(width=0.5, color=WHITE)))
    fig.update_layout(**_layout(height=280), xaxis_tickangle=-30, yaxis_title="Reports",
                      title=_title("Report Categories"))
    return fig


def crowd_network_value_chart(n: int) -> go.Figure:
    ns = np.arange(1, max(n + 1, 50))
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ns, y=ns**1.5, fill="tozeroy",
                              fillcolor="rgba(13,148,136,0.06)",
                              line=dict(color=ACCENT, width=2)))
    fig.add_trace(go.Scatter(x=[n], y=[n**1.5], mode="markers+text",
                              marker=dict(size=14, color=CRIT),
                              text=[f"Current: {n}"], textposition="top center",
                              textfont=dict(size=11, color=CRIT)))
    fig.update_layout(**_layout(height=280),
                      xaxis_title="Contributors (n)", yaxis_title="Network Value (∝ n¹·⁵)",
                      title=_title("Network Effect Scaling"))
    return fig


# ─── Acoustic Charts ──────────────────────────────────────────────────────────

def acoustic_spectrogram(readings: list) -> go.Figure:
    if not readings:
        fig = go.Figure(); fig.update_layout(**_layout(height=300), title=_title("No data"))
        return fig
    anomaly = [r for r in readings if r.get("anomaly_type", "none") != "none"]
    normal  = [r for r in readings if r.get("anomaly_type", "none") == "none"]
    fig = go.Figure()
    if normal:
        fig.add_trace(go.Scatter(
            x=[r.get("dominant_freq_hz", 0) for r in normal],
            y=[r.get("rms_energy", 0) for r in normal],
            mode="markers", name="Normal",
            marker=dict(size=8, color=ACCENT, opacity=0.45),
            text=[f"Container: {r.get('container_id','')[:10]}" for r in normal]))
    if anomaly:
        fig.add_trace(go.Scatter(
            x=[r.get("dominant_freq_hz", 0) for r in anomaly],
            y=[r.get("rms_energy", 0) for r in anomaly],
            mode="markers", name="Anomaly",
            marker=dict(size=12, color=CRIT, symbol="x", opacity=0.8),
            text=[f"{r.get('anomaly_type','')}<br>Score: {r.get('anomaly_score',0):.2f}"
                  for r in anomaly]))
    fig.update_layout(**_layout(height=350), xaxis_title="Frequency (Hz)", yaxis_title="RMS Energy",
                      title=_title("Acoustic Feature Space"),
                      legend=dict(orientation="h", y=1.06, font=dict(size=11, color=TXT2)))
    return fig


def acoustic_timeline(readings: list) -> go.Figure:
    if not readings:
        fig = go.Figure(); fig.update_layout(**_layout(height=280), title=_title("No data"))
        return fig
    scores = [r.get("anomaly_score", 0) for r in readings[:100]]
    cols = [CRIT if r.get("anomaly_type", "none") != "none" else ACCENT for r in readings[:100]]
    fig = go.Figure(go.Bar(y=scores, marker_color=cols, marker_line=dict(width=0.3, color=GRID)))
    fig.add_hline(y=0.5, line_dash="dash", line_color=WARN, annotation_text="Threshold")
    fig.update_layout(**_layout(height=280), xaxis_title="Reading #", yaxis_title="Score",
                      title=_title("Anomaly Score Timeline"))
    return fig


# ─── Shipment Sankey ──────────────────────────────────────────────────────────

def shipment_sankey(shipments_df: pd.DataFrame) -> go.Figure:
    if shipments_df.empty:
        fig = go.Figure(); fig.update_layout(**_layout(height=400), title=_title("No data"))
        return fig
    top_o = shipments_df["origin_name"].value_counts().head(10).index.tolist()
    top_d = shipments_df["dest_name"].value_counts().head(10).index.tolist()
    flow = shipments_df[shipments_df["origin_name"].isin(top_o) & shipments_df["dest_name"].isin(top_d)]
    grp = flow.groupby(["origin_name", "dest_name"]).size().reset_index(name="count")
    labels = list(dict.fromkeys(grp["origin_name"].tolist() + grp["dest_name"].tolist()))
    lm = {l: i for i, l in enumerate(labels)}
    fig = go.Figure(go.Sankey(
        node=dict(pad=15, thickness=20, line=dict(color=BORDER, width=0.5), label=labels, color=ACCENT),
        link=dict(source=[lm[r["origin_name"]] for _, r in grp.iterrows()],
                  target=[lm[r["dest_name"]] for _, r in grp.iterrows()],
                  value=grp["count"].tolist(), color="rgba(13,148,136,0.2)")))
    fig.update_layout(**_layout(height=450), title=_title("Shipment Flow"))
    return fig


# ─── HTML Card Helpers ────────────────────────────────────────────────────────

def kpi_html(label: str, value: str, delta: str = "", color: str = ACCENT, icon: str = "") -> str:
    arrow = ""
    if delta:
        dc = ACCENT if delta.startswith("+") else CRIT
        arrow = f'<div style="font-size:11px;color:{dc};margin-top:4px">{delta}</div>'
    return f"""
    <div style="background:{CARD};padding:16px 14px;border-radius:10px;
        border-left:4px solid {color};text-align:center;
        box-shadow:0 1px 3px rgba(0,0,0,0.06);min-height:88px">
        <div style="font-size:10px;color:{TXT3};margin-bottom:4px;text-transform:uppercase;
            letter-spacing:.6px;font-weight:600">{icon} {label}</div>
        <div style="font-size:24px;font-weight:700;color:{color};line-height:1.2">{value}</div>
        {arrow}
    </div>"""


def alert_card(a: dict) -> str:
    border = CRIT if a["type"] == "CRITICAL" else WARN
    icon = "🔴" if a["type"] == "CRITICAL" else "🟠"
    return f"""
    <div style="background:{CARD};padding:10px 14px;border-radius:8px;
        border-left:3px solid {border};margin-bottom:8px">
        <div style="font-size:13px;color:{TXT};font-weight:600">{icon} {a['node']}</div>
        <div style="font-size:12px;color:{TXT3};margin-top:2px">{a['msg']}</div>
        <div style="font-size:11px;color:{ACCENT};margin-top:4px;font-weight:500">→ {a['action']}</div>
    </div>"""


def doc_card(d: dict) -> str:
    si = {"normal": "✅", "review": "🔍", "alert": "⚠️", "critical": "🔴"}
    bc = {"normal": ACCENT, "review": "#d97706", "alert": WARN, "critical": CRIT}
    c = bc.get(d["status"], ACCENT)
    i = si.get(d["status"], "📄")
    sig = ""
    if d.get("signals"):
        valid = [s for s in d["signals"] if s]
        if valid:
            sig = f"""<div style='font-size:11px;color:{WARN};margin-top:6px;font-weight:500'>
                Signals: {'; '.join(valid[:3])}</div>"""
    return f"""
    <div style="background:{CARD};padding:14px;border-radius:8px;
        border-left:4px solid {c};margin-bottom:10px">
        <div style="font-size:14px;color:{TXT};font-weight:600">
            {i} {d['id']} — {d['type']}
            <span style="float:right;color:{c};font-size:11px;font-weight:600;
                text-transform:uppercase">{d['status']}</span>
        </div>
        <div style="font-size:12px;color:{TXT3};margin-top:4px">{d.get('supplier','')} | {d.get('route','')}</div>
        <div style="font-size:12px;color:{TXT3}">
            ${d['amount']:,} / ${d['expected']:,} expected
            | Deviation: <span style="color:{c};font-weight:600">{d['deviation']:+.1%}</span>
            | {d.get('terms','')} | {d.get('date','')}
        </div>
        {sig}
    </div>"""


# ─── Risk & Scenario Charts ───────────────────────────────────────────────────

def risk_heat_bar(risks: list) -> go.Figure:
    risks = sorted(risks, key=lambda r: r["composite"], reverse=True)[:20]
    names = [r["node_id"] for r in risks]
    vals = [r["composite"] for r in risks]
    cols = [CRIT if v > 60 else (WARN if v > 30 else ACCENT) for v in vals]
    fig = go.Figure(go.Bar(x=vals, y=names, orientation="h", marker_color=cols,
                           marker_line=dict(color=WHITE, width=0.5)))
    layout = _layout(height=420)
    layout["xaxis_title"] = "Risk Score (0-100)"
    layout["yaxis"]["autorange"] = "reversed"
    fig.update_layout(**layout, title=_title("Node Risk Heatmap"))
    return fig


def risk_breakdown_chart(risk: dict) -> go.Figure:
    bd = risk.get("breakdown", {})
    labels = ["SIR", "Documents", "Crowd", "Immune"]
    values = [bd.get("sir", 0), bd.get("docs", 0), bd.get("crowd", 0), bd.get("immune", 0)]
    colors = [CRIT, WARN, INFO, RECOVER]
    fig = go.Figure(go.Pie(labels=labels, values=values, hole=0.55,
                           marker=dict(colors=colors, line=dict(color=WHITE, width=2)),
                           textfont=dict(size=12, color=TXT)))
    fig.update_layout(**_layout(height=320), title=_title(f"Risk Breakdown — {risk.get('node_id','')}"),
                      showlegend=True, legend=dict(font=dict(size=11, color=TXT2)))
    return fig


def scenario_comparison(result: dict) -> go.Figure:
    cats = ["Health Score", "Affected Nodes", "Cost ($K)"]
    before = [result.get("before_health", 0),
              0,
              0]
    after = [result.get("after_health", 0),
             len(result.get("affected_nodes", [])),
             result.get("cost_estimate", 0) / 1000]
    fig = go.Figure()
    fig.add_trace(go.Bar(name="Before", x=cats, y=before, marker_color=ACCENT,
                         marker_line=dict(width=0.5, color=WHITE)))
    fig.add_trace(go.Bar(name="After", x=cats, y=after, marker_color=CRIT,
                         marker_line=dict(width=0.5, color=WHITE)))
    fig.update_layout(**_layout(height=350), barmode="group",
                      title=_title(f"Scenario: {result.get('name','')}"),
                      yaxis_title="Value")
    return fig


def health_trend_chart(daily_df: pd.DataFrame) -> go.Figure:
    if daily_df.empty:
        fig = go.Figure()
        fig.update_layout(**_layout(height=350), title=_title("No data"))
        return fig
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=daily_df["date"], y=daily_df["health_score"],
                             name="Health Score", line=dict(color=ACCENT, width=2.5),
                             fill="tozeroy", fillcolor="rgba(13,148,136,0.06)"))
    fig.add_trace(go.Scatter(x=daily_df["date"], y=daily_df["event_count"],
                             name="Events", line=dict(color=WARN, width=2, dash="dot"),
                             yaxis="y2"))
    fig.update_layout(**_layout(height=380),
                      xaxis_title="Date", yaxis_title="Health Score",
                      yaxis2=dict(overlaying="y", side="right", title="Events",
                                  gridcolor=GRID, linecolor=BORDER, tickfont=dict(color=TXT3)),
                      legend=dict(orientation="h", y=1.06, font=dict(size=11, color=TXT2)),
                      title=_title("Network Health — 30 Day Trend"))
    return fig


def audit_entry_html(entry: dict) -> str:
    colors = dict(reroute=WARN, investigate=INFO, accept=ACCENT, reject=CRIT,
                  compliance=RECOVER, false_positive=TXT3, alternative="#d97706")
    c = colors.get(entry.get("action_type", ""), ACCENT)
    icons = dict(reroute="🔀", investigate="🔍", accept="✅", reject="❌",
                 compliance="📋", false_positive="⚠️", alternative="🔄")
    ic = icons.get(entry.get("action_type", ""), "📝")
    details_str = " | ".join(f"{k}: {v}" for k, v in (entry.get("details") or {}).items()) if entry.get("details") else ""
    return f"""
    <div style="background:{CARD};padding:12px;border-radius:8px;
        border-left:3px solid {c};margin-bottom:8px;border:1px solid {BORDER};
        border-left:3px solid {c}">
        <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:13px;color:{TXT};font-weight:600">
                {ic} {entry.get('action_type','').replace('_',' ').title()} — {entry.get('target','')}
            </div>
            <div style="font-size:10px;color:{TXT3}">{entry.get('timestamp','')}</div>
        </div>
        {f'<div style="font-size:11px;color:{TXT3};margin-top:4px">{details_str}</div>' if details_str else ''}
    </div>"""


def reroute_history_chart(entries: list) -> go.Figure:
    if not entries:
        fig = go.Figure()
        fig.update_layout(**_layout(height=300), title=_title("No reroute decisions yet"))
        return fig
    carriers = [e["details"].get("carrier", "Unknown")[:12] for e in entries[-15:]]
    predicted = [e["details"].get("predicted_savings", 0) for e in entries[-15:]]
    actual = [e["details"].get("actual_savings", 0) for e in entries[-15:]]
    fig = go.Figure()
    fig.add_trace(go.Bar(name="Predicted Savings", x=carriers, y=predicted,
                         marker_color=ACCENT, marker_line=dict(width=0.5, color=WHITE)))
    fig.add_trace(go.Bar(name="Actual Savings", x=carriers, y=actual,
                         marker_color=WARN, marker_line=dict(width=0.5, color=WHITE)))
    fig.update_layout(**_layout(height=320), barmode="group",
                      xaxis_title="Carrier", yaxis_title="Savings ($)",
                      title=_title("Reroute Outcomes"))
    return fig
