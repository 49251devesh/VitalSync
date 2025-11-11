import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../components/AppointmentBooking.module.css";

const AppointmentBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.token;
  const patientID = location.state?.patientID;

  const [step, setStep] = useState("hospital");
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [form, setForm] = useState({
    date: "",
    timeSlot: "",
    reason: "",
    email: "",
    password: "",
  });
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🏥 Fetch hospitals (uses hospitalId)
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/hospitals/all");
        if (res.data.success) setHospitals(res.data.hospitals);
        else setError("No hospitals found.");
      } catch (err) {
        console.error("Error fetching hospitals:", err);
        setError("Unable to fetch hospitals from server.");
      }
    };
    fetchHospitals();
  }, []);

  // 🔹 When hospital selected → fetch its doctors (by hospitalId)
  const handleSelectHospital = async (hospital) => {
    setSelectedHospital(hospital);
    setStep("doctor");
    try {
      const res = await axios.get(
        `http://localhost:5000/api/doctors/by-hospital/${hospital.hospitalId}`
      );
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setStep("form");
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // 📅 Submit appointment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/appointments/book", {
        patientID,
        hospitalId: selectedHospital.hospitalId, // ✅ use hospitalId
        doctorId: selectedDoctor.doctorId, // ✅ use doctorId
        ...form,
      });

      if (res.data.success) {
        setAppointment(res.data.appointment);
        setStep("summary");
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError("Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------- UI ------------------------------- */
  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <h2>📅 Appointment Booking</h2>

        {error && <p className="text-danger text-center">{error}</p>}

        {/* 1️⃣ Select Hospital */}
        {step === "hospital" && (
          <>
            <h4>Available Hospitals</h4>
            {hospitals.length === 0 && <p>No hospitals available.</p>}
            <div className={styles.cardGrid}>
              {hospitals.map((h) => (
                <div
                  key={h.hospitalId}
                  className={styles.card}
                  onClick={() => handleSelectHospital(h)}
                >
                  <h5>{h.name}</h5>
                  <p>
                    {h.address?.city
                      ? `${h.address.city}, ${h.address.state || ""}`
                      : "Address not available"}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 2️⃣ Select Doctor */}
        {step === "doctor" && (
          <>
            <button onClick={() => setStep("hospital")} className="btn btn-link">
              ← Back to Hospitals
            </button>
            <h4>Doctors in {selectedHospital.name}</h4>
            {doctors.length === 0 && <p>No doctors available.</p>}
            <div className={styles.cardGrid}>
              {doctors.map((d) => (
                <div
                  key={d.doctorId}
                  className={styles.card}
                  onClick={() => handleSelectDoctor(d)}
                >
                  <h5>Dr. {d.name}</h5>
                  <p>{d.specialization}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 3️⃣ Booking Form */}
        {step === "form" && (
          <>
            <button onClick={() => setStep("doctor")} className="btn btn-link">
              ← Back to Doctors
            </button>
            <h4>Book Appointment with Dr. {selectedDoctor.name}</h4>
            <form onSubmit={handleSubmit} className="p-3">
              <input
                type="date"
                name="date"
                className="form-control mb-2"
                value={form.date}
                onChange={handleChange}
                required
              />
              <input
                type="time"
                name="timeSlot"
                className="form-control mb-2"
                value={form.timeSlot}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="reason"
                placeholder="Reason for visit"
                className="form-control mb-2"
                value={form.reason}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your email"
                className="form-control mb-2"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="form-control mb-3"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={loading}
              >
                {loading ? "Booking..." : "Confirm Appointment"}
              </button>
            </form>
          </>
        )}

        {/* 4️⃣ Summary */}
        {step === "summary" && appointment && (
          <div className="text-center">
            <h4>✅ Appointment Confirmed!</h4>
            <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
            <p><strong>Hospital:</strong> {selectedHospital.name}</p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(appointment.date).toLocaleDateString()}
            </p>
            <p><strong>Time:</strong> {appointment.timeSlot}</p>
            <p>📧 Confirmation email sent to {form.email}</p>

            <button
              className="btn btn-primary mt-3"
              onClick={() =>
                navigate(`/appointments/${patientID}`, { state: { token } })
              }
            >
              View My Appointments →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;
