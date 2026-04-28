"""
NEXUS — Realistic Data Generator
Generates CSV datasets for the hackathon prototype.
"""

import csv
import random
import os
from datetime import datetime, timedelta

random.seed(42)

PORTS = [
    ("IN-JNPT", "Nhava Sheva (JNPT)", 18.95, 72.95, 5000),
    ("IN-MUN",  "Mundra Port", 22.77, 69.71, 4500),
    ("IN-CHN",  "Chennai Port", 13.10, 80.30, 3500),
    ("IN-KOL",  "Kolkata Port", 22.55, 88.33, 2500),
    ("IN-HAZ",  "Hazira Port", 21.10, 72.63, 2000),
    ("IN-VIZ",  "Visakhapatnam Port", 17.69, 83.29, 2200),
    ("IN-KOC",  "Kochi Port", 9.93, 76.27, 1800),
    ("IN-TUT",  "Tuticorin Port", 8.76, 78.18, 1500),
    ("IN-PAR",  "Paradip Port", 20.26, 86.67, 2500),
    ("IN-KND",  "Kandla Port", 23.03, 70.22, 3200),
    ("SG-SIN",  "Singapore", 1.26, 103.82, 8000),
    ("CN-SHA",  "Shanghai", 31.23, 121.47, 12000),
    ("CN-SZX",  "Shenzhen", 22.54, 114.06, 10000),
    ("CN-NGB",  "Ningbo", 29.87, 121.55, 9500),
    ("AE-DXB",  "Dubai (Jebel Ali)", 25.01, 55.08, 6000),
    ("LK-CMB",  "Colombo", 6.95, 79.85, 3500),
    ("NL-RTM",  "Rotterdam", 51.92, 4.48, 9000),
    ("US-LAX",  "Los Angeles", 33.73, -118.26, 10000),
    ("US-NYC",  "New York/New Jersey", 40.69, -74.17, 8500),
    ("ZA-DUR",  "Durban", -29.87, 31.03, 3000),
    ("MY-PTG",  "Port Klang", 3.00, 101.39, 5500),
    ("TH-LCH",  "Laem Chabang", 13.08, 100.88, 4000),
    ("DE-HAM",  "Hamburg", 53.55, 9.99, 8800),
    ("JP-YOK",  "Yokohama", 35.44, 139.64, 7500),
    ("KR-BUS",  "Busan", 35.10, 129.04, 7000),
]

WAREHOUSES = [
    ("IN-DEL", "Delhi ICD (Tughlakabad)", 28.61, 77.21, 3000, "warehouse"),
    ("IN-BLR", "Bangalore Hub (Whitefield)", 12.97, 77.59, 2000, "warehouse"),
    ("IN-MUM", "Mumbai Warehouse (Bhiwandi)", 19.08, 72.88, 2500, "warehouse"),
    ("IN-HYD", "Hyderabad DC", 17.39, 78.49, 1800, "warehouse"),
    ("IN-PUN", "Pune DC (Chakan)", 18.52, 73.86, 1500, "warehouse"),
    ("IN-AMD", "Ahmedabad DC", 23.02, 72.57, 1200, "warehouse"),
    ("IN-COK", "Kochi Warehouse", 9.93, 76.27, 800, "warehouse"),
    ("IN-GAU", "Guwahati Warehouse", 26.14, 91.74, 600, "warehouse"),
]

COMMODITIES = [
    ("Electronics", "HS-85", 15000, 80000),
    ("Textiles & Garments", "HS-62", 5000, 25000),
    ("Pharmaceuticals", "HS-30", 20000, 120000),
    ("Automobile Parts", "HS-87", 8000, 45000),
    ("Chemical Products", "HS-38", 3000, 18000),
    ("Steel & Iron", "HS-72", 12000, 55000),
    ("Agricultural Products", "HS-10", 2000, 12000),
    ("Petroleum Products", "HS-27", 10000, 65000),
    ("Machinery", "HS-84", 25000, 150000),
    ("Food Products", "HS-21", 4000, 20000),
    ("Plastics", "HS-39", 3500, 22000),
    ("Medical Devices", "HS-90", 18000, 95000),
]

