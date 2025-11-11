import React from "react";
import { useNavigate } from "react-router-dom";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light"
      style={{
        background:
          "linear-gradient(135deg, rgba(240,248,255,0.9), rgba(220,245,255,0.9))",
      }}
    >
      {/* HEADER */}
      <h2 className="mb-5 fw-bold text-primary">Welcome to VitalSync 🩺</h2>

      {/* BUTTON CONTAINER */}
      <div className="d-flex gap-4">
        {/* PATIENT */}
        <button
          onClick={() => navigate("/patient-login")}
          className="btn btn-lg text-white px-5 py-3 rounded-pill shadow-sm"
          style={{
            backgroundColor: "#1E88E5",
            border: "none",
            fontWeight: "600",
            minWidth: "160px",
          }}
        >
          Patient
        </button>

        {/* DOCTOR */}
        <button
          onClick={() => navigate("/patient-register")}
          className="btn btn-lg text-white px-5 py-3 rounded-pill shadow-sm"
          style={{
            backgroundColor: "#2E7D32",
            border: "none",
            fontWeight: "600",
            minWidth: "160px",
          }}
        >
          Doctor
        </button>
      </div>

      <p className="text-muted mt-5" style={{ fontSize: "0.9rem" }}>
        Choose your role to continue
      </p>
    </div>
  );
};

export default RoleSelection;
