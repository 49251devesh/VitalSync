import { useEffect, useState } from "react";
import axios from "axios";
import {
  Stethoscope,
  Users,
  Award,
  Star,
  Activity,
  Calendar,
} from "lucide-react";
import styles from "./DoctorDetailsModal.module.css";

const DoctorDetailsModal = ({ doctor, onClose }) => {
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!doctor?._id) return;
    axios
      .get(`http://localhost:5000/api/doctors/${doctor._id}/patients?limit=5`)
      .then((res) => {
        if (res.data.success) setRecentPatients(res.data.patients);
        else setErr("No recent patients found");
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [doctor]);

  return (
    <div className={styles["modal-backdrop"]} onClick={onClose}>
      <div
        className={styles["modal-container"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ❌ Close Button */}
        <button className={styles["modal-close-btn"]} onClick={onClose}>
          ✕
        </button>

        {/* 🧑‍⚕️ HEADER */}
        <div className={styles["modal-header"]}>
          <div className={styles["modal-avatar"]}>
            <Stethoscope size={36} />
          </div>
          <div>
            <h2 className={styles["modal-doctor-name"]}>
              Dr. {doctor.name || "Unknown"}
            </h2>
            <div className={styles["modal-doctor-specialization"]}>
              {doctor.specialization || doctor.department || "General Medicine"}
            </div>
          </div>
        </div>

        <hr className={styles["divider"]} />

        {/* 📊 METRICS SECTION */}
        <div className={styles["modal-metrics"]}>
          <div className={`${styles["modal-metric"]} ${styles["metric-blue"]}`}>
            <Activity size={20} color="#1E40AF" />
            <div className={styles["metric-label"]}>EXPERIENCE</div>
            <div className={styles["metric-value"]}>
              {doctor.experience || "N/A"} years
            </div>
          </div>

          <div className={`${styles["modal-metric"]} ${styles["metric-green"]}`}>
            <Users size={20} color="#047857" />
            <div className={styles["metric-label"]}>PATIENTS TREATED</div>
            <div className={styles["metric-value"]}>
              {doctor.patientsTreated || 0}
            </div>
          </div>

          <div className={`${styles["modal-metric"]} ${styles["metric-orange"]}`}>
            <Award size={20} color="#B45309" />
            <div className={styles["metric-label"]}>DEPARTMENT</div>
            <div
              className={`${styles["metric-value"]} ${styles["metric-highlight"]}`}
            >
              {doctor.department || doctor.specialization || "N/A"}
            </div>
          </div>

          <div className={`${styles["modal-metric"]} ${styles["metric-purple"]}`}>
            <Star size={20} color="#7C3AED" />
            <div className={styles["metric-label"]}>RATING</div>
            <div className={styles["metric-value"]}>
              {doctor.rating || "4.5"} ⭐
            </div>
          </div>
        </div>

        {/* 🧾 PROFESSIONAL SUMMARY */}
        <div className={styles["modal-additional-info"]}>
          <h4 className={styles["summary-title"]}>Professional Summary</h4>
          <p>
            {doctor.name} is a highly qualified{" "}
            {doctor.specialization || doctor.department || "medical"} specialist
            with {doctor.experience || "several"} years of experience. Known for
            providing exceptional patient care, accurate diagnosis, and
            maintaining high standards in medical practice.
          </p>
        </div>

        {/* 🩺 RECENT PATIENTS */}
        <h4 className={styles["summary-title"]}>Recent Patients</h4>

        {loading && (
          <div className={styles.loading}>Loading recent patients...</div>
        )}
        {err && <div className={styles.error}>❌ {err}</div>}

        {!loading && !err && recentPatients.length > 0 && (
          <div className={styles["recent-patient-list"]}>
            {recentPatients.map((p) => (
              <div key={p._id} className={styles["recent-patient-card"]}>
                <div>
                  <div className={styles["recent-patient-name"]}>
                    {p.name || "Unnamed Patient"}
                  </div>
                  <div className={styles["recent-patient-meta"]}>
                    {p.gender}, {p.age} yrs
                  </div>
                  <div className={styles["recent-patient-meta"]}>
                    Diagnosis: {p.diagnosis || "General Checkup"}
                  </div>
                </div>
                <div className={styles["patient-info"]}>
                  <Calendar size={14} color="#059669" />
                  <span>
                    {p.visitDate
                      ? new Date(p.visitDate).toLocaleDateString()
                      : "Recent Visit"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🔘 ACTION BUTTON */}
        <button className={styles["modal-action-btn"]} onClick={onClose}>
          Close Details
        </button>
      </div>
    </div>
  );
};

export default DoctorDetailsModal;
