import React, { useState, useEffect } from "react";
import axios from "axios";
import { getFingerprintId } from "../utils/getFingerprint";
import { useNavigate } from "react-router-dom";
import styles from "../components/PatientLogin.module.css";

const PatientLogin = () => {
  const [form, setForm] = useState({ patientID: "" });
  const [fingerprintId, setFingerprintId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Validation: require either Patient ID or fingerprint
    if (!form.patientID && !fingerprintId) {
      setError("Please enter your Patient ID or use your fingerprint to login.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/patients/login", {
        patientID: form.patientID || null,
        fingerprintId,
      });

      if (res.data.success) {
        // ✅ Navigate to dashboard on success
        navigate(`/dashboard/${res.data.patient.patientID}`, {
          state: { token: res.data.token, patient: res.data.patient },
        });
      } else {
        setError(res.data.message || "Invalid Patient ID or Fingerprint");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !form.patientID && !fingerprintId;

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <h3 className="text-center mb-4">🔐 Patient Login</h3>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            name="patientID"
            placeholder="Enter Patient ID"
            value={form.patientID}
            onChange={handleChange}
            className="form-control mb-3"
            required
          />

          {isDisabled && (
            <p className="text-danger text-center small">
              You must enter your Patient ID or use your fingerprint to proceed.
            </p>
          )}

          {error && <p className="text-danger text-center">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || isDisabled}
          >
            {loading ? "Authenticating..." : "Login via ID or Fingerprint"}
          </button>
        </form>

        {fingerprintId && (
          <p className="text-center text-secondary small mt-3">
            Device ID: <code>{fingerprintId.slice(0, 10)}...</code>
          </p>
        )}
      </div>
    </div>
  );
};

export default PatientLogin;
