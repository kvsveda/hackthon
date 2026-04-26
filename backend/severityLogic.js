function calculateSeverity(vitals, symptom) {
  let score = 0;
  const explanations = [];

  // O2 Saturation
  if (vitals.o2 < 90) {
    score += 40;
    explanations.push(`O2 Saturation (${vitals.o2}%) is critically low`);
  } else if (vitals.o2 >= 90 && vitals.o2 <= 94) {
    score += 20;
    explanations.push(`O2 Saturation (${vitals.o2}%) is moderately low`);
  }

  // Heart Rate
  if (vitals.hr > 120 || vitals.hr < 50) {
    score += 30;
    explanations.push(`Heart Rate (${vitals.hr} bpm) is critical`);
  } else if (vitals.hr >= 100 && vitals.hr <= 120) {
    score += 15;
    explanations.push(`Heart Rate (${vitals.hr} bpm) is elevated`);
  }

  // Temperature
  if (vitals.temp > 39.0 || vitals.temp < 35.0) {
    score += 20;
    explanations.push(`Temperature (${vitals.temp}°C) is abnormal`);
  }

  // Symptoms
  const criticalSymptoms = ["chest pain", "stroke", "shortness of breath"];
  if (symptom && criticalSymptoms.includes(symptom.toLowerCase())) {
    score += 30;
    explanations.push(`Critical symptom reported: ${symptom}`);
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine Status
  let status = "Low";
  if (score > 80) status = "Critical";
  else if (score >= 50) status = "Moderate";

  return { score, status, explanations };
}

function calculateDrift(vitalHistory) {
  if (!vitalHistory || vitalHistory.length < 2) return "Stable";

  // Look at the last 3 readings (or fewer if we don't have 3)
  const recentHistory = vitalHistory.slice(-3);
  const oldest = recentHistory[0];
  const newest = recentHistory[recentHistory.length - 1];

  let driftScore = 0;

  // Decrease in O2 is bad
  if (newest.o2 < oldest.o2) driftScore += (oldest.o2 - newest.o2);
  
  // Increase in HR is bad
  if (newest.hr > oldest.hr) driftScore += ((newest.hr - oldest.hr) / 2);

  // If drift score exceeds threshold, mark as deteriorating
  if (driftScore >= 3) return "Deteriorating";
  
  return "Stable";
}

module.exports = { calculateSeverity, calculateDrift };
