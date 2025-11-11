const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientID: { type: String, required: true },      // ✅ custom patient ID
  doctorId: { type: String, required: true },       // ✅ custom doctor ID
  hospitalId: { type: String, required: true },     // ✅ custom hospital ID
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
