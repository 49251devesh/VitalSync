import { useState } from "react";
import axios from "axios";
import styles from "./AddDoc.module.css";
import { X } from "lucide-react";

const AddDoc = ({ hospitalId, onClose, onDoctorAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    department: "",
    experience: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post("http://localhost:5000/api/doctors/add", {
        ...formData,
        hospitalId,
      });

      if (res.data.success) {
        setSuccess("Doctor added successfully!");
        onDoctorAdded();
        setTimeout(() => onClose(), 1000);
      } else {
        setError(res.data.message || "Failed to add doctor");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
        <h2 className={styles.title}>Add New Doctor</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <input
              type="text"
              name="name"
              placeholder="Doctor Name"
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
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="specialization"
              placeholder="Specialization (e.g. Cardiology)"
              value={formData.specialization}
              onChange={handleChange}
            />
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={formData.department}
              onChange={handleChange}
            />
            <input
              type="number"
              name="experience"
              placeholder="Experience (years)"
              value={formData.experience}
              onChange={handleChange}
            />
            <input
              type="text"
              name="contactPhone"
              placeholder="Phone Number"
              value={formData.contactPhone}
              onChange={handleChange}
            />
            <input
              type="email"
              name="contactEmail"
              placeholder="Contact Email"
              value={formData.contactEmail}
              onChange={handleChange}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Adding..." : "Add Doctor"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDoc;