CARRIERS = [
    "Maersk Line", "MSC", "CMA CGM", "COSCO Shipping",
    "Hapag-Lloyd", "ONE (Ocean Network Express)", "Evergreen Marine",
    "Yang Ming", "ZIM Integrated Shipping", "PIL (Pacific Int. Line)",
]

CURRENCIES = ["USD", "INR", "EUR", "SGD"]
TERMS = ["Net 15", "Net 30", "Net 45", "Net 60", "LC at Sight", "LC 60 Days", "Advance Payment"]

INDIAN_STATES = [
    "Maharashtra", "Tamil Nadu", "Karnataka", "Gujarat", "Delhi",
    "West Bengal", "Andhra Pradesh", "Telangana", "Kerala", "Rajasthan",
    "Uttar Pradesh", "Madhya Pradesh", "Punjab", "Haryana", "Odisha",
]

DISRUPTION_TYPES = [
    ("port_congestion", "Port congestion — vessel queuing exceeds 48h", 0.70),
    ("customs_delay", "Customs clearance delay — documentation backlog", 0.55),
    ("weather_cyclone", "Cyclone warning — vessel rerouting required", 0.85),
    ("labor_strike", "Labor union strike — port operations halted", 0.75),
    ("equipment_failure", "Crane/equipment failure — berth throughput reduced", 0.50),
    ("geopolitical_tension", "Geopolitical tension — route advisory issued", 0.80),
    ("fuel_price_spike", "Fuel price spike — bunker surcharge increased", 0.40),
    ("container_shortage", "Container shortage — 40ft HC unavailable", 0.60),
    ("rail_disruption", "Rail network disruption — ICD connectivity lost", 0.55),
    ("warehouse_fire", "Warehouse fire — cargo damaged/destroyed", 0.90),
    ("cyber_attack", "Cyber attack on port community system", 0.70),
    ("pandemic_restriction", "Pandemic-related port restriction", 0.65),
]

LANGUAGES = ["Hindi", "Tamil", "Bengali", "Marathi", "Telugu", "Kannada", "Gujarati", "English"]
VOICE_CATEGORIES = ["congestion", "weather", "accident", "customs_delay", "strike", "equipment_failure", "road_block"]

OUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUT_DIR, exist_ok=True)


def gen_shipments(n=12000):
    """Generate realistic shipment records."""
    start = datetime(2025, 1, 1)
    rows = []
    for i in range(1, n + 1):
        origin = random.choice(PORTS + WAREHOUSES)
        dest = random.choice(PORTS + WAREHOUSES)
        while dest[0] == origin[0]:
            dest = random.choice(PORTS + WAREHOUSES)
        commodity = random.choice(COMMODITIES)
        booking_date = start + timedelta(days=random.randint(0, 480))
        transit_days = random.randint(3, 45)
        eta = booking_date + timedelta(days=transit_days)
        actual_days = transit_days + random.choices(
            [0, 1, 2, 3, 5, 8, 12, 18],
            weights=[35, 25, 15, 10, 7, 4, 3, 1])[0]
        actual_arrival = booking_date + timedelta(days=actual_days)
        delay_days = actual_days - transit_days
        carrier = random.choice(CARRIERS)
        teu = random.choices([1, 2, 3, 4, 5, 8, 10, 15, 20],
                             weights=[20, 25, 18, 12, 8, 7, 5, 3, 2])[0]
        cost_per_teu = random.randint(800, 4500)
        total_cost = teu * cost_per_teu
        status = random.choices(
            ["delivered", "delivered", "delivered", "in_transit", "delayed", "delayed", "disrupted"],
            weights=[40, 20, 10, 10, 8, 7, 5])[0]
        risk_score = round(random.betavariate(2, 5), 3)
        disruption_flag = 1 if delay_days > 7 else 0
        rows.append([
            f"SHP-{i:06d}", booking_date.strftime("%Y-%m-%d"),
            eta.strftime("%Y-%m-%d"), actual_arrival.strftime("%Y-%m-%d"),
            transit_days, actual_days, delay_days,
            origin[0], origin[1], dest[0], dest[1],
            commodity[0], commodity[1], teu, total_cost,
            carrier, status, risk_score, disruption_flag,
            random.choice(["sea", "rail", "road", "multimodal"]),
            round(random.uniform(0.5, 5.0), 1),
        ])
    with open(os.path.join(OUT_DIR, "historical_shipments.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["shipment_id", "booking_date", "eta", "actual_arrival",
                     "transit_days_planned", "transit_days_actual", "delay_days",
                     "origin_id", "origin_name", "dest_id", "dest_name",
                     "commodity", "hs_code", "teu", "total_cost_usd",
                     "carrier", "status", "risk_score", "disruption_flag",
                     "transport_mode", "distance_kkm"])
        w.writerows(rows)
    print(f"  historical_shipments.csv: {n} rows")


