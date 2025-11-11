const express = require("express");
const mongoose = require("mongoose"); // ✅ Required for ObjectId validation
const router = express.Router();

const Hospital = require("../model/Hospital");
const Doctor = require("../model/Doctor");
const Patient = require("../model/patient");
const { sendHospitalRegistrationMail } = require("../utils/sendMail");

/* ============================================================
   🏥 REGISTER HOSPITAL
   ============================================================ */
router.post("/register", async (req, res) => {
  try {
    const { name, address, contact, departments, specialties } = req.body;

    if (!name || !address?.city || !address?.state) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // 🩺 Check if hospital already exists in the same city
    const exists = await Hospital.findOne({
      name,
      "address.city": address.city,
    });

    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Hospital already registered" });
    }

    // 🏥 Create new hospital entry
    const newHospital = new Hospital({
      name,
      address,
      contact,
      departments,
      specialties,
    });

    await newHospital.save();

    // 🆔 Generate hospital ID from MongoDB _id
    const hospitalId = `HOSP-${newHospital._id
      .toString()
      .slice(-6)
      .toUpperCase()}`;

    newHospital.hospitalId = hospitalId;
    await newHospital.save();

    // 📧 Send registration email if email is present
    if (contact?.email) {
      try {
        console.log("📧 Sending registration email to:", contact.email);
        await sendHospitalRegistrationMail({
          to: contact.email,
          name: newHospital.name,
          hospitalId,
        });
        console.log(`✅ Email sent successfully to ${contact.email}`);
      } catch (err) {
        console.error("❌ Email sending failed:", err.message);
      }
    }

    res.json({
      success: true,
      message:
        "Hospital registered successfully! Login details sent via email.",
      hospitalId,
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   🔐 LOGIN HOSPITAL
   ============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { hospitalId, name } = req.body;

    if (!hospitalId || !name) {
      return res.status(400).json({
        success: false,
        message: "Hospital ID and Name are required",
      });
    }

    const hospital = await Hospital.findOne({
      hospitalId: hospitalId.trim(),
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") }, // case-insensitive match
    });

    if (!hospital) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Hospital ID or Name" });
    }

    console.log(`✅ ${hospital.name} logged in successfully`);

    res.json({
      success: true,
      hospital: {
        _id: hospital._id,
        hospitalId: hospital.hospitalId,
        name: hospital.name,
        address: hospital.address,
        contact: hospital.contact,
        departments: hospital.departments,
        specialties: hospital.specialties,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   📊 HOSPITAL DASHBOARD DATA
   ============================================================ */
router.get("/:id/dashboard", async (req, res) => {
  try {
    const idParam = req.params.id;
    console.log("Hospital ID:", idParam);

    // 🧠 Detect ObjectId vs Custom ID
    let hospital;
    if (mongoose.isValidObjectId(idParam)) {
      hospital = await Hospital.findById(idParam);
    } else {
      hospital = await Hospital.findOne({ hospitalId: idParam });
    }

    if (!hospital) {
      return res
        .status(404)
        .json({ success: false, message: "Hospital not found" });
    }

    // 👨‍⚕️ Fetch doctors and patients linked to this hospital
    const doctors = await Doctor.find({ hospital: hospital._id }).lean();

    const patients = await Patient.find({ hospital: hospital._id })
      .populate("doctor", "name specialization")
      .lean();

    // 📊 Build dashboard summary
    const dashboard = {
      hospital,
      doctors,
      patients,
      totalDoctors: doctors.length,
      totalPatients: patients.length,
    };

    res.json({ success: true, dashboard });
  } catch (err) {
    console.error("❌ Dashboard error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🏥 Get all hospitals (for booking page)
router.get("/all", async (req, res) => {
  try {
    const hospitals = await Hospital.find().select("name address hospitalId");
    res.json({ success: true, hospitals });
  } catch (err) {
    console.error("Error fetching hospitals:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
