import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./DoctorLanding.module.css";

const allDepartments = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Emergency",
  "Pediatrics",
  "Dermatology",
  "ENT",
  "General Medicine",
  "Oncology",
  "Gastroenterology",
  "Urology",
  "Psychiatry",
];

const allSpecialties = [
  "Heart",
  "Brain",
  "Bones",
  "Trauma",
  "Children",
  "Skin",
  "Kidney",
  "Cancer",
  "Mental Health",
  "Lungs",
  "Rehabilitation",
  "Eye",
];

const DoctorLanding = () => {
  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState("");
  const [formData, setFormData] = useState({
    hospitalId: "",
    name: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    departments: [],
    specialties: [],
  });

  const [showDropdown, setShowDropdown] = useState({ dep: false, spec: false });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleDropdown = (type) =>
    setShowDropdown((prev) => ({ ...prev, [type]: !prev[type] }));

  const addTag = (type, value) => {
    if (!formData[type].includes(value)) {
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], value],
      }));
    }
  };

  const removeTag = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((v) => v !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      if (mode === "register") {
        const res = await axios.post(
          "http://localhost:5000/api/hospitals/register",
          {
            name: formData.name,
            address: { city: formData.city, state: formData.state },
            contact: { phone: formData.phone, email: formData.email },
            departments: formData.departments,
            specialties: formData.specialties,
          }
        );
        if (res.data.success) {
          setMsg(
            `✅ Registered successfully! Hospital ID sent to ${formData.email}. Redirecting to login...`
          );
          setTimeout(() => setMode("login"), 4000);
        } else {
          setMsg("❌ Registration failed.");
        }
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/hospitals/login",
          {
            hospitalId: formData.hospitalId,
            name: formData.name,
          }
        );
        if (res.data.success) {
          console.log("Login API response:", res.data);
          console.log(
            "Hospital data being sent to dashboard:",
            res.data.hospital
          );

          navigate("/hospital-dashboard", {
            state: { data: res.data.hospital },
          });
        } else setMsg("❌ Invalid Hospital ID or Name");
      }
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.message || "Server error"));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.horizontalCard}>
        <div className={styles.left}>
          <h2 className={styles.title}>🏥 Hospital Access Portal</h2>
          <p className={styles.subtitle}>
            Register or log in to manage doctors & patients
          </p>

          <div className={styles.toggleButtons}>
            <button
              onClick={() => setMode("login")}
              className={`${styles.toggleButton} ${
                mode === "login" ? styles.active : ""
              }`}
            >
              🔐 Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`${styles.toggleButton} ${
                mode === "register" ? styles.active : ""
              }`}
            >
              🏗️ Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {mode === "login" ? (
              <>
                <input
                  name="hospitalId"
                  placeholder="Enter Hospital ID"
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
                <input
                  name="name"
                  placeholder="Hospital Name"
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </>
            ) : (
              <>
                <div className={styles.row}>
                  <input
                    name="name"
                    placeholder="Hospital Name"
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                  <input
                    name="city"
                    placeholder="City"
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.row}>
                  <input
                    name="state"
                    placeholder="State"
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                  <input
                    name="phone"
                    placeholder="Phone"
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <input
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  className={styles.input}
                />

                {/* Dropdowns */}
                <div className={styles.row}>
                  <div className={styles.dropdownContainer}>
                    <label className={styles.label}>Departments</label>
                    <div
                      className={styles.dropdownBox}
                      onClick={() => toggleDropdown("dep")}
                    >
                      Select Departments 
                    </div>
                    {showDropdown.dep && (
                      <div className={styles.dropdownMenu}>
                        {allDepartments.map((dep) => (
                          <div
                            key={dep}
                            className={styles.dropdownItem}
                            onClick={() => addTag("departments", dep)}
                          >
                            {dep}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={styles.tags}>
                      {formData.departments.map((d) => (
                        <span key={d} className={styles.tag}>
                          {d}{" "}
                          <button onClick={() => removeTag("departments", d)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.dropdownContainer}>
                    <label className={styles.label}>Specialties</label>
                    <div
                      className={styles.dropdownBox}
                      onClick={() => toggleDropdown("spec")}
                    >
                      Select Specialties 
                    </div>
                    {showDropdown.spec && (
                      <div className={styles.dropdownMenu}>
                        {allSpecialties.map((sp) => (
                          <div
                            key={sp}
                            className={styles.dropdownItem}
                            onClick={() => addTag("specialties", sp)}
                          >
                            {sp}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={styles.tags}>
                      {formData.specialties.map((s) => (
                        <span key={s} className={styles.tag}>
                          {s}{" "}
                          <button onClick={() => removeTag("specialties", s)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className={styles.button}>
              {mode === "register" ? "Register Hospital" : "Login"}
            </button>
          </form>
          {msg && <p className={styles.message}>{msg}</p>}
        </div>
      </div>
    </div>
  );
};

export default DoctorLanding;
