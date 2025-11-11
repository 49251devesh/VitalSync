import { useEffect, useState } from "react";
import axios from "axios";
import { TbStar, TbStarFilled } from "react-icons/tb";
import styles from "../components/Near.module.css";

const Near = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userCoords, setUserCoords] = useState(null);

  // Fetch user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        console.error("Location error", err);
        setError("Please allow location access to see nearby hospitals");
        setLoading(false);
      }
    );
  }, []);

  // Fetch hospitals from backend
  useEffect(() => {
    if (!userCoords) return;

    const fetchHospitals = async () => {
      try {
        // Send user's current coords as query params
        const res = await axios.get("http://localhost:5000/gethospitals", {
          params: { lat: userCoords.lat, lon: userCoords.lon }
        });

        if (res.data.success) {
          setHospitals(res.data.hospitals || []);
        } else {
          setError(res.data.message || "Failed to fetch hospitals");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch hospitals");
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [userCoords]);

  // Open Google Maps directions
  const openDirections = (lat, lon) => {
    if (!lat || !lon) return alert("No coordinates");
    const url = userCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lon}&destination=${lat},${lon}&travelmode=driving`
      : `https://www.google.com/maps?q=${lat},${lon}`;
    window.open(url, "_blank");
  };

  return (
    <div className={styles.container}>
      <h1><img className={styles.img1} src="../public/find.png"/> Nearby Hospitals</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className={styles.cardGrid}>
        {hospitals.map((h, idx) => {
          const lat = h.location?.coordinates?.[1];
          const lon = h.location?.coordinates?.[0];

          return (
            <div key={idx} className={styles.card} onClick={() => openDirections(lat, lon)}>
              <h2>{h.name}</h2>
              <p>{h.address?.line1 || "Address N/A"}</p>
              <p><b>Distance:</b> {h.distance?.toFixed(2)} km</p>
              <p>
                <b>Rating:</b>{" "}
                {Array.from({ length: 5 }, (_, i) =>
                  i < Math.round(h.rating) ? <TbStarFilled key={i} color="gold" /> : <TbStar key={i} color="gray" />
                )} ({h.rating.toFixed(1)})
              </p>
              <p><b>Departments:</b> {h.departments?.join(", ") || "N/A"}</p>
              <p><b>Specialties:</b> {h.specialties?.join(", ") || "N/A"}</p>
              <p><b>Equipment:</b> {h.equipment?.map(e => e.name).join(", ") || "N/A"}</p>
              <p>📞 {h.contact?.phone || "Not available"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Near;
