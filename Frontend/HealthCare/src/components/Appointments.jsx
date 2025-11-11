import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";

const Appointments = () => {
  const { id: patientID } = useParams();
  const location = useLocation();
  const token = location.state?.token;
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // 🧾 Fetch all appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/appointments/my/${patientID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          setAppointments(res.data.appointments);
        } else {
          setError(res.data.message || "No appointments found.");
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Unable to load appointments.");
      }
    };

    fetchAppointments();
  }, [patientID, token]);

  // 🔄 Update appointment status
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setUpdatingId(appointmentId);
      const res = await axios.put(
        `http://localhost:5000/api/appointments/update-status/${appointmentId}`,
        { status: newStatus }
      );

      if (res.data.success) {
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === appointmentId ? { ...a, status: newStatus } : a
          )
        );
      } else {
        alert(res.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("⚠️ Status update failed:", err);
      alert("Error updating appointment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (error)
    return (
      <div className="text-center mt-5 text-danger fw-bold">
        ⚠️ {error}
      </div>
    );

  return (
    <div className="container py-4">
      <h3 className="text-center mb-4">📋 My Appointments</h3>

      {appointments.length === 0 ? (
        <p className="text-center text-muted">No appointments yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Doctor</th>
                <th>Hospital</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td>{a.timeSlot}</td>
                  <td>Dr. {a.doctor?.name || "N/A"}</td>
                  <td>{a.hospital?.name || "N/A"}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        a.status === "confirmed"
                          ? "success"
                          : a.status === "pending"
                          ? "warning"
                          : a.status === "completed"
                          ? "primary"
                          : "secondary"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={a.status}
                      disabled={updatingId === a._id}
                      onChange={(e) =>
                        handleStatusChange(a._id, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Appointments;
