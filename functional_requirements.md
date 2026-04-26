# DriftGuard AI – Real-Time Emergency Triage System: Functional Requirements

## 1. Product Overview
DriftGuard AI is an advanced, real-time emergency triage system designed to optimize patient prioritization in hospital settings. By continuously analyzing patient vitals, symptoms, and simulated IoT medical device data, the system predicts clinical severity, detects prioritization errors in hospital queues, and automatically reorders patients based on actual medical urgency. Additionally, it features a "Priority Drift Prediction" engine to forecast future patient deterioration, ensuring proactive medical intervention. The system is built with a focus on real-time responsiveness and deterministic, explainable AI decisions suitable for a lightweight (e.g., Streamlit-based) deployment.

## 2. Goals and Objectives
- **Dynamic Prioritization:** Ensure the most critical patients are seen first, dynamically adjusting queue positions as patient conditions change.
- **Error Detection:** Automatically identify and alert on discrepancies between a patient's initial triage priority and their real-time calculated clinical severity.
- **Proactive Care:** Forecast patient deterioration (Priority Drift) before it becomes a critical emergency.
- **Explainability:** Provide clear, understandable reasons for severity classifications and queue reordering to build trust with medical staff.
- **Real-Time Simulation:** Accurately simulate continuous data streams from medical IoT devices to mimic real-world emergency room conditions.

## 3. User Roles
- **Doctor:** Views the centralized dashboard, focuses on clinical explainability, and responds to critical alerts and priority drifts.
- **Nurse/Triage Officer:** Registers new patients, inputs initial symptoms and vitals, and relies on the system for auto-correction of manual triage errors.
- **Ambulance Operator:** Inbound patient context; acts similarly to the Nurse role by pre-registering patients before arrival (simulated via IoT streams).
- **System (Automated Agent):** Continuously monitors data, calculates severity, updates priorities, detects wrong prioritizations, and issues alerts.

## 4. Assumptions and Constraints
- **Platform:** The application will be implemented using a simple UI framework like Streamlit.
- **Dependencies:** Core logic must be implemented in pure Python. Heavy dependencies like `pyarrow` or `pandas` should be avoided for rendering to keep the application lightweight and robust.
- **Data Source:** No external database is required. State will be managed in-memory using session state.
- **Environment:** Designed for a hackathon context, emphasizing functional completeness and algorithmic accuracy over long-term data persistence.

---

## 5. Functional Requirements (DETAILED)

### 5.1 Patient Registration
- **Description:** Allows manual entry of new patients into the triage queue.
- **Inputs:** Name, Age, Gender, Primary Symptom, Initial Vitals (Heart Rate, Blood Pressure (Systolic/Diastolic), O2 Saturation, Temperature), Initial Nurse Priority (Low, Moderate, Critical).
- **Outputs:** A new patient record appended to the system's state.
- **Step-by-step behavior:**
  1. User fills out the registration form.
  2. User clicks "Register Patient".
  3. System validates inputs (e.g., valid ranges for vitals).
  4. System assigns a unique Patient ID.
  5. System calculates the initial AI Severity Score.
  6. Patient is added to the live queue.
- **Acceptance Criteria:**
  - [ ] Registration form captures all required fields.
  - [ ] Input validation prevents impossible vitals (e.g., negative heart rate).
  - [ ] Patient immediately appears in the live dashboard upon successful registration.
- **Edge Cases:**
  - Duplicate names (handled by unique Patient IDs).
  - Missing non-critical fields (system must reject if mandatory vitals are missing).

### 5.2 Real-Time Vital Monitoring (Manual + Simulated IoT)
- **Description:** Continuously updates patient vitals to simulate live monitoring.
- **Inputs:** Periodic trigger (e.g., every 5 seconds) simulating IoT data stream.
- **Outputs:** Updated vital values in the patient record.
- **Step-by-step behavior:**
  1. A background process or simulation loop ticks.
  2. For a subset of active patients, vitals are slightly randomized within realistic physiological drift bounds.
  3. System state is updated with new vitals.
- **Acceptance Criteria:**
  - [ ] System automatically updates patient vitals without manual refresh.
  - [ ] Vitals drift within realistic medical parameters.