def gen_disruptions(n=350):
    """Generate historical disruption events."""
    start = datetime(2023, 1, 1)
    rows = []
    for i in range(1, n + 1):
        dtype, desc, base_sev = random.choice(DISRUPTION_TYPES)
        date = start + timedelta(days=random.randint(0, 850))
        port = random.choice(PORTS)
        severity = round(min(1.0, base_sev + random.gauss(0, 0.1)), 3)
        duration_hours = random.choices(
            [4, 8, 12, 24, 48, 72, 120, 168, 336],
            weights=[5, 10, 15, 20, 18, 12, 8, 7, 5])[0]
        affected_shipments = random.randint(15, 500)
        economic_loss = round(affected_shipments * random.uniform(2000, 15000), 0)
        cascade_nodes = random.randint(1, 8) if severity > 0.6 else random.randint(0, 3)
        r_number = round(random.uniform(0.5, 3.5), 2) if severity > 0.5 else round(random.uniform(0.3, 1.2), 2)
        recovery_hours = int(duration_hours * random.uniform(1.2, 2.5))
        antibody_match = random.choice(["AB-0001", "AB-0002", "AB-0003", "AB-0004", "AB-0005", "NEW"])
        detection_method = random.choices(
            ["sensor_network", "immune_memory", "document_intel", "crowdsource", "manual"],
            weights=[30, 25, 20, 15, 10])[0]
        rows.append([
            f"DIS-{i:04d}", date.strftime("%Y-%m-%d %H:%M"),
            port[0], port[1], dtype, desc,
            severity, duration_hours, affected_shipments,
            int(economic_loss), cascade_nodes, r_number,
            recovery_hours, antibody_match, detection_method,
            random.choice(["resolved", "resolved", "resolved", "ongoing", "monitoring"]),
        ])
    with open(os.path.join(OUT_DIR, "disruption_events.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["event_id", "timestamp", "port_id", "port_name", "disruption_type",
                     "description", "severity", "duration_hours", "affected_shipments",
                     "economic_loss_usd", "cascade_nodes", "r_number",
                     "recovery_hours", "antibody_match", "detection_method", "status"])
        w.writerows(rows)
    print(f"  disruption_events.csv: {n} rows")


