import React, { useState, useEffect } from "react";
import axios from "axios";
import { getFingerprintId } from "../utils/getFingerprint";

const PatientRegister = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    hospitalId: "",
    doctorId: "",
  });
  const [file, setFile] = useState(null);
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [fingerprintId, setFingerprintId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🧬 Auto-get fingerprint ID
  useEffect(() => {
    (async () => {
      try {
        const id = await getFingerprintId();
        setFingerprintId(id);
      } catch (err) {
        console.error("Fingerprint Error:", err);
      }
    })();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleFingerprintFile = (e) => setFingerprintFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Validation check
    if (!form.name || !form.password || !form.hospitalId) {
      setError("Please fill all required fields before submitting.");
      setLoading(false);
      return;
    }

    try {
      // Prepare form data
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));
      formData.append("fingerprintId", fingerprintId);
      if (file) formData.append("prescription", file);
      if (fingerprintFile) formData.append("fingerprintFile", fingerprintFile);

      // Send request
      const res = await axios.post(
        "http://localhost:5000/api/patients/register",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        alert(`✅ Registered Successfully! Your Patient ID: ${res.data.patientID}`);
        window.location.href = `/dashboard/${res.data.patientID}`;
      } else {
        setError(res.data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container mt-5 p-4 bg-light rounded shadow"
      style={{ maxWidth: "500px" }}
    >
      <h3 className="text-center mb-4">🩺 Patient Registration</h3>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="form-control mb-2"
          required
        />
        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="form-control mb-2"
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          className="form-control mb-2"
          required
        />
        <input
          name="hospitalId"
          placeholder="Hospital ID"
          value={form.hospitalId}
          onChange={handleChange}
          className="form-control mb-2"
          required
        />
        <input
          name="doctorId"
          placeholder="Doctor ID (optional)"
          value={form.doctorId}
          onChange={handleChange}
          className="form-control mb-2"
        />

        <label>Upload Prescription / Report</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="form-control mb-2"
          required
        />

        <label>Upload Fingerprint Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFingerprintFile}
          className="form-control mb-3"
        />

        {fingerprintId && (
          <p className="text-center text-secondary small">
            Device ID: <code>{fingerprintId.slice(0, 10)}...</code>
          </p>
        )}

        {error && <p className="text-danger text-center">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Processing..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default PatientRegister;