- **Edge Cases:**
  - Rapid fluctuations causing UI flickering (update frequency must be balanced).
  - Device failure simulation (missing vital readings must be handled safely).

### 5.3 Severity Prediction Engine
- **Description:** Calculates a numerical risk score based on current vitals and symptoms.
- **Inputs:** Patient Vitals (HR, BP, O2, Temp), Primary Symptom.
- **Outputs:** Clinical Severity Score (e.g., 1-100).
- **Step-by-step behavior:**
  1. Ingest latest vitals and symptoms.
  2. Apply deterministic medical logic rules (e.g., O2 < 90% adds high weight, HR > 120 adds high weight).
  3. Aggregate weights into a normalized score.
- **Acceptance Criteria:**
  - [ ] Score is recalculated immediately upon any vital update.
  - [ ] Same inputs always produce the exact same score.
- **Edge Cases:**
  - Borderline values exactly on the threshold (logic must clearly define inclusive/exclusive bounds).

### 5.4 Status Classification
- **Description:** Maps the numerical severity score to a categorical status.
- **Inputs:** Clinical Severity Score.
- **Outputs:** Categorical Status (`Critical`, `Moderate`, `Low`).
- **Step-by-step behavior:**
  1. Receive score.
  2. Apply thresholds: >80 Critical, 50-80 Moderate, <50 Low.
- **Acceptance Criteria:**
  - [ ] Status correctly reflects the predefined score thresholds.
- **Edge Cases:**
  - Score exactly at the threshold value (e.g., 80) must be handled deterministically.

### 5.5 Live Patient Dashboard
- **Description:** A real-time view of all patients in the queue.
- **Inputs:** System patient state.
- **Outputs:** Tabular UI rendering patient data.
- **Step-by-step behavior:**
  1. Read active patient list.
  2. Render a table with columns: ID, Name, Vitals, Nurse Priority, AI Status, Risk Score.
  3. Apply visual styling based on status.
- **Acceptance Criteria:**
  - [ ] No external heavy dependencies (like pandas) used for the core table rendering.
  - [ ] Table updates dynamically as data changes.
- **Edge Cases:**
  - Very large number of patients (UI should scroll smoothly).

### 5.6 Wrong Prioritization Detection
- **Description:** Identifies when the manual "Nurse Priority" contradicts the calculated "AI Status".
- **Inputs:** Initial Nurse Priority, AI Status.
- **Outputs:** Discrepancy Flag (Boolean) and Warning Message.
- **Step-by-step behavior:**
  1. Compare Nurse Priority with AI Status.
  2. If Nurse = `Low` but AI = `Critical`, flag as Severe Error.
  3. If Nurse = `Moderate` but AI = `Critical`, flag as Warning.
- **Acceptance Criteria:**
  - [ ] System accurately identifies under-triage and over-triage.
- **Edge Cases:**
  - Minor discrepancies (Nurse = Critical, AI = Moderate) might be ignored or flagged with lower severity.

### 5.7 Auto Priority Correction
- **Description:** Reorders the patient queue based strictly on the AI Severity Score, overriding manual priority.
- **Inputs:** Unsorted list of patients.
- **Outputs:** Sorted list of patients.
- **Step-by-step behavior:**
  1. Trigger sorting routine on every state update.
  2. Sort patients descending by Severity Score.
  3. Update dashboard order.
- **Acceptance Criteria:**
  - [ ] The highest severity score patient is ALWAYS at the top.
- **Edge Cases:**
  - Two patients with the exact same score (tie-breaker: Time of arrival / Patient ID).

### 5.8 Priority Drift Prediction
- **Description:** Forecasts if a patient is trending toward a critical state based on the rate of change of their vitals.
- **Inputs:** Historical vital snapshots (last N readings) for a patient.
- **Outputs:** Drift Alert (`Stable`, `Deteriorating`, `Improving`).
- **Step-by-step behavior:**
  1. Analyze the delta between the current vitals and previous vitals.
  2. If O2 is dropping steadily over 3 ticks, or HR is rising steadily, calculate a "Velocity of Deterioration".
  3. If velocity exceeds threshold, trigger "Deteriorating" alert.