def gen_financial_docs(n=500):
    """Generate financial document records."""
    suppliers = [
        ("Shanghai Electronics Co. Ltd.", "CN-SHA", "CN"),
        ("Shenzhen Micro-Tech Industries", "CN-SZX", "CN"),
        ("Dubai Petrochemicals LLC", "AE-DXB", "AE"),
        ("Rotterdam Chemicals BV", "NL-RTM", "NL"),
        ("Colombo Textiles Ltd.", "LK-CMB", "LK"),
        ("Durban Mining Corp.", "ZA-DUR", "ZA"),
        ("Singapore Tech Pte. Ltd.", "SG-SIN", "SG"),
        ("Mumbai Pharma Exports Pvt. Ltd.", "IN-JNPT", "IN"),
        ("Chennai Auto Components Ltd.", "IN-CHN", "IN"),
        ("Bangalore Biotech Solutions", "IN-BLR", "IN"),
        ("Tata Steel Processing", "IN-MUM", "IN"),
        ("Gujarat Chemical Industries", "IN-MUN", "IN"),
        ("Ningbo Machinery Works", "CN-NGB", "CN"),
        ("Hamburg Industrial Supply GmbH", "DE-HAM", "DE"),
        ("Yokohama Precision Instruments", "JP-YOK", "JP"),
        ("Port Klang Palm Oil Exports", "MY-PTG", "MY"),
        ("Busan Steel Trading Co.", "KR-BUS", "KR"),
        ("Laem Chabang Seafood Processing", "TH-LCH", "TH"),
    ]
    doc_types = ["Invoice", "Bill of Lading", "Customs Declaration", "Purchase Order",
                 "Letter of Credit", "Packing List", "Insurance Certificate"]
    start = datetime(2025, 6, 1)
    rows = []
    for i in range(1, n + 1):
        supplier = random.choice(suppliers)
        doc_type = random.choice(doc_types)
        date = start + timedelta(days=random.randint(0, 300))
        commodity = random.choice(COMMODITIES)
        base_amount = random.randint(5000, 800000)
        deviation_pct = random.gauss(0, 0.08)
        if random.random() < 0.12:
            deviation_pct = random.uniform(0.15, 0.35)
        if random.random() < 0.08:
            deviation_pct = random.uniform(-0.35, -0.15)
        expected = base_amount
        actual = round(base_amount * (1 + deviation_pct))
        abs_dev = abs(deviation_pct)
        if abs_dev > 0.20:
            status = "critical"
            signals = random.sample(["Critical cost overrun >20%", "Expedited shipping requested",
                                      "Material substitution flagged", "Compliance review needed",
                                      "New intermediary entity detected", "Payment terms changed",
                                      "Insurance premium spike", "Sanctions list match"],
                                     k=random.randint(2, 5))
        elif abs_dev > 0.10:
            status = "alert"
            signals = random.sample(["Cost overrun >10%", "Route surcharge detected",
                                      "Minor tariff reclassification", "Carrier change mid-route",
                                      "Insurance premium adjustment", "Quantity discrepancy"],
                                     k=random.randint(1, 3))
        elif abs_dev > 0.05:
            status = "review"
            signals = random.sample(["Minor deviation from baseline", "Seasonal adjustment"],
                                     k=random.randint(0, 1))
        else:
            status = "normal"
            signals = []

        dest_port = random.choice(PORTS[:10])
        route = f"{supplier[1]} → {dest_port[0]}"
        anomaly_score = round(min(1.0, abs_dev * random.uniform(3, 6)), 3)
        rows.append([
            f"{doc_type[:2].upper()}-{date.year}-{i:05d}", doc_type,
            supplier[0], supplier[1], supplier[2],
            route, actual, expected,
            round(deviation_pct, 4), random.choice(TERMS),
            date.strftime("%Y-%m-%d"), "|".join(signals),
            status, anomaly_score,
            commodity[0], random.choice(CURRENCIES),
        ])
    with open(os.path.join(OUT_DIR, "financial_documents.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["doc_id", "doc_type", "supplier", "port_id", "country",
                     "route", "amount", "expected_amount", "deviation",
                     "payment_terms", "date", "signals", "status",
                     "anomaly_score", "commodity", "currency"])
        w.writerows(rows)
    print(f"  financial_documents.csv: {n} rows")


