const express = require("express");
const router = express.Router();

const Appointment = require("../model/Appointment");
const Patient = require("../model/patient");
const Doctor = require("../model/Doctor");
const Hospital = require("../model/Hospital");
const { sendAppointmentEmail } = require("../utils/emailServide1");

/* ============================================================
   📅 BOOK AN APPOINTMENT (Stores custom IDs directly)
   ============================================================ */
router.post("/book", async (req, res) => {
  try {
    const { patientID, hospitalId, doctorId, date, timeSlot, reason, email } =
      req.body;

    if (!patientID || !hospitalId || !doctorId || !date || !timeSlot) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Verify entities
    const patient = await Patient.findOne({ patientID });
    const doctor = await Doctor.findOne({ doctorId });
    const hospital = await Hospital.findOne({ hospitalId });

    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });
    if (!doctor)
      return res.status(404).json({ success: false, message: "Doctor not found" });
    if (!hospital)
      return res.status(404).json({ success: false, message: "Hospital not found" });

    // ✅ Store custom IDs directly (no ObjectIds)
    const appointment = new Appointment({
      patientID,
      doctorId,
      hospitalId,
      date,
      timeSlot,
      reason,
      status: "pending",
    });

    await appointment.save();

    // 📧 Optional email
    try {
      await sendAppointmentEmail(email, {
        patientName: patient.name,
        doctorName: doctor.name,
        hospitalName: hospital.name,
        date,
        timeSlot,
      });
    } catch (emailErr) {
      console.error("⚠️ Email sending failed:", emailErr.message);
    }

    return res.json({
      success: true,
      message: "Appointment booked successfully!",
      appointment,
    });
  } catch (err) {
    console.error("❌ Booking Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while booking appointment",
      error: err.message,
    });
  }
});

/* ============================================================
   📋 VIEW PATIENT’S APPOINTMENTS (By patientID)
   ============================================================ */
router.get("/my/:patientID", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientID: req.params.patientID,
    });

    if (!appointments.length)
      return res.json({ success: true, appointments: [] });

    // Enrich doctor & hospital info
    const enrichedAppointments = await Promise.all(
      appointments.map(async (a) => {
        const doctor = await Doctor.findOne({ doctorId: a.doctorId }).select(
          "name specialization"
        );
        const hospital = await Hospital.findOne({ hospitalId: a.hospitalId }).select(
          "name address"
        );
        return {
          ...a._doc,
          doctor,
          hospital,
        };
      })
    );

    return res.json({ success: true, appointments: enrichedAppointments });
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching appointments",
      error: err.message,
    });
  }
});

/* ============================================================
   🔄 UPDATE APPOINTMENT STATUS (By patientID or _id)
   ============================================================ */
router.put("/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    let appointment;

    // Case 1: valid ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      appointment = await Appointment.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
    } else {
      // Case 2: find by patientID
      appointment = await Appointment.findOneAndUpdate(
        { patientID: id },
        { status },
        { new: true }
      );
    }

    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });

    return res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment,
    });
  } catch (err) {
    console.error("❌ Update Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while updating status",
      error: err.message,
    });
  }
});

module.exports = router;
