const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Doctor = require("../model/Doctor");
const Hospital = require("../model/Hospital");
const { getDoctorPatients } = require("../controllers/doctorController");

/**
 * =========================================
 * GET: Doctors by Hospital ID (custom hospitalId)
 * =========================================
 * ⚠️ Keep this ABOVE "/:doctorId/patients"
 *    to avoid Express route conflicts.
 */
router.get("/by-hospital/:hospitalId", async (req, res) => {
  try {
    const { hospitalId } = req.params;

    console.log("📡 Fetching doctors for hospital:", hospitalId);

    // 🏥 Find hospital using custom hospitalId (e.g. "HOSP-123ABC")
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) {
      return res
        .status(404)
        .json({ success: false, message: "Hospital not found" });
    }

    // 👨‍⚕️ Fetch all doctors linked to this hospital
    const doctors = await Doctor.find({ hospital: hospital._id }).select(
      "doctorId name specialization department experience"
    );

    return res.json({ success: true, doctors });
  } catch (error) {
    console.error("❌ Error fetching doctors by hospital:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching doctors",
      error: error.message,
    });
  }
});

/**
 * ==============================
 * GET: Fetch a Doctor’s Patients
 * ==============================
 */
router.get("/:doctorId/patients", getDoctorPatients);

/**
 * ==============================
 * POST: Add New Doctor
 * ==============================
 */
router.post("/add", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      department,
      experience,
      contactPhone,
      contactEmail,
      hospitalId, // ✅ custom hospitalId (HOSP-XXXX)
    } = req.body;

    // 🧾 Validate required fields
    if (!name || !email || !password || !hospitalId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // 🏥 Find hospital using custom hospitalId
    const hospital =
      (await Hospital.findOne({ hospitalId })) ||
      (await Hospital.findById(hospitalId));

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (!hospital) {
      return res
        .status(404)
        .json({ success: false, message: "Hospital not found" });
    }

    // 🧑‍⚕️ Check for duplicate email
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this email already exists",
      });
    }

    // 🔢 Generate custom Doctor ID
    const doctorId = `${hospital.hospitalId}-DOC-${Math.floor(
      Math.random() * 100000
    )}`;

    // 🧩 Create new doctor
    const doctor = new Doctor({
      name,
      email,
      password,
      specialization,
      department,
      experience,
      hospital: hospital._id,
      hospitalName: hospital.name,
      hospitalCode: hospital.hospitalId,
      doctorId,
      contact: {
        phone: contactPhone || "",
        email: contactEmail || email, // fallback
      },
    });

    // 💾 Save doctor
    await doctor.save();

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      doctor,
    });
  } catch (error) {
    console.error("❌ Error adding doctor:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding doctor",
      error: error.message,
    });
  }
});

module.exports = router;