- **Acceptance Criteria:**
  - [ ] System correctly identifies sustained negative trends, not just momentary blips.
- **Edge Cases:**
  - Insufficient history for new patients (must default to `Stable` until enough data is collected).

### 5.9 Alert System
- **Description:** Displays notifications for critical events.
- **Inputs:** Output from Drift Prediction, Wrong Prioritization Detection, and Severity Classification.
- **Outputs:** UI Banners, Toasts, or Highlighted rows.
- **Step-by-step behavior:**
  1. Event triggered.
  2. Format alert message based on event type (e.g., "[CRITICAL] Patient X O2 dropped below 90%").
  3. Render alert in UI prominently.
- **Acceptance Criteria:**
  - [ ] Alerts are highly visible.
  - [ ] Alerts auto-clear or can be dismissed once acknowledged (or condition resolves).
- **Edge Cases:**
  - Multiple simultaneous alerts (must queue or display in an organized list without breaking UI).

### 5.10 Explainable AI
- **Description:** Provides transparency into why a specific score or status was assigned.
- **Inputs:** Patient data, Severity Engine logic tree.
- **Outputs:** Textual explanation.
- **Step-by-step behavior:**
  1. User clicks on a patient's score.
  2. System generates a string: "Score 85 driven by: O2 Saturation (88%) is critically low; Heart Rate (125) is elevated."
- **Acceptance Criteria:**
  - [ ] Explanations accurately map to the active logic rules.
- **Edge Cases:**
  - Multiple severe factors (explanation must list the most impactful factors first).

### 5.11 Simulated Device Integration
- **Description:** Generates synthetic data streams to mimic external monitors.
- **Inputs:** Simulation configuration (tick rate, drift volatility).
- **Outputs:** Continuous state mutations.
- **Step-by-step behavior:**
  1. Run a threaded or session-based simulation loop.
  2. Inject new vital values into the state.
- **Acceptance Criteria:**
  - [ ] Simulation runs smoothly without blocking the main UI thread.
- **Edge Cases:**
  - Simulation pause/resume functionality.

### 5.12 Session State Management
- **Description:** Maintains application state across user interactions and re-renders.
- **Inputs:** User actions, Simulation ticks.
- **Outputs:** Persistent data structures in memory.
- **Step-by-step behavior:**
  1. Initialize `st.session_state` keys on app start.
  2. Read/write to state keys exclusively.
- **Acceptance Criteria:**
  - [ ] Data is not lost when interacting with UI elements (buttons, inputs).
- **Edge Cases:**
  - Browser refresh will reset state (acceptable in a hackathon context without external DB).

### 5.13 Data Validation & Input Handling
- **Description:** Ensures system robustness against bad data.
- **Inputs:** User form inputs.
- **Outputs:** Validated data or Error messages.
- **Step-by-step behavior:**
  1. Intercept form submission.
  2. Check HR against 0-300.
  3. Check O2 against 0-100.
- **Acceptance Criteria:**
  - [ ] System never crashes due to invalid input types or out-of-bounds values.
- **Edge Cases:**
  - Empty strings, special characters in numeric fields.

---

## 6. User Workflows

### 6.1 Patient Arrival
1. Nurse opens Dashboard.
2. Navigates to "Register Patient".
3. Enters details (e.g., HR 110, O2 94, "Chest Pain", Priority: "Moderate").
4. Clicks Submit.
5. Patient appears on Live Dashboard.

### 6.2 Error Detection & Auto Correction
1. Nurse registers a patient with severe vitals (O2 85%) but assigns "Low" priority by mistake.
2. System calculates AI Score = 95 (Critical).
3. System triggers Alert: "Priority Mismatch for Patient X".
4. System automatically sorts Patient X to the top of the queue.

### 6.3 Drift Prediction
1. Patient Y is registered as "Moderate" with O2 95%.
2. Simulation ticks over 15 seconds. O2 drops: 94% -> 92% -> 89%.
3. Drift Engine calculates negative velocity.
4. System changes status to "Critical" and triggers "Priority Drift Alert: Patient Y deteriorating rapidly."
5. Queue auto-sorts.

---

