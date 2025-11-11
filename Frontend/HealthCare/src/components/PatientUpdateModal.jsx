import React, { useState } from "react";
import axios from "axios";
import styles from "./PatientUpdateModal.module.css";

const PatientUpdateModal = ({ patient, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    name: patient.name || "",
    email: patient.email || "",
    password: "",
    diagnosis: "",
    hospitalId: patient.hospital?._id || "",
    doctorId: patient.doctor?._id || "",
  });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (file) data.append("prescription", file);

      const res = await axios.put(
        `http://localhost:5000/api/patients/update/${patient.patientID}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        setMsg("✅ Profile updated successfully!");
        onUpdated?.();
        setTimeout(onClose, 1500);
      } else {
        setMsg(res.data.message || "Something went wrong!");
      }
    } catch (err) {
      console.error("Update error:", err);
      setMsg(err.response?.data?.message || "Server error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.closeBtn}>
          ✕
        </button>

        <h3 className={styles.title}>🩺 Update My Details</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="New Password (optional)"
            value={form.password}
            onChange={handleChange}
          />
          <input
            type="text"
            name="diagnosis"
            placeholder="Diagnosis / Condition"
            value={form.diagnosis}
            onChange={handleChange}
          />
          <input
            type="text"
            name="hospitalId"
            placeholder="Hospital ID"
            value={form.hospitalId}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="doctorId"
            placeholder="Doctor ID (optional)"
            value={form.doctorId}
            onChange={handleChange}
          />

          <label className={styles.fileLabel}>
            Upload New Prescription (optional)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />

          {msg && <p className={styles.message}>{msg}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientUpdateModal;
