import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../components/Sos.module.css";
import { useNavigate } from "react-router-dom";
import { TbHeartbeat } from "react-icons/tb";

const Sos = () => {
  const [patientCondition, setPatientCondition] = useState("");
  const [patientLocation, setPatientLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [locationError, setLocationError] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch location + reverse geocode
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPatientLocation({ latitude, longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setAddress(data.display_name || "Unknown location");
        } catch {
          setAddress("Unknown location");
        }
      },
      () => setLocationError("⚠️ Please allow location access to continue.")
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!patientCondition.trim()) {
      setMessage("❌ Please describe the patient’s condition.");
      setMessageType("error");
      return;
    }

    if (!patientLocation) {
      setMessage("❌ Waiting for your location. Please allow access.");
      setMessageType("error");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/newlog", {
        patientCondition,
        location: {
          latitude: patientLocation.latitude,
          longitude: patientLocation.longitude,
          address,
        },
      });

      if (res.data.success) {
        setMessage("✅ Condition logged successfully!");
        setMessageType("success");
        setPatientCondition("");
        navigate("/available");
      } else {
        setMessage(`❌ ${res.data.message || "Something went wrong"}`);
        setMessageType("error");
      }
    } catch (err) {
      console.error("Axios error:", err.message);
      setMessage("❌ Server not reachable. Check network or backend.");
      setMessageType("error");
    }
  };

  return (
    <>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Back
      </button>

      <div className={styles.container}>
        <div className={styles.dia}>
          <img src="/describe.png" alt="ambulance" className={styles.des} />
        </div>

        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.logo}>
              <TbHeartbeat size={28} />
            </span>
            <h1 className={styles.heading}>Describe Patient Condition</h1>
            <p className={styles.caption}>
              Provide a clear description of the emergency or symptoms.
            </p>
          </div>

          {locationError && <p className={styles.error}>{locationError}</p>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <textarea
              className={styles.textarea}
              placeholder="Ex: Patient unconscious, breathing irregular, possible trauma..."
              value={patientCondition}
              onChange={(e) => setPatientCondition(e.target.value)}
            />

            <button type="submit" className={styles.button}>
              Submit Condition
            </button>
          </form>

          {message && (
            <p
              className={`${styles.message} ${
                messageType === "success" ? styles.success : styles.error
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Sos;