def gen_sensor_readings(n=20000):
    """Generate sensor telemetry data."""
    start = datetime(2026, 4, 1)
    rows = []
    for i in range(1, n + 1):
        node = random.choice(PORTS + WAREHOUSES)
        ts = start + timedelta(minutes=random.randint(0, 14400))
        temp = round(random.gauss(28, 6), 1)
        humidity = round(random.gauss(65, 15), 1)
        congestion = round(max(0, min(1, random.betavariate(2, 5))), 3)
        throughput = round(random.uniform(0.3, 0.98), 3)
        vibration = round(random.gauss(0.5, 0.2), 3)
        wind_speed = round(max(0, random.gauss(15, 8)), 1)
        visibility = round(max(0.5, random.gauss(8, 3)), 1)
        alert_level = random.choices([0, 1, 2, 3], weights=[70, 15, 10, 5])[0]
        rows.append([
            f"SENS-{i:07d}", ts.strftime("%Y-%m-%d %H:%M:%S"),
            node[0], node[1], temp, humidity, congestion,
            throughput, vibration, wind_speed, visibility, alert_level,
        ])
    with open(os.path.join(OUT_DIR, "sensor_readings.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["reading_id", "timestamp", "node_id", "node_name",
                     "temperature_c", "humidity_pct", "congestion_index",
                     "throughput_ratio", "vibration_level", "wind_speed_kmh",
                     "visibility_km", "alert_level"])
        w.writerows(rows)
    print(f"  sensor_readings.csv: {n} rows")


def gen_voice_notes(n=250):
    """Generate crowdsourced voice note records."""
    start = datetime(2026, 3, 1)
    locations = [
        ("Nhava Sheva Port Gate 4", "IN-JNPT", 18.95, 72.95),
        ("Mundra Port Container Yard", "IN-MUN", 22.77, 69.71),
        ("Chennai Harbor Road", "IN-CHN", 13.10, 80.30),
        ("Delhi ICD Tughlakabad", "IN-DEL", 28.61, 77.21),
        ("Mumbai-Pune Expressway", "IN-MUM", 18.75, 73.25),
        ("Bangalore Whitefield Industrial", "IN-BLR", 12.97, 77.59),
        ("Kolkata Dock Complex", "IN-KOL", 22.55, 88.33),
        ("Ahmedabad-Kandla Highway", "IN-AMD", 23.02, 72.57),
        ("Kochi Port Approach Road", "IN-KOC", 9.93, 76.27),
        ("Vizag Outer Harbor", "IN-VIZ", 17.69, 83.29),
        ("Hyderabad ORR Junction", "IN-HYD", 17.39, 78.49),
        ("Pune Chakan MIDC", "IN-PUN", 18.52, 73.86),
    ]
    rows = []
    for i in range(1, n + 1):
        loc = random.choice(locations)
        ts = start + timedelta(minutes=random.randint(0, 43200))
        lang = random.choice(LANGUAGES)
        cat = random.choice(VOICE_CATEGORIES)
        duration_sec = random.randint(5, 30)
        credibility = round(min(1.0, max(0.1, random.gauss(0.7, 0.2))), 3)
        verified = random.random() < 0.35
        contributor_id = f"CROWD-{random.randint(1, 150):04d}"
        severity = round(random.betavariate(3, 4), 3)
        rows.append([
            f"VN-{i:05d}", ts.strftime("%Y-%m-%d %H:%M:%S"),
            loc[0], loc[1], loc[2], loc[3],
            lang, cat, duration_sec,
            contributor_id, credibility, verified, severity,
            random.randint(1, 25),
        ])
    with open(os.path.join(OUT_DIR, "voice_notes.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["note_id", "timestamp", "location_name", "node_id",
                     "lat", "lon", "language", "category", "duration_sec",
                     "contributor_id", "credibility_score", "verified",
                     "severity", "nearby_reports"])
    with open(os.path.join(OUT_DIR, "voice_notes.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["note_id", "timestamp", "location_name", "node_id",
                     "lat", "lon", "language", "category", "duration_sec",
                     "contributor_id", "credibility_score", "verified",
                     "severity", "nearby_reports"])
        w.writerows(rows)
    print(f"  voice_notes.csv: {n} rows")


