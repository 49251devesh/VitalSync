import { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { getFingerprintId } from "../utils/getFingerprint";
import styles from "./AddPatient.module.css";

const AddPatient = ({ hospitalId, doctors = [], onClose, onPatientAdded }) => {
  const [mode, setMode] = useState("register");
  const [patientId, setPatientId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    doctorId: "",
    diagnosis: "",
  });
  const [file, setFile] = useState(null);
  const [fingerprintFile, setFingerprintFile] = useState(null); // 👆 fingerprint image upload
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleFingerprintFile = (e) => setFingerprintFile(e.target.files[0]);

  // ✅ Register / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const fingerprintId = await getFingerprintId();
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));
      data.append("hospitalId", hospitalId);
      data.append("fingerprintId", fingerprintId);
      if (file) data.append("prescription", file);
      if (fingerprintFile) data.append("fingerprintFile", fingerprintFile); // 👈 attach image

      let url = "http://localhost:5000/api/patients/register";
      let method = "post";

      if (mode === "update" && patientId) {
        url = `http://localhost:5000/api/patients/update/${patientId}`;
        method = "put";
      }

      const res = await axios({
        method,
        url,
        data,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        const newId = res.data.patientID || res.data.patient?.patientID || patientId;
        setPatientId(newId);
        setMsg({
          type: "success",
          text:
            mode === "register"
              ? `✅ Registered successfully! Patient ID: ${newId}`
              : "✅ Patient record updated successfully!",
        });
        onPatientAdded?.();
      } else {
        setMsg({ type: "error", text: res.data.message || "Operation failed" });
      }
    } catch (err) {
      console.error("Error:", err);
      setMsg({ type: "error", text: err.response?.data?.message || "Server error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={20} />
        </button>

        <div className="flex justify-center mb-3">
          <button
            onClick={() => setMode("register")}
            className={mode === "register" ? "btn btn-primary" : "btn btn-outline-primary"}
          >
            ➕ Register
          </button>
          <button
            onClick={() => setMode("update")}
            className={mode === "update" ? "btn btn-success" : "btn btn-outline-success"}
            style={{ marginLeft: "8px" }}
          >
            ✏️ Update
          </button>
        </div>

        {mode === "update" && (
          <input
            type="text"
            placeholder="Enter Patient ID to update"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="form-control mb-3"
            required
          />
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          <select name="doctorId" value={formData.doctorId} onChange={handleChange}>
            <option value="">Assign Doctor (optional)</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name} {doc.specialization && `(${doc.specialization})`}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="diagnosis"
            placeholder="Diagnosis / Condition"
            value={formData.diagnosis}
            onChange={handleChange}
          />

          <label>Upload Prescription / Report</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="form-control mb-2"
          />

          <label>Upload Fingerprint Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFingerprintFile}
            className="form-control mb-3"
          />

          {msg.text && (
            <p className={msg.type === "success" ? styles.success : styles.error}>
              {msg.text}
            </p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading
              ? "Processing..."
              : mode === "register"
              ? "Register Patient"
              : "Update Patient"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
  