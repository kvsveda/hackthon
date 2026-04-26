const express = require("express");
const cors = require("cors");
const { calculateSeverity, calculateDrift } = require("./severityLogic");
const { db } = require("./firebase");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory fallback store
let patients = [];

// Route to register a patient
app.post("/api/patients", async (req, res) => {
  const { name, age, gender, symptom, nurse_priority, current_vitals } = req.body;

  if (!name || !current_vitals) {
    return res.status(400).json({ error: "Name and vitals are required" });
  }

  const { score, status, explanations } = calculateSeverity(current_vitals, symptom);

  const newPatient = {
    patient_id: `P-${Date.now()}`,
    name,
    age,
    gender,
    symptom,
    nurse_priority,
    current_vitals,
    vital_history: [{ timestamp: Date.now(), ...current_vitals }],
    ai_score: score,
    ai_status: status,
    drift_status: "Stable",
    explanations,
    created_at: Date.now()
  };

  try {
    if (db) {
      // Save to Firestore
      await db.collection("patients").doc(newPatient.patient_id).set(newPatient);
    } else {
      // Fallback to in-memory array
      patients.push(newPatient);
    }
    res.status(201).json(newPatient);
  } catch (error) {
    console.error("Error saving patient:", error);
    res.status(500).json({ error: "Failed to save patient" });
  }
});

// Route to get all patients
app.get("/api/patients", async (req, res) => {
  try {
    let fetchedPatients = [];
    if (db) {
      // Fetch from Firestore
      const snapshot = await db.collection("patients").get();
      snapshot.forEach(doc => {
        fetchedPatients.push(doc.data());
      });
    } else {
      // Fetch from in-memory array
      fetchedPatients = [...patients];
    }

    // Sort by ai_score descending
    fetchedPatients.sort((a, b) => b.ai_score - a.ai_score);
    res.json(fetchedPatients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// Route to add new vitals and calculate drift
app.post("/api/patients/:id/vitals", async (req, res) => {
  const { id } = req.params;
  const newVitals = req.body;

  try {
    let patient;
    let docRef;

    if (db) {
      docRef = db.collection("patients").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Patient not found" });
      patient = doc.data();
    } else {
      patient = patients.find(p => p.patient_id === id);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
    }

    // Append new vitals to history
    const vitalsWithTime = { timestamp: Date.now(), ...newVitals };
    patient.vital_history.push(vitalsWithTime);
    patient.current_vitals = newVitals;

    // Recalculate Severity
    const { score, status, explanations } = calculateSeverity(newVitals, patient.symptom);
    patient.ai_score = score;
    patient.ai_status = status;
    patient.explanations = explanations;

    // Calculate Priority Drift
    patient.drift_status = calculateDrift(patient.vital_history);

    if (db) {
      await docRef.update(patient);
    }

    res.json(patient);
  } catch (error) {
    console.error("Error updating vitals:", error);
    res.status(500).json({ error: "Failed to update vitals" });
  }
});

// Route to auto-correct priority
app.patch("/api/patients/:id/correct", async (req, res) => {
  const { id } = req.params;
  try {
    if (db) {
      const docRef = db.collection("patients").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Patient not found" });
      
      const patient = doc.data();
      await docRef.update({ nurse_priority: patient.ai_status });
      res.json({ success: true });
    } else {
      const patient = patients.find(p => p.patient_id === id);
      if (!patient) return res.status(404).json({ error: "Patient not found" });
      
      patient.nurse_priority = patient.ai_status;
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Error correcting patient:", error);
    res.status(500).json({ error: "Failed to correct priority" });
  }
});

// Route to clear all patients (Demo Reset)
app.delete("/api/patients", async (req, res) => {
  try {
    if (db) {
      // In a real app we'd delete the collection, but for demo we just fetch and delete docs
      const snapshot = await db.collection("patients").get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } else {
      patients = [];
    }
    res.json({ success: true, message: "All patients cleared." });
  } catch (error) {
    console.error("Error clearing patients:", error);
    res.status(500).json({ error: "Failed to clear patients" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
