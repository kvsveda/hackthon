import streamlit as st
import time
import math
import random

# ──────────────────────────────────────────────
# Page Config
# ──────────────────────────────────────────────
st.set_page_config(
    page_title="TriageAI — Emergency Intelligence",
    page_icon="🚑",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ──────────────────────────────────────────────
# Custom CSS — Dark Clinical Aesthetic
# ──────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Syne', sans-serif;
    background-color: #0a0d14;
    color: #e2e8f0;
}

/* Background grid pattern */
.stApp {
    background-color: #0a0d14;
    background-image: 
        linear-gradient(rgba(0,255,180,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,180,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
}

h1, h2, h3 {
    font-family: 'Syne', sans-serif !important;
    font-weight: 800;
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background: #0f1420 !important;
    border-right: 1px solid #1e2d40;
}

section[data-testid="stSidebar"] * {
    color: #cbd5e1 !important;
}

/* Metric cards */
div[data-testid="metric-container"] {
    background: #111827;
    border: 1px solid #1e2d40;
    border-radius: 12px;
    padding: 16px;
}

/* Buttons */
.stButton > button {
    font-family: 'Space Mono', monospace !important;
    font-size: 13px !important;
    background: #00ffb4 !important;
    color: #0a0d14 !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 700 !important;
    transition: all 0.2s ease !important;
    letter-spacing: 0.05em;
}
.stButton > button:hover {
    background: #00e6a0 !important;
    box-shadow: 0 0 20px rgba(0,255,180,0.4) !important;
    transform: translateY(-1px) !important;
}

/* Alert / status boxes */
.patient-card {
    background: #111827;
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 14px;
    border-left: 5px solid #334155;
    transition: all 0.3s ease;
}
.patient-card.critical {
    border-left-color: #ef4444;
    background: linear-gradient(135deg, #1a0a0a, #111827);
    box-shadow: 0 0 30px rgba(239,68,68,0.15);
}
.patient-card.moderate {
    border-left-color: #f97316;
    background: linear-gradient(135deg, #1a1000, #111827);
}
.patient-card.low {
    border-left-color: #22c55e;
    background: linear-gradient(135deg, #0a1a0f, #111827);
}
.patient-card h3 {
    margin: 0 0 6px 0;
    font-size: 18px;
    font-weight: 800;
}
.patient-card .detail {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: #64748b;
    margin: 2px 0;
}
.patient-card .badge {
    display: inline-block;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    margin-right: 6px;
    margin-top: 8px;
}
.badge-critical { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid #ef4444; }
.badge-moderate { background: rgba(249,115,22,0.2); color: #f97316; border: 1px solid #f97316; }
.badge-low { background: rgba(34,197,94,0.2); color: #22c55e; border: 1px solid #22c55e; }
.badge-priority { background: rgba(0,255,180,0.15); color: #00ffb4; border: 1px solid #00ffb4; }
.badge-warn { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid #eab308; }

.section-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    color: #00ffb4;
    text-transform: uppercase;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #1e2d40;
}
.alert-box {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.4);
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 10px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #fca5a5;
}
.warn-box {
    background: rgba(234,179,8,0.1);
    border: 1px solid rgba(234,179,8,0.4);
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 10px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #fde047;
}
.ok-box {
    background: rgba(34,197,94,0.1);
    border: 1px solid rgba(34,197,94,0.4);
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 10px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #86efac;
}
.vitals-bar {
    height: 6px;
    border-radius: 3px;
    margin: 4px 0;
    background: #1e2d40;
    overflow: hidden;
}
.vitals-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
}
</style>
""", unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Header
# ──────────────────────────────────────────────
col_logo, col_title = st.columns([1, 5])
with col_title:
    st.markdown("""
    <div style="padding: 10px 0 20px 0;">
        <div style="font-family:'Space Mono',monospace;font-size:11px;letter-spacing:0.2em;color:#00ffb4;margin-bottom:6px;">
            EMERGENCY INTELLIGENCE SYSTEM v2.0
        </div>
        <h1 style="font-size:38px;margin:0;color:#f1f5f9;letter-spacing:-0.02em;">
            🚑 TriageAI
        </h1>
        <div style="color:#64748b;font-size:14px;margin-top:6px;">
            Real-time severity scoring · Priority correction · Predictive risk analysis
        </div>
    </div>
    """, unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Advanced AI Model (multi-factor weighted scoring)
# ──────────────────────────────────────────────
SYMPTOM_WEIGHTS = {
    "Chest Pain":            45,
    "Stroke Symptoms":       50,
    "Severe Bleeding":       42,
    "Breathing Difficulty":  40,
    "Trauma / Accident":     35,
    "High Fever (>103°F)":   25,
    "Fracture":              20,
    "Abdominal Pain":        18,
    "Minor Bleeding":        12,
    "Fever":                 10,
    "Normal / Minor":         2,
}

def predict_severity(symptom, heart_rate, bp_systolic, bp_diastolic, oxygen, age, pain_scale, consciousness):
    score = 0.0

    # Symptom base score (0–50)
    score += SYMPTOM_WEIGHTS.get(symptom, 10)

    # Heart rate scoring
    if heart_rate > 130:       score += 25
    elif heart_rate > 110:     score += 18
    elif heart_rate > 100:     score += 10
    elif heart_rate < 50:      score += 20
    elif heart_rate < 60:      score += 8

    # Blood pressure scoring (MAP-based)
    map_val = bp_diastolic + (bp_systolic - bp_diastolic) / 3
    if map_val < 60:           score += 30  # Shock territory
    elif map_val < 70:         score += 18
    elif map_val > 120:        score += 20  # Hypertensive crisis
    elif map_val > 105:        score += 10

    # Oxygen saturation
    if oxygen < 85:            score += 35
    elif oxygen < 90:          score += 25
    elif oxygen < 94:          score += 12
    elif oxygen < 96:          score += 5

    # Age risk factor
    if age >= 75:              score += 15
    elif age >= 65:            score += 10
    elif age <= 5:             score += 12
    elif age <= 12:            score += 6

    # Pain scale
    if pain_scale >= 9:        score += 15
    elif pain_scale >= 7:      score += 8
    elif pain_scale >= 5:      score += 3

    # Consciousness/LOC
    consciousness_scores = {
        "Alert":           0,
        "Confused":       15,
        "Responds to Voice": 25,
        "Unresponsive":   40,
    }
    score += consciousness_scores.get(consciousness, 0)

    return min(round(score, 1), 100.0)

def get_status(severity):
    if severity >= 80:   return "CRITICAL",  "critical",  "#ef4444"
    elif severity >= 60: return "HIGH",       "moderate",  "#f97316"
    elif severity >= 35: return "MODERATE",   "moderate",  "#eab308"
    else:                return "LOW",        "low",       "#22c55e"

def severity_delta_trend(severity):
    """Simulates a trend arrow for demo purposes based on vitals score."""
    if severity >= 70:  return "↑ Worsening"
    elif severity >= 45: return "→ Stable"
    else:               return "↓ Improving"

# ──────────────────────────────────────────────
# Session State
# ──────────────────────────────────────────────
if "patients" not in st.session_state:
    st.session_state.patients = []
if "corrected" not in st.session_state:
    st.session_state.corrected = False

# ──────────────────────────────────────────────
# Sidebar — Patient Input
# ──────────────────────────────────────────────
with st.sidebar:
    st.markdown('<div class="section-title">📋 Add New Patient</div>', unsafe_allow_html=True)

    name = st.text_input("Patient Name", placeholder="e.g. John Doe")
    age  = st.number_input("Age", min_value=1, max_value=110, value=35)

    symptom = st.selectbox("Primary Complaint", list(SYMPTOM_WEIGHTS.keys()))
    consciousness = st.selectbox("Consciousness Level", ["Alert", "Confused", "Responds to Voice", "Unresponsive"])

    st.markdown("**Vitals**")
    heart_rate    = st.slider("Heart Rate (bpm)", 30, 200, 80)
    bp_systolic   = st.slider("BP Systolic (mmHg)", 60, 220, 120)
    bp_diastolic  = st.slider("BP Diastolic (mmHg)", 40, 140, 80)
    oxygen        = st.slider("SpO₂ Oxygen (%)", 60, 100, 98)
    pain_scale    = st.slider("Pain Scale (0–10)", 0, 10, 3)

    add_btn = st.button("⚡ Analyze & Add Patient", use_container_width=True)

    st.markdown("---")
    if st.button("🗑️ Clear All Patients", use_container_width=True):
        st.session_state.patients = []
        st.session_state.corrected = False
        st.rerun()

    if st.button("🎲 Load Demo Patients", use_container_width=True):
        st.session_state.patients = [
            {"Name": "Maria Santos",   "Age": 67, "Symptom": "Chest Pain",           "Consciousness": "Alert",              "HR": 124, "BPS": 168, "BPD": 100, "SpO2": 91, "Pain": 8, "Severity": 0, "Doctor Priority": 1},
            {"Name": "James Okafor",   "Age": 34, "Symptom": "Normal / Minor",        "Consciousness": "Alert",              "HR": 75,  "BPS": 118, "BPD": 76,  "SpO2": 99, "Pain": 1, "Severity": 0, "Doctor Priority": 2},
            {"Name": "Priya Nair",     "Age": 8,  "Symptom": "High Fever (>103°F)",   "Consciousness": "Confused",           "HR": 118, "BPS": 100, "BPD": 65,  "SpO2": 96, "Pain": 6, "Severity": 0, "Doctor Priority": 3},
            {"Name": "Robert Chen",    "Age": 82, "Symptom": "Stroke Symptoms",        "Consciousness": "Responds to Voice",  "HR": 98,  "BPS": 190, "BPD": 115, "SpO2": 88, "Pain": 5, "Severity": 0, "Doctor Priority": 4},
            {"Name": "Anika Müller",   "Age": 29, "Symptom": "Fracture",              "Consciousness": "Alert",              "HR": 90,  "BPS": 130, "BPD": 84,  "SpO2": 98, "Pain": 7, "Severity": 0, "Doctor Priority": 5},
        ]
        for p in st.session_state.patients:
            p["Severity"] = predict_severity(
                p["Symptom"], p["HR"], p["BPS"], p["BPD"],
                p["SpO2"], p["Age"], p["Pain"], p["Consciousness"]
            )
        st.session_state.corrected = False
        st.rerun()

# ──────────────────────────────────────────────
# Add Patient Logic
# ──────────────────────────────────────────────
if add_btn and name.strip():
    severity = predict_severity(symptom, heart_rate, bp_systolic, bp_diastolic, oxygen, age, pain_scale, consciousness)
    st.session_state.patients.append({
        "Name": name.strip(),
        "Age": age,
        "Symptom": symptom,
        "Consciousness": consciousness,
        "HR": heart_rate,
        "BPS": bp_systolic,
        "BPD": bp_diastolic,
        "SpO2": oxygen,
        "Pain": pain_scale,
        "Severity": severity,
        "Doctor Priority": len(st.session_state.patients) + 1
    })
    st.session_state.corrected = False
    st.rerun()
elif add_btn:
    st.sidebar.error("Please enter a patient name.")

# ──────────────────────────────────────────────
# Summary Metrics
# ──────────────────────────────────────────────
patients = st.session_state.patients

if patients:
    critical_count  = sum(1 for p in patients if p["Severity"] >= 80)
    high_count      = sum(1 for p in patients if 60 <= p["Severity"] < 80)
    moderate_count  = sum(1 for p in patients if 35 <= p["Severity"] < 60)
    low_count       = sum(1 for p in patients if p["Severity"] < 35)

    # Detect mismatches
    mismatches = []
    for p in patients:
        status_label, _, _ = get_status(p["Severity"])
        if p["Severity"] >= 60 and p["Doctor Priority"] > 2:
            mismatches.append(p["Name"])

    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("Total Patients", len(patients))
    m2.metric("🔴 Critical",  critical_count,  delta=f"{critical_count} need immediate care"  if critical_count else None,  delta_color="inverse")
    m3.metric("🟠 High",      high_count)
    m4.metric("🟡 Moderate",  moderate_count)
    m5.metric("🟢 Low",       low_count)

    if mismatches:
        st.markdown(f"""
        <div class="alert-box">
            ⚠️ PRIORITY MISMATCH DETECTED — {len(mismatches)} patient(s) are high/critical but not top priority:
            <b>{', '.join(mismatches)}</b>
        </div>
        """, unsafe_allow_html=True)

st.markdown("---")

# ──────────────────────────────────────────────
# Main Layout: Dashboard + Alerts
# ──────────────────────────────────────────────
col_dash, col_right = st.columns([3, 2])

with col_dash:
    st.markdown('<div class="section-title">🏥 Live Patient Dashboard</div>', unsafe_allow_html=True)

    if not patients:
        st.markdown("""
        <div style="text-align:center;padding:60px 20px;color:#334155;font-family:'Space Mono',monospace;font-size:13px;">
            No patients yet.<br>Add a patient from the sidebar or load demo data.
        </div>
        """, unsafe_allow_html=True)
    else:
        sorted_display = sorted(patients, key=lambda x: x["Severity"], reverse=True)

        for p in sorted_display:
            label, css_class, color = get_status(p["Severity"])
            trend = severity_delta_trend(p["Severity"])
            map_val = round(p["BPD"] + (p["BPS"] - p["BPD"]) / 3, 1)

            badge_class = f"badge-{'critical' if label in ['CRITICAL','HIGH'] else 'low' if label == 'LOW' else 'moderate'}"

            # Determine priority badge
            priority_warn = ""
            if p["Severity"] >= 60 and p["Doctor Priority"] > 2:
                priority_warn = f'<span class="badge badge-warn">⚠️ PRIORITY #{p["Doctor Priority"]} — WRONG</span>'
            else:
                priority_warn = f'<span class="badge badge-priority">Priority #{p["Doctor Priority"]}</span>'

            # Vitals bar widths
            hr_pct = min(int((p["HR"] - 30) / 170 * 100), 100)
            bp_pct = min(int((p["BPS"] - 60) / 160 * 100), 100)
            o2_pct = min(int((p["SpO2"] - 60) / 40 * 100), 100)
            hr_color  = "#ef4444" if p["HR"] > 110 or p["HR"] < 55 else "#22c55e"
            bp_color  = "#ef4444" if p["BPS"] > 160 or p["BPS"] < 90 else "#22c55e"
            o2_color  = "#ef4444" if p["SpO2"] < 92 else "#22c55e"

            st.markdown(f"""
            <div class="patient-card {css_class}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <h3 style="color:#f1f5f9;">👤 {p['Name']} <span style="font-size:13px;color:#64748b;font-weight:400;">· Age {p['Age']}</span></h3>
                    <div style="font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:{color};">{p['Severity']}<span style="font-size:12px;color:#64748b;">/100</span></div>
                </div>
                <div>
                    <span class="badge {badge_class}">{label}</span>
                    {priority_warn}
                    <span class="badge" style="background:rgba(100,116,139,0.2);color:#94a3b8;border:1px solid #334155;">{trend}</span>
                </div>
                <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
                    <div>
                        <div class="detail">HR: {p['HR']} bpm</div>
                        <div class="vitals-bar"><div class="vitals-fill" style="width:{hr_pct}%;background:{hr_color};"></div></div>
                    </div>
                    <div>
                        <div class="detail">BP: {p['BPS']}/{p['BPD']} · MAP {map_val}</div>
                        <div class="vitals-bar"><div class="vitals-fill" style="width:{bp_pct}%;background:{bp_color};"></div></div>
                    </div>
                    <div>
                        <div class="detail">SpO₂: {p['SpO2']}%</div>
                        <div class="vitals-bar"><div class="vitals-fill" style="width:{o2_pct}%;background:{o2_color};"></div></div>
                    </div>
                </div>
                <div style="margin-top:10px;display:flex;gap:16px;flex-wrap:wrap;">
                    <div class="detail">🩺 {p['Symptom']}</div>
                    <div class="detail">🧠 {p['Consciousness']}</div>
                    <div class="detail">😣 Pain {p['Pain']}/10</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

with col_right:
    # ─── Alerts Panel ───
    st.markdown('<div class="section-title">🚨 System Alerts</div>', unsafe_allow_html=True)

    if patients:
        alerts_shown = 0
        for p in patients:
            label, _, _ = get_status(p["Severity"])
            if label == "CRITICAL" and p["Doctor Priority"] > 1:
                st.markdown(f"""
                <div class="alert-box">🔴 <b>{p['Name']}</b> is CRITICAL (score {p['Severity']}) but ranked Priority #{p['Doctor Priority']}!</div>
                """, unsafe_allow_html=True)
                alerts_shown += 1
            elif label == "HIGH" and p["Doctor Priority"] > 2:
                st.markdown(f"""
                <div class="alert-box">🟠 <b>{p['Name']}</b> is HIGH severity (score {p['Severity']}) but ranked Priority #{p['Doctor Priority']}.</div>
                """, unsafe_allow_html=True)
                alerts_shown += 1

        if alerts_shown == 0:
            st.markdown('<div class="ok-box">✅ All priorities appear correctly assigned.</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div style="color:#334155;font-family:Space Mono,monospace;font-size:12px;">No patients loaded.</div>', unsafe_allow_html=True)

    st.markdown("---")

    # ─── Future Risk Predictions ───
    st.markdown('<div class="section-title">🔮 Predictive Risk Analysis</div>', unsafe_allow_html=True)

    if patients:
        risks_shown = 0
        for p in patients:
            label, _, _ = get_status(p["Severity"])
            # Escalation risk: moderate patients with dangerous individual vitals
            risk_factors = []
            if 35 <= p["Severity"] < 65:
                if p["HR"] > 105:       risk_factors.append("tachycardia")
                if p["SpO2"] < 95:      risk_factors.append("dropping O₂")
                if p["BPS"] > 155:      risk_factors.append("high BP")
                if p["Pain"] >= 7:      risk_factors.append("high pain")
                if p["Age"] >= 65:      risk_factors.append("age risk")
                if p["Consciousness"] != "Alert": risk_factors.append("altered consciousness")

                if risk_factors:
                    st.markdown(f"""
                    <div class="warn-box">
                        ⚠️ <b>{p['Name']}</b> may escalate — {', '.join(risk_factors)} detected (severity {p['Severity']}).
                    </div>
                    """, unsafe_allow_html=True)
                    risks_shown += 1

        if risks_shown == 0:
            st.markdown('<div class="ok-box">✅ No imminent escalation risks detected.</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div style="color:#334155;font-family:Space Mono,monospace;font-size:12px;">No data.</div>', unsafe_allow_html=True)

    st.markdown("---")

    # ─── Auto-Correct Button ───
    st.markdown('<div class="section-title">⚙️ Priority Management</div>', unsafe_allow_html=True)

    if st.button("🔄 Auto-Correct Priority Order", use_container_width=True):
        st.session_state.patients = sorted(
            st.session_state.patients,
            key=lambda x: x["Severity"],
            reverse=True
        )
        for i, p in enumerate(st.session_state.patients):
            p["Doctor Priority"] = i + 1
        st.session_state.corrected = True
        st.rerun()

    if st.session_state.corrected:
        st.markdown('<div class="ok-box">✅ Priorities re-ranked by AI severity score.</div>', unsafe_allow_html=True)

    # ─── Severity Score Legend ───
    st.markdown("---")
    st.markdown('<div class="section-title">📊 Severity Scale</div>', unsafe_allow_html=True)
    for label, rng, color in [
        ("CRITICAL", "80–100", "#ef4444"),
        ("HIGH",     "60–79",  "#f97316"),
        ("MODERATE", "35–59",  "#eab308"),
        ("LOW",      "0–34",   "#22c55e"),
    ]:
        st.markdown(f"""
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:12px;height:12px;border-radius:50%;background:{color};flex-shrink:0;"></div>
            <div style="font-family:'Space Mono',monospace;font-size:12px;color:#94a3b8;">
                <b style="color:{color};">{label}</b> · Score {rng}
            </div>
        </div>
        """, unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Footer
# ──────────────────────────────────────────────
st.markdown("---")
st.markdown("""
<div style="text-align:center;font-family:'Space Mono',monospace;font-size:11px;color:#334155;padding:10px;">
    TriageAI v2.0 · For demonstration purposes only · Not a substitute for clinical judgment
</div>
""", unsafe_allow_html=True)