def gen_acoustic_data(n=800):
    """Generate container acoustic anomaly detection data."""
    start = datetime(2026, 1, 1)
    containers = [f"MSCU-{random.randint(1000000, 9999999)}" for _ in range(80)]
    rows = []
    for i in range(1, n + 1):
        container = random.choice(containers)
        ts = start + timedelta(hours=random.randint(0, 2880))
        is_anomaly = random.random() < 0.12
        if is_anomaly:
            anomaly_type = random.choice([
                "refrigeration_failure", "structural_stress", "tamper_detected",
                "seal_broken", "cargo_shift", "water_ingress",
            ])
            anomaly_score = round(random.uniform(0.65, 0.99), 3)
            freq_peak = round(random.uniform(200, 4000), 1)
            rms_energy = round(random.uniform(0.6, 1.0), 3)
            zcr = round(random.uniform(50, 200), 1)
            mel_50 = round(random.uniform(-40, -10), 1)
            mel_100 = round(random.uniform(-35, -5), 1)
        else:
            anomaly_type = "none"
            anomaly_score = round(random.uniform(0.0, 0.35), 3)
            freq_peak = round(random.uniform(50, 300), 1)
            rms_energy = round(random.uniform(0.05, 0.3), 3)
            zcr = round(random.uniform(5, 30), 1)
            mel_50 = round(random.uniform(-70, -40), 1)
            mel_100 = round(random.uniform(-65, -35), 1)
        rows.append([
            f"ACU-{i:06d}", ts.strftime("%Y-%m-%d %H:%M:%S"),
            container, anomaly_type, anomaly_score,
            freq_peak, rms_energy, zcr, mel_50, mel_100,
            random.choice(PORTS + WAREHOUSES)[0],
            round(random.uniform(2.0, 8.0), 1),
            random.choice(["normal", "normal", "normal", "warning", "critical"]),
        ])
    with open(os.path.join(OUT_DIR, "acoustic_anomalies.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["reading_id", "timestamp", "container_id", "anomaly_type",
                     "anomaly_score", "dominant_freq_hz", "rms_energy",
                     "zero_crossing_rate", "mel_band_50_db", "mel_band_100_db",
                     "node_id", "temperature_c", "alert_status"])
        w.writerows(rows)
    print(f"  acoustic_anomalies.csv: {n} rows")


def gen_contributors(n=150):
    """Generate crowd contributor profiles."""
    rows = []
    for i in range(1, n + 1):
        join_date = datetime(2025, random.randint(1, 12), random.randint(1, 28))
        total_reports = random.randint(1, 200)
        verified_reports = int(total_reports * random.uniform(0.3, 0.9))
        state = random.choice(INDIAN_STATES)
        lang = random.choice(LANGUAGES)
        credibility = round(min(1.0, 0.3 + verified_reports / total_reports * 0.5 + random.uniform(0, 0.2)), 3)
        rows.append([
            f"CROWD-{i:04d}", join_date.strftime("%Y-%m-%d"),
            total_reports, verified_reports, state, lang,
            credibility, random.choice(["truck_driver", "warehouse_worker", "port_agent", "clearing_agent"]),
            random.randint(0, 50),
        ])
    with open(os.path.join(OUT_DIR, "crowd_contributors.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["contributor_id", "join_date", "total_reports",
                     "verified_reports", "state", "primary_language",
                     "credibility_score", "role", "impact_score"])
        w.writerows(rows)
    print(f"  crowd_contributors.csv: {n} rows")


if __name__ == "__main__":
    print("NEXUS — Generating realistic datasets...")
    gen_shipments(12000)
    gen_disruptions(350)
    gen_financial_docs(500)
    gen_sensor_readings(20000)
    gen_voice_notes(250)
    gen_contributors(150)
    print("\nAll datasets generated in nexus/data/")
