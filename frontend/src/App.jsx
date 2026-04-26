import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, UserPlus, HeartPulse, ShieldAlert, CheckCircle2, Trash2, Users, AlertOctagon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://hackthon-ne3c.onrender.com/api/patients';

function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    symptom: '',
    nurse_priority: 'Moderate',
    o2: '',
    hr: '',
    bp_sys: '',
    bp_dia: '',
    temp: ''
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate discrepancies (Wrong Prioritization)
  const discrepancies = patients.filter(p => {
    if (p.nurse_priority === 'Low' && p.ai_status === 'Critical') return true;
    if (p.nurse_priority === 'Moderate' && p.ai_status === 'Critical') return true;
    if (p.nurse_priority === 'Low' && p.ai_status === 'Moderate') return true;
    return false;
  });

  const handleAutoCorrect = async (patientId) => {
    try {
      const response = await fetch(`${API_URL}/${patientId}/correct`, {
        method: 'PATCH'
      });
      if (response.ok) {
        fetchPatients();
      } else {
        alert("Failed to auto correct priority");
      }
    } catch (error) {
      console.error("Error auto-correcting:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // Poll every 3 seconds for live updates
    const interval = setInterval(() => {
      fetchPatients();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // IoT Simulation Logic
  useEffect(() => {
    let simInterval;
    if (isSimulating && patients.length > 0) {
      simInterval = setInterval(async () => {
        // Pick a random patient to "deteriorate" slightly
        const randomPatient = patients[Math.floor(Math.random() * patients.length)];
        const currentVitals = randomPatient.current_vitals;
        
        const newVitals = {
          ...currentVitals,
          o2: Math.max(50, currentVitals.o2 - Math.floor(Math.random() * 3)), // O2 drops 0-2%
          hr: Math.min(200, currentVitals.hr + Math.floor(Math.random() * 5))  // HR rises 0-4 bpm
        };

        try {
          await fetch(`${API_URL}/${randomPatient.patient_id}/vitals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newVitals)
          });
          // Note: The regular polling interval will pick up this change
        } catch (error) {
          console.error("Simulation error:", error);
        }
      }, 4000); // Send new vitals every 4 seconds
    }
    return () => clearInterval(simInterval);
  }, [isSimulating, patients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format payload for backend
    const payload = {
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      symptom: formData.symptom,
      nurse_priority: formData.nurse_priority,
      current_vitals: {
        o2: parseFloat(formData.o2),
        hr: parseInt(formData.hr),
        bp_sys: parseInt(formData.bp_sys),
        bp_dia: parseInt(formData.bp_dia),
        temp: parseFloat(formData.temp)
      }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setFormData({
          name: '', age: '', gender: 'Male', symptom: '', nurse_priority: 'Moderate',
          o2: '', hr: '', bp_sys: '', bp_dia: '', temp: ''
        });
        fetchPatients();
        showToast("Patient registered successfully!");
      } else {
        showToast("Failed to register patient", "error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("Error submitting form", "error");
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm("Are you sure you want to delete all patients?")) {
      try {
        const response = await fetch(API_URL, { method: 'DELETE' });
        if (response.ok) {
          fetchPatients();
          showToast("Demo reset successfully!");
        }
      } catch (error) {
        console.error("Error resetting demo:", error);
      }
    }
  };

  // Helper to render severity badge
  const renderSeverityBadge = (status) => {
    switch(status) {
      case 'Critical': return <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-700 border border-red-200">Critical</span>;
      case 'Moderate': return <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200">Moderate</span>;
      case 'Low': return <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-700 border border-green-200">Low</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded shadow-lg z-50 text-white font-bold transition-all ${toastMessage.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toastMessage.message}
        </div>
      )}

      {/* Sidebar / Registration Form */}
      <div className="w-full md:w-[400px] bg-white border-r border-gray-200 shadow-sm p-6 flex flex-col h-screen overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <HeartPulse className="text-red-600 w-8 h-8" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">DriftGuard AI</h1>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-gray-500" />
          Register Patient
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="John Doe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input required type="number" name="age" value={formData.age} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Symptom</label>
            <input required type="text" name="symptom" value={formData.symptom} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="e.g. Chest Pain" />
          </div>

          <div className="border-t border-gray-100 pt-5 mt-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Initial Vitals
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Heart Rate</label>
                <div className="relative mt-1">
                  <input required type="number" name="hr" value={formData.hr} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all pr-8" placeholder="80" />
                  <span className="absolute right-2 top-3 text-xs text-gray-400">bpm</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">O2 Saturation</label>
                <div className="relative mt-1">
                  <input required type="number" name="o2" value={formData.o2} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all pr-6" placeholder="98" />
                  <span className="absolute right-2 top-3 text-xs text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">BP Systolic</label>
                <input required type="number" name="bp_sys" value={formData.bp_sys} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="120" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">BP Diastolic</label>
                <input required type="number" name="bp_dia" value={formData.bp_dia} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all" placeholder="80" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</label>
                <div className="relative mt-1">
                  <input required type="number" step="0.1" name="temp" value={formData.temp} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm border p-2.5 focus:ring-red-500 focus:border-red-500 outline-none transition-all pr-6" placeholder="37.0" />
                  <span className="absolute right-2 top-3 text-xs text-gray-400">°C</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nurse Priority (Manual)</label>
            <select name="nurse_priority" value={formData.nurse_priority} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2.5 font-medium focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white">
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="pt-6 pb-4">
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform active:scale-[0.98]">
              Register Patient
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">IoT Simulation</h3>
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`w-full py-2 px-4 rounded-md text-sm font-bold transition-colors mb-3 ${
              isSimulating 
                ? 'bg-orange-100 text-orange-800 border border-orange-300 animate-pulse' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            {isSimulating ? '🛑 Stop IoT Simulation' : '📡 Start IoT Simulation'}
          </button>
          
          <button 
            onClick={handleResetDemo}
            className="w-full py-2 px-4 rounded-md text-sm font-bold bg-white text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Reset Demo
          </button>
        </div>
      </div>

      {/* Main Content / Live Dashboard */}
      <div className="flex-1 p-8 h-screen overflow-y-auto bg-[#F8FAFC]">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Live Triage Dashboard</h2>
            <p className="text-gray-500 mt-1 text-sm">Real-time patient monitoring and AI prioritization</p>
          </div>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-6 h-6"/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Patients</p>
              <h3 className="text-2xl font-bold text-gray-900">{patients.length}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertOctagon className="w-6 h-6"/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Critical</p>
              <h3 className="text-2xl font-bold text-gray-900">{patients.filter(p => p.ai_status === 'Critical').length}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Activity className="w-6 h-6"/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Deteriorating</p>
              <h3 className="text-2xl font-bold text-gray-900">{patients.filter(p => p.drift_status === 'Deteriorating').length}</h3>
            </div>
          </div>
        </div>

        {/* Wrong Prioritization Alerts */}
        {discrepancies.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm">
            <div className="flex items-start">
              <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Wrong Prioritization Detected!</h4>
                <ul className="mt-3 space-y-2">
                  {discrepancies.map(d => (
                    <li key={`alert-${d.patient_id}`} className="flex items-center justify-between bg-white bg-opacity-50 p-2 rounded">
                      <span className="text-sm text-red-800">
                        <strong>{d.name}</strong> was assigned <em>{d.nurse_priority}</em> priority, but AI calculated <strong>{d.ai_status}</strong> severity.
                      </span>
                      <button 
                        onClick={() => handleAutoCorrect(d.patient_id)}
                        className="ml-4 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Auto-Correct
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Patients Table */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status (AI)</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Current Vitals</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nurse Priority</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">Loading patients...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <Activity className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">No patients yet</h3>
                    <p className="text-sm text-gray-500 mt-1">Get started by registering a patient in the sidebar.</p>
                  </td>
                </tr>
              ) : (
                patients.map(patient => (
                  <React.Fragment key={patient.patient_id}>
                    <tr 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedPatientId === patient.patient_id ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setExpandedPatientId(expandedPatientId === patient.patient_id ? null : patient.patient_id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              {patient.name}
                              {patient.drift_status === "Deteriorating" && (
                                <span className="flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                  📉 Deteriorating
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">Age: {patient.age} • {patient.symptom}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderSeverityBadge(patient.ai_status)}
                        <div className="text-xs text-gray-500 mt-1.5 font-medium">Score: {patient.ai_score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-40">
                          <span className={patient.current_vitals.o2 < 95 ? "text-red-600 font-bold" : ""}>O2: {patient.current_vitals.o2}%</span>
                          <span className={patient.current_vitals.hr > 100 || patient.current_vitals.hr < 60 ? "text-red-600 font-bold" : ""}>HR: {patient.current_vitals.hr}</span>
                          <span>BP: {patient.current_vitals.bp_sys}/{patient.current_vitals.bp_dia}</span>
                          <span className={patient.current_vitals.temp > 38 || patient.current_vitals.temp < 36 ? "text-red-600 font-bold" : ""}>T: {patient.current_vitals.temp}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold px-2 py-1 rounded-md border ${
                          patient.nurse_priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                          patient.nurse_priority === 'Moderate' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {patient.nurse_priority}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Explainable AI Panel */}
                    {expandedPatientId === patient.patient_id && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 bg-blue-50 border-t border-b border-blue-100">
                          <div className="flex items-start">
                            <Activity className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <h5 className="text-sm font-bold text-blue-900">Explainable AI Reasoning</h5>
                              <p className="text-xs text-blue-700 mt-1 mb-2">Why did the system assign a score of {patient.ai_score}?</p>
                              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                                {patient.explanations && patient.explanations.length > 0 ? (
                                  patient.explanations.map((exp, idx) => (
                                    <li key={idx}>{exp}</li>
                                  ))
                                ) : (
                                  <li>Patient vitals and symptoms are normal.</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
