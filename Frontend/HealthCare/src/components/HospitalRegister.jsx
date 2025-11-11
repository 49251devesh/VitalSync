import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Hospital,
  UserCog,
  KeyRound,
  LogIn,
  Lock,
} from "lucide-react";

const HospitalRegister = () => {
  const [role, setRole] = useState("hospital");
  const [formData, setFormData] = useState({
    hospitalName: "",
    hospitalId: "",
    doctorId: "",
    email: "",
    password: "",
    mpin: "",
  });
  const [msg, setMsg] = useState("");
  const [step, setStep] = useState(1); // 1 = Login, 2 = mPIN
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      // 🏥 Hospital admin login
      if (role === "hospital") {
        const res = await axios.get(
          `http://localhost:5000/api/hospitals?code=${formData.hospitalId}`
        );
        if (res.data.length === 0) throw new Error("Hospital not found");
        navigate("/hospital-dashboard", { state: { data: res.data[0], role } });
      }

      // 👨‍⚕️ Doctor login — match hospital + doctor info
      else if (role === "doctor") {
        const res = await axios.post("http://localhost:5000/api/doctors/verify", {
          hospitalName: formData.hospitalName,
          hospitalId: formData.hospitalId,
          doctorId: formData.doctorId,
        });
        if (res.data.success) {
          setStep(2);
          setMsg("✅ Doctor ID verified. Enter mPIN to continue.");
        } else {
          setMsg("❌ Invalid credentials. Please try again.");
        }
      }

      // 👩‍⚕️ Patient login
      else if (role === "patient") {
        const res = await axios.post("http://localhost:5000/api/patients/login", {
          email: formData.email,
          password: formData.password,
        });
        navigate("/patient-dashboard", { state: { data: res.data.patient, role } });
      }
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.message || "Login failed"));
    }
  };

  // 🔐 Handle mPIN verification
  const handleMPIN = (e) => {
    e.preventDefault();
    if (formData.mpin === "1234") {
      setMsg("✅ Verified successfully!");
      navigate("/doctor-dashboard", {
        state: {
          data: {
            name: "Dr. " + formData.doctorId,
            hospital: formData.hospitalName,
            hospitalId: formData.hospitalId,
          },
          role: "doctor",
        },
      });
    } else {
      setMsg("❌ Incorrect mPIN. Try again.");
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg border-0 rounded-4 p-4" style={{ width: "28rem" }}>
        <div className="text-center mb-4">
          <h3 className="fw-bold text-primary mb-1">
            {step === 1 ? "Healthcare Portal Login" : "🔒 Doctor mPIN Verification"}
          </h3>
          <p className="text-muted small">
            {step === 1
              ? "Select your role and sign in securely."
              : "Enter your 4-digit mPIN to access your dashboard."}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleLogin}>
            {/* Role Dropdown */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Select Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="hospital">🏥 Hospital Admin</option>
                <option value="doctor">👨‍⚕️ Doctor</option>
                <option value="patient">🧍 Patient</option>
              </select>
            </div>

            {/* Hospital Fields for Doctor */}
            {role === "doctor" && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Hospital Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <Hospital />
                    </span>
                    <input
                      name="hospitalName"
                      type="text"
                      className="form-control"
                      placeholder="Enter Hospital Name"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Hospital ID</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <KeyRound />
                    </span>
                    <input
                      name="hospitalId"
                      type="text"
                      className="form-control"
                      placeholder="Enter Hospital ID"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Doctor ID</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <UserCog />
                    </span>
                    <input
                      name="doctorId"
                      type="text"
                      className="form-control"
                      placeholder="Enter Doctor ID"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Patient Fields */}
            {role === "patient" && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="Enter Patient Email"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    name="password"
                    type="password"
                    className="form-control"
                    placeholder="Enter Password"
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Hospital Admin Fields */}
            {role === "hospital" && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Hospital Name</label>
                  <input
                    name="hospitalName"
                    type="text"
                    className="form-control"
                    placeholder="Enter Hospital Name"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Hospital ID</label>
                  <input
                    name="hospitalId"
                    type="text"
                    className="form-control"
                    placeholder="Enter Hospital ID"
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            <button className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2">
              <LogIn size={18} /> Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleMPIN}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Enter mPIN</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Lock />
                </span>
                <input
                  name="mpin"
                  type="password"
                  maxLength={4}
                  className="form-control text-center fw-bold"
                  placeholder="••••"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button className="btn btn-success w-100 fw-semibold">
              Verify & Continue
            </button>
          </form>
        )}

        {msg && <p className="text-center text-danger mt-3 small">{msg}</p>}
      </div>
    </div>
  );
};

export default HospitalRegister;
