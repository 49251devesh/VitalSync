import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Pill,
  User,
  Stethoscope,
  ClipboardList,
  HeartPulse,
  Thermometer,
  Droplet,
} from "lucide-react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import PatientUpdateModal from "../components/PatientUpdateModal";
import PatientChatbot from "../components/PatientChatbot";
import styles from "../components/PatientDashboard.module.css"
const PatientDashboard = () => {
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.token;
  const patientID = location.state?.patient?.patientID;

  // 🧠 Fetch patient data securely using token
  useEffect(() => {
    if (!id || !token) {
      alert("⚠️ Missing session info. Please log in again.");
      navigate("/patient-login");
      return;
    }

    axios
      .get(`http://localhost:5000/api/patients/dashboard/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) setPatient(res.data.patient);
        else setError(res.data.message || "Unable to load dashboard.");
      })
      .catch((err) => {
        console.error("Dashboard Fetch Error:", err);
        if (err.response?.status === 401) {
          alert("🔒 Session expired. Please log in again.");
          navigate("/patient-login");
        } else {
          setError(err.response?.data?.message || "Something went wrong.");
        }
      });
  }, [id, token, navigate]);

  if (error)
    return <p className="text-danger text-center mt-5 fw-bold">{error}</p>;

  if (!patient)
    return <p className="text-center mt-5">Loading your dashboard...</p>;

  // ✅ Extract hospitalID safely
  const hospitalID =
    patient.hospitalId ||
    patient.hospital?._id ||
    patient.hospital?.hospitalId ||
    localStorage.getItem("hospitalId") ||
    "";

  const hasVitals = patient.vitalsHistory?.length > 0;
  const hasVisits = patient.visitHistory?.length > 0;
  const hasPrescriptions = patient.prescriptions?.length > 0;

  return (
    <>
    <div className="container py-4 position-relative">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-1">Patient Dashboard</h2>
          <h5 className="text-muted">{patient.name}</h5>
          <p className="text-secondary mb-0">
            Patient ID: <strong>{patient.patientID}</strong>
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-success"
            onClick={() =>
              navigate(`/booking`, {
                state: { token, patientID: patient.patientID },
              })
            }
          >
            📅 Book Appointment
          </button>

          <button
            className="btn btn-info"
            onClick={() =>
              navigate(`/appointments/${patient.patientID}`, {
                state: { token },
              })
            }
          >
            📋 View My Appointments
          </button>

          <button
            className="btn btn-outline-primary"
            onClick={() => setShowUpdateModal(true)}
          >
            ✏️ Update My Details
          </button>

          <button
            className="btn btn-outline-danger"
            onClick={() => {
              alert("You have been logged out.");
              navigate("/patient-login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
      {/* PATIENT INFO */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <h5 className="mb-1">{patient.name}</h5>

        {patient.gender && (
          <p>
            <strong>Gender:</strong> {patient.gender}
          </p>
        )}
        {patient.age && (
          <p>
            <strong>Age:</strong> {patient.age}
          </p>
        )}
        {patient.department && (
          <p>
            <strong>Department:</strong> {patient.department}
          </p>
        )}

    <PatientChatbot patientID={patient.patientID} hospitalID={hospitalID} />

      </div>

      {/* 🩸 VITALS CHART */}
      {hasVitals && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex align-items-center mb-3">
            <HeartPulse className="text-danger me-2" />
            <h4 className="fw-bold mb-0">Vitals Overview</h4>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={patient.vitalsHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="systolicBP"
                stroke="#ef4444"
                name="Systolic BP"
              />
              <Line
                type="monotone"
                dataKey="diastolicBP"
                stroke="#3b82f6"
                name="Diastolic BP"
              />
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#22c55e"
                name="Heart Rate"
              />
              <Line
                type="monotone"
                dataKey="sugarLevel"
                stroke="#eab308"
                name="Sugar Level"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="row text-center mt-3">
            <div className="col-md-3">
              <Thermometer className="text-danger" /> <b>Temp:</b>{" "}
              {patient.vitalsHistory.at(-1).temperature?.toFixed(1)}°F
            </div>
            <div className="col-md-3">
              <Droplet className="text-primary" /> <b>O₂:</b>{" "}
              {patient.vitalsHistory.at(-1).oxygenSaturation}%
            </div>
            <div className="col-md-3">
              <b>BP:</b> {patient.vitalsHistory.at(-1).systolicBP}/
              {patient.vitalsHistory.at(-1).diastolicBP}
            </div>
            <div className="col-md-3">
              <b>HR:</b> {patient.vitalsHistory.at(-1).heartRate} bpm
            </div>
          </div>
        </div>
      )}

      {/* 🧾 VISIT HISTORY */}
      {hasVisits && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex align-items-center mb-3">
            <Stethoscope className="text-primary me-2" />
            <h4 className="fw-bold mb-0">Visit History</h4>
          </div>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Diagnosis</th>
                  <th>Treatment</th>
                </tr>
              </thead>
              <tbody>
                {patient.visitHistory.map((v, i) => (
                  <tr key={i}>
                    <td>{new Date(v.visitDate).toLocaleDateString()}</td>
                    <td>{v.department}</td>
                    <td>{v.diagnosis}</td>
                    <td>{v.treatment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRESCRIPTIONS */}
      {hasPrescriptions ? (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <div className="d-flex align-items-center mb-3">
            <Pill className="text-success me-2" />
            <h4 className="fw-bold mb-0">
              Uploaded Prescriptions & AI Insights
            </h4>
          </div>

          <div className="row g-3">
            {patient.prescriptions.map((p, index) => (
              <div key={index} className="col-md-6">
                <div className="card border-0 rounded-4 shadow-sm p-3 h-100 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <Stethoscope className="text-primary me-2" />
                      <h6 className="fw-bold mb-0">
                        {p.parsedData?.department || "General Medicine"}
                      </h6>
                    </div>
                    <span className="badge bg-secondary-subtle text-dark">
                      {new Date(p.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mb-1">
                    <User className="me-1" size={14} />
                    <strong>Doctor:</strong>{" "}
                    {p.parsedData?.doctor || "Not specified"}
                  </p>
                  <p className="mb-1">
                    <FileText className="me-1" size={14} />
                    <strong>Diagnosis:</strong>{" "}
                    {p.parsedData?.diagnosis || "Pending"}
                  </p>

                  {p.parsedData?.medicines?.length > 0 && (
                    <div className="mt-3">
                      <ClipboardList className="text-success me-2" size={16} />
                      <strong>Medicines:</strong>
                      <ul className="mt-2 mb-0">
                        {p.parsedData.medicines.map((m, i) => (
                          <li key={i}>
                            {m.name} — {m.dosage || "N/A"}{" "}
                            {m.duration ? `for ${m.duration}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted text-center mt-4">No uploaded reports yet.</p>
      )}
      {/* UPDATE MODAL */}
      {showUpdateModal && (
        <PatientUpdateModal
          patient={patient}
          onClose={() => setShowUpdateModal(false)}
          onUpdated={() => window.location.reload()}
        />
      )}
      {/* ✅ Pass both IDs to chatbot */}
      </div>
      <PatientChatbot patientID={patient.patientID} hospitalID={hospitalID} />

    </>
  );
};

export default PatientDashboard;
