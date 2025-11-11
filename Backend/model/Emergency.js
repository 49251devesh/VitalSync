// models/Emergency.js
const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // Hospitals suggested by algorithm
    nearbyHospitals: [
      {
        hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
        distance: Number,
        matchScore: Number, // how well it fits condition/equipment
      },
    ],

    // Hospital finally assigned
    assignedHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
    },

    conditionKeywords: [String], // extracted from description
    description: String, // original free-text condition
    patientLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },

    status: {
      type: String,
      enum: ["Active", "Dispatched", "Resolved", "Cancelled"],
      default: "Active",
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emergency", emergencySchema);