## 7. System Behavior
- **Real-Time Updates:** The UI must reflect state changes (from simulation or manual entry) as instantly as the framework allows (e.g., using Streamlit's `st.rerun()` dynamically).
- **Performance:** Calculations must be O(N) or O(N log N) for sorting, ensuring no lag even with 50+ patients.
- **State Persistence:** Must use `st.session_state` to hold patient lists, alert history, and historical vital logs.
- **Error Handling:** Gracefully catch exceptions during calculation and display safe fallbacks rather than stack traces.

---

## 8. Non-Functional Requirements
- **Performance:** System recalculates queue in < 50ms upon state change.
- **Reliability:** The simulation loop must not crash the application.
- **Usability:** High contrast UI, readable fonts, clear call-to-action buttons.
- **Scalability (Future):** Architecture should cleanly separate logic (Model) from rendering (View) to allow future porting to React/FastAPI.
- **Security:** Basic sanitization of string inputs to prevent injection (even if just XSS in UI).

---

## 9. Data Model

### 9.1 Patient Object Structure
```json
{
  "patient_id": "P-1001",
  "name": "John Doe",
  "age": 45,
  "gender": "Male",
  "symptom": "Chest Pain",
  "nurse_priority": "Moderate",
  "current_vitals": {
    "hr": 115,
    "bp_sys": 140,
    "bp_dia": 90,
    "o2": 93,
    "temp": 37.5
  },
  "vital_history": [
    {"timestamp": 1714000000, "o2": 95, "hr": 110},
    {"timestamp": 1714000005, "o2": 94, "hr": 112}
  ],
  "ai_score": 72,
  "ai_status": "Moderate",
  "drift_status": "Stable",
  "explanations": ["Elevated Heart Rate (115)"]
}
```

---

## 10. Business Logic Rules

### 10.1 Severity Scoring Logic
Start with Score = 0.
- **O2 Saturation:**
  - < 90%: +40 points
  - 90-94%: +20 points
- **Heart Rate:**
  - > 120 or < 50: +30 points
  - 100-120: +15 points
- **Temperature:**
  - > 39.0 or < 35.0: +20 points
- **Symptoms:**
  - "Chest Pain" / "Stroke": +30 points
- **Total Score Cap:** Max 100.

### 10.2 Sorting Logic
1. Primary Sort: `ai_score` (Descending)
2. Secondary Sort: `drift_status` (Deteriorating > Stable)
3. Tertiary Sort: `patient_id` (Ascending, as proxy for arrival time)

### 10.3 Drift Prediction Rules
Calculate rate of change over the last 3 data points.
- If O2 decreases by >= 3% total over 3 points -> Trigger `Deteriorating`.
- If HR increases by >= 15 bpm total over 3 points -> Trigger `Deteriorating`.

---

## 11. UI/UX Requirements
- **Dashboard Layout:**
  - Top bar: Global Alerts.
  - Left Sidebar: Registration Form & Simulation Controls.
  - Main Area: The Sorted Patient Queue Table.
- **Color Coding:**
  - Critical: Red (`#FFcccc` background or red text).
  - Moderate: Yellow/Orange (`#FFF2cc`).
  - Low: Green (`#ccFFcc`).
- **Alert Visibility:** Red, blinking, or permanently pinned to the top until dismissed.
- **Interaction Rules:** Clicking a row expands it to show "Explainable AI" reasoning and vital history charts (if implementable without heavy libraries, else text history).

---

## 12. Testing Scenarios
- **Normal Cases:** Register a normal patient (all vitals green). Ensure score is low and position is at the bottom of the queue.
- **Edge Cases:**
  - Tie scores: Register two identical patients. Ensure stable sorting.
  - Rapid Simulation: Set simulation tick to 1s. Ensure UI does not freeze.
- **Failure Cases:**
  - Submit form with missing vitals. Expect validation error message.
  - Attempt to register age = -5. Expect validation error.

---

## 13. Definition of Done
- All functional requirements are implemented in a single runable Python file (`app.py` or similar).
- The system runs via Streamlit without crashing.
- Live data simulation correctly alters vitals and triggers queue re-sorting.
- The UI accurately renders patient status colors and alerts without requiring manual page refresh.
- No external heavy dependencies (like pandas for rendering) are utilized.
- Code is clean, well-commented, and logically separated.
