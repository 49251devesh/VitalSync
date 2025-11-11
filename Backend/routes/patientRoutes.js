require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const auth = require("../middleware/auth");

const Hospital = require("../model/Hospital");
const Doctor = require("../model/Doctor");
const Patient = require("../model/patient");

const { sendPatientIDEmail } = require("../utils/emailService");
const { parsePrescriptionWithAI } = require("../utils/ocrAndLLM");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
/* ----------------------------------------------
   🔧 Multer Setup (for file uploads)
---------------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ----------------------------------------------
   🧠 1️⃣ REGISTER OR UPDATE PATIENT
---------------------------------------------- */
router.post("/register", upload.single("prescription"), async (req, res) => {
  try {
    const { name, email, password, fingerprintId, hospitalId, doctorId } = req.body;
    const file = req.file;

    if (!hospitalId)
      return res.status(400).json({ success: false, message: "Hospital ID required" });

    // ✅ FIXED Hospital lookup
    let hospital;
    if (mongoose.Types.ObjectId.isValid(hospitalId)) {
      hospital = await Hospital.findById(hospitalId);
    } else {
      hospital = await Hospital.findOne({
        $or: [
          { hospitalId: hospitalId },
          { code: hospitalId },
          { hospitalCode: hospitalId },
        ],
      });
    }

    if (!hospital)
      return res.status(404).json({ success: false, message: "Hospital not found" });

    // 👨‍⚕️ Doctor lookup (same logic)
    let doctor;
    if (doctorId) {
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        doctor = await Doctor.findById(doctorId);
      } else {
        doctor = await Doctor.findOne({ $or: [{ doctorId }, { code: doctorId }] });
      }
    }

    // 🧠 AI Parse
    let parsedData = {};
    if (file) {
      try {
        parsedData = await parsePrescriptionWithAI(file.path);
        console.log("✅ Parsed Prescription via AI");
      } catch (err) {
        console.error("❌ AI Parse Error:", err.message);
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    // 🔍 Existing patient check
    const existing = await Patient.findOne({
      $and: [{ email }, { hospital: hospital._id }],
    });

    if (existing) {
      console.log("🔁 Updating existing patient:", existing.name);
      existing.name = name || existing.name;
      existing.email = email || existing.email;
      existing.password = hashedPassword || existing.password;
      existing.hospital = hospital._id;
      existing.hospitalId = hospital.hospitalId;
      existing.doctor = doctor?._id || existing.doctor;
      existing.doctorId = doctor?.doctorId || existing.doctorId;
      if (fingerprintId) existing.fingerprintId = fingerprintId;

      if (file) {
        existing.prescriptions.push({
          originalFile: file.path,
          parsedData,
          uploadedAt: new Date(),
        });
      }

      existing.visitHistory.push({
        visitDate: new Date(),
        department: parsedData?.department || "General Medicine",
        diagnosis: parsedData?.diagnosis || "Under Review",
      });

      await existing.save();

      const token = jwt.sign({ id: existing._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      return res.json({
        success: true,
        message: "✅ Patient updated successfully",
        patientID: existing.patientID,
        token,
      });
    }

    // 🆕 New patient creation
    const patient = new Patient({
      name: name || parsedData?.patientName || "Unknown",
      email,
      password: hashedPassword,
      fingerprintId,
      age: parsedData?.age || null,
      gender: parsedData?.gender || "Unknown",
      hospital: hospital._id,
      hospitalId: hospital.hospitalId,
      hospitalCode: hospital.hospitalCode || hospital.code,
      doctor: doctor?._id || null,
      doctorId: doctor?.doctorId || null,
      department: parsedData?.department || "General Medicine",
      prescriptions: file
        ? [{ originalFile: file.path, parsedData, uploadedAt: new Date() }]
        : [],
      visitHistory: [
        {
          visitDate: new Date(),
          department: parsedData?.department || "General Medicine",
          diagnosis: parsedData?.diagnosis || "Under Review",
        },
      ],
    });

    await patient.save();

    if (email) {
      try {
        await sendPatientIDEmail(email, patient.name, patient.patientID);
      } catch (err) {
        console.warn("⚠️ Email sending failed:", err.message);
      }
    }

    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      message: "✅ New patient registered successfully",
      patientID: patient.patientID,
      token,
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ----------------------------------------------
   🔐 2️⃣ LOGIN (PatientID or Fingerprint)
---------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { patientID, fingerprintId } = req.body;

    if (!patientID && !fingerprintId) {
      return res.status(400).json({
        success: false,
        message: "Provide PatientID or FingerprintID",
      });
    }

    let patient = null;

    // ✅ Case 1: Try patientID (PID-XXXX or ObjectId)
    if (patientID) {
      if (mongoose.Types.ObjectId.isValid(patientID)) {
        // It’s a real ObjectId
        patient = await Patient.findById(patientID);
      } else {
        // It’s a custom readable ID like PID-XXXX
        patient = await Patient.findOne({ patientID });
      }
    }

    // ✅ Case 2: Try fingerprintId (if patient not found yet)
    if (!patient && fingerprintId) {
      patient = await Patient.findOne({ fingerprintId });
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // ✅ Generate token
    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      success: true,
      message: "✅ Login successful",
      token,
      patient,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


/* ----------------------------------------------
   🔐 3️⃣ BIOMETRIC REGISTER (store credential)
---------------------------------------------- */
router.post("/biometric-register", async (req, res) => {
  try {
    const { patientID, credentialId } = req.body;
    if (!patientID || !credentialId)
      return res
        .status(400)
        .json({ success: false, message: "Missing patientID or credentialId" });

    const patient = await Patient.findOne({ patientID });
    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    patient.fingerprintId = credentialId;
    await patient.save();

    res.json({ success: true, message: "✅ Biometric linked successfully" });
  } catch (err) {
    console.error("❌ Biometric register error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------------------------
   🔐 4️⃣ BIOMETRIC LOGIN
---------------------------------------------- */
router.post("/biometric-login", async (req, res) => {
  try {
    const { credentialId } = req.body;
    if (!credentialId)
      return res.status(400).json({ success: false, message: "Missing credentialId" });

    const patient = await Patient.findOne({ fingerprintId: credentialId });
    if (!patient)
      return res.status(404).json({
        success: false,
        message: "No patient found for this biometric ID",
      });

    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "✅ Biometric login successful",
      token,
      patient,
    });
  } catch (err) {
    console.error("❌ Biometric login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------------------------
   🚨 5️⃣ EMERGENCY ACCESS (Doctor Override)
---------------------------------------------- */
router.post("/emergency-access", async (req, res) => {
  try {
    const { patientID, doctorId, hospitalId, fingerprintId } = req.body;
    if (!doctorId || (!patientID && !fingerprintId))
      return res.status(400).json({
        success: false,
        message: "Missing required details (doctorId & patientID/fingerprintId)",
      });

    const patient = await Patient.findOne({
      $or: [{ patientID }, { fingerprintId }],
    }).populate("hospital", "code name hospitalId");

    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    const hospital = mongoose.isValidObjectId(hospitalId)
      ? await Hospital.findById(hospitalId)
      : await Hospital.findOne({ $or: [{ hospitalId }, { code: hospitalId }] });

    if (!hospital)
      return res.status(404).json({ success: false, message: "Hospital not found" });

    patient.emergencyAccessLog.push({
      accessedBy: doctorId,
      hospital: hospital._id,
      timestamp: new Date(),
      reason: "Emergency override - patient unconscious",
    });

    await patient.save();

    res.json({
      success: true,
      message: "🚨 Emergency access granted",
      patient,
    });
  } catch (err) {
    console.error("❌ Emergency access error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------------------------
   🏠 6️⃣ PATIENT DASHBOARD
---------------------------------------------- */
router.get("/dashboard/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const patient = mongoose.isValidObjectId(id)
      ? await Patient.findById(id)
      : await Patient.findOne({ patientID: id })
          .populate("doctor", "name specialization doctorId")
          .populate("hospital", "name address code hospitalId");

    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    res.json({ success: true, patient });
  } catch (err) {
    console.error("❌ Dashboard error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------------------------
   💊 7️⃣ UPLOAD NEW PRESCRIPTION (AI)
---------------------------------------------- */
router.post("/upload/:id", upload.single("prescription"), async (req, res) => {
  try {
    const { id } = req.params;
    const patient = mongoose.isValidObjectId(id)
      ? await Patient.findById(id)
      : await Patient.findOne({ patientID: id });

    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    const parsedData = await parsePrescriptionWithAI(req.file.path);

    patient.prescriptions.push({
      originalFile: req.file.path,
      parsedData,
      uploadedAt: new Date(),
    });

    patient.visitHistory.push({
      visitDate: new Date(),
      department: parsedData?.department || "General Medicine",
      diagnosis: parsedData?.diagnosis || "Under Review",
    });

    await patient.save();
    res.json({ success: true, message: "✅ Prescription uploaded", patient });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------------------------
   🧾 8️⃣ MANUAL ADD PATIENT
---------------------------------------------- */
router.post("/add", async (req, res) => {
  try {
    const { name, age, gender, phone, doctorId, diagnosis, hospitalId } = req.body;
    if (!name || !hospitalId)
      return res.status(400).json({ success: false, message: "Name & HospitalID required" });

    const hospital = mongoose.isValidObjectId(hospitalId)
      ? await Hospital.findById(hospitalId)
      : await Hospital.findOne({ $or: [{ hospitalId }, { code: hospitalId }] });

    if (!hospital)
      return res.status(404).json({ success: false, message: "Hospital not found" });

    let doctor = null;
    if (doctorId)
      doctor = mongoose.isValidObjectId(doctorId)
        ? await Doctor.findById(doctorId)
        : await Doctor.findOne({ doctorId });

    const patient = new Patient({
      name: name.trim(),
      age,
      gender: gender || "Unknown",
      contact: phone || "",
      diagnosis: diagnosis || "Pending",
      hospital: hospital._id,
      hospitalId: hospital.hospitalId,
      doctor: doctor?._id || null,
      doctorId: doctor?.doctorId || null,
    });

    await patient.save();
    if (doctor?._id)
      await Doctor.findByIdAndUpdate(doctor._id, { $push: { patients: patient._id } });

    res.status(201).json({
      success: true,
      message: "✅ Patient added successfully",
      patientID: patient.patientID,
      patient,
    });
  } catch (err) {
    console.error("❌ Add error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------------------------
   ✏️ 9️⃣ UPDATE PATIENT RECORD
---------------------------------------------- */
router.put("/update/:id", upload.single("prescription"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, doctorId, diagnosis } = req.body;
    const file = req.file;

    const patient = mongoose.isValidObjectId(id)
      ? await Patient.findById(id)
      : await Patient.findOne({ patientID: id });

    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    if (name) patient.name = name;
    if (email) patient.email = email;
    if (password) patient.password = await bcrypt.hash(password, 10);
    if (diagnosis) patient.diagnosis = diagnosis;

    if (doctorId) {
      const doctor = mongoose.isValidObjectId(doctorId)
        ? await Doctor.findById(doctorId)
        : await Doctor.findOne({ doctorId });

      if (doctor) {
        patient.doctor = doctor._id;
        patient.doctorId = doctor.doctorId;
      }
    }

    let parsedData = {};
    if (file) {
      parsedData = await parsePrescriptionWithAI(file.path);
      patient.prescriptions.push({
        originalFile: file.path,
        parsedData,
        uploadedAt: new Date(),
      });
    }

    patient.visitHistory.push({
      visitDate: new Date(),
      department: parsedData?.department || "General Medicine",
      diagnosis: diagnosis || parsedData?.diagnosis || "Updated record",
    });

    await patient.save();

    res.json({
      success: true,
      message: "✅ Patient updated successfully",
      patientID: patient.patientID,
      patient,
    });
  } catch (error) {
    console.error("❌ Update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
})

// store registered credentials temporarily
let registeredDevices = {};

router.post("/webauthn/login-options", async (req, res) => {
  const { patientID } = req.body;
  const options = generateAuthenticationOptions({
    allowCredentials: registeredDevices[patientID]
      ? [{ id: registeredDevices[patientID].id, type: "public-key" }]
      : [],
  });
  res.json(options);
});

router.post("/webauthn/login-verify", async (req, res) => {
  const body = req.body;
  // normally you'd verify challenge, credentialID, etc.
  const verified = body.id ? true : false;

  if (verified) {
    res.json({
      success: true,
      token: "dummy-token",
      patient: { patientID: "PID-DEMO123" },
    });
  } else res.json({ success: false });
});

module.exports = router;


module.exports = router;


// ✅ Dependencies
// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const router = express.Router();
// const multer = require("multer");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const fs = require("fs");
// const auth = require("../middleware/authPatientDoctor");

// // ✅ Models
// const Hospital = require("../model/Hospital");
// const Doctor = require("../model/Doctor");
// const Patient = require("../model/patient");

// // ✅ Utilities
// const { sendPatientIDEmail } = require("../utils/emailService");
// const { parsePrescriptionWithAI } = require("../utils/ocrAndLLM");

// /* ----------------------------------------------
//    🔧 MULTER SETUP (for file uploads)
// ---------------------------------------------- */
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = "uploads/";
//     if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
// });
// const upload = multer({ storage });

// /* ----------------------------------------------
//    🧠 1️⃣ REGISTER OR UPDATE PATIENT
// ---------------------------------------------- */
// router.post("/register", upload.single("prescription"), async (req, res) => {
//   try {
//     const { name, email, password, fingerprintId, hospitalId, doctorId } = req.body;
//     const file = req.file;

//     if (!hospitalId)
//       return res.status(400).json({ success: false, message: "Hospital ID required" });

//     // ✅ Find hospital
//     const hospital = await Hospital.findOne({
//       $or: [{ _id: hospitalId }, { hospitalId }],
//     });
//     if (!hospital)
//       return res.status(404).json({ success: false, message: "Hospital not found" });

//     // ✅ Find doctor (optional)
//     let doctor = null;
//     if (doctorId)
//       doctor = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctorId }] });

//     // ✅ AI Prescription Parsing
//     let parsedData = {};
//     if (file) {
//       try {
//         parsedData = await parsePrescriptionWithAI(file.path);
//         console.log("✅ Parsed prescription successfully.");
//       } catch (err) {
//         console.error("❌ AI Parse Error:", err.message);
//       }
//     }

//     // ✅ Hash password
//     const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

//     // ✅ Check for existing patient by email + hospital
//     const existing = await Patient.findOne({
//       $and: [{ email }, { hospital: hospital._id }],
//     });

//     if (existing) {
//       // Update existing record
//       console.log("🔁 Updating existing patient:", existing.name);
//       existing.name = name || existing.name;
//       existing.email = email || existing.email;
//       existing.password = hashedPassword || existing.password;
//       existing.hospital = hospital._id;
//       existing.doctor = doctor?._id || existing.doctor;
//       if (fingerprintId) existing.fingerprintId = fingerprintId;

//       if (file) {
//         existing.prescriptions.push({
//           originalFile: file.path,
//           parsedData,
//           uploadedAt: new Date(),
//         });
//       }

//       existing.visitHistory.push({
//         visitDate: new Date(),
//         department: parsedData?.department || "General Medicine",
//         diagnosis: parsedData?.diagnosis || "Under Review",
//       });

//       await existing.save();

//       const token = jwt.sign({ id: existing._id }, process.env.JWT_SECRET, {
//         expiresIn: "7d",
//       });

//       return res.json({
//         success: true,
//         message: "✅ Patient updated successfully",
//         patientID: existing.patientID,
//         token,
//       });
//     }

//     // 🆕 Create new patient record
//     const patient = new Patient({
//       name: name || parsedData?.patientName || "Unknown",
//       email,
//       password: hashedPassword,
//       fingerprintId,
//       age: parsedData?.age || null,
//       gender: parsedData?.gender || "Unknown",
//       hospital: hospital._id,
//       doctor: doctor?._id || null,
//       department: parsedData?.department || "General Medicine",
//       prescriptions: file
//         ? [
//             {
//               originalFile: file.path,
//               parsedData,
//               uploadedAt: new Date(),
//             },
//           ]
//         : [],
//       visitHistory: [
//         {
//           visitDate: new Date(),
//           department: parsedData?.department || "General Medicine",
//           diagnosis: parsedData?.diagnosis || "Under Review",
//         },
//       ],
//     });

//     await patient.save();
//     console.log("💾 New patient registered:", patient._id);

//     // ✅ Send confirmation email ALWAYS for new patient
//     if (email) {
//       try {
//         await sendPatientIDEmail(email, patient.name, patient.patientID);
//         console.log(`📧 Email sent to ${email}`);
//       } catch (err) {
//         console.warn("⚠️ Email sending failed:", err.message);
//       }
//     }

//     const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "✅ New patient registered successfully",
//       patientID: patient.patientID,
//       token,
//     });
//   } catch (error) {
//     console.error("❌ Error in register route:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// /* ----------------------------------------------
//    🔐 2️⃣ LOGIN (via PatientID or FingerprintID)
// ---------------------------------------------- */
// router.post("/login", async (req, res) => {
//   try {
//     const { patientID, fingerprintId } = req.body;

//     if (!patientID && !fingerprintId) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide Patient ID or use registered device.",
//       });
//     }

//     let patient = null;

//     if (patientID) {
//       patient = await Patient.findOne({ patientID });
//     } else if (fingerprintId) {
//       patient = await Patient.findOne({ fingerprintId });
//     }

//     if (!patient)
//       return res.status(404).json({ success: false, message: "Patient not found" });

//     const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     res.json({
//       success: true,
//       message: "✅ Login successful",
//       token,
//       patient,
//     });
//   } catch (err) {
//     console.error("❌ Login Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ----------------------------------------------
//    🏠 3️⃣ DASHBOARD (Fetch Patient Details)
// ---------------------------------------------- */
// router.get("/dashboard/:id", auth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const patient = await Patient.findOne({ patientID: id })
//       .populate("doctor", "name specialization")
//       .populate("hospital", "name address code");

//     if (!patient)
//       return res.status(404).json({ success: false, message: "Patient not found" });

//     res.json({ success: true, patient });
//   } catch (err) {
//     console.error("❌ Dashboard error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ----------------------------------------------
//    💊 4️⃣ UPLOAD NEW PRESCRIPTION (Re-parse AI)
// ---------------------------------------------- */
// router.post("/upload/:id", upload.single("prescription"), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const patient = await Patient.findOne({ patientID: id });
//     if (!patient)
//       return res.status(404).json({ success: false, message: "Patient not found" });

//     let parsedData = {};
//     try {
//       parsedData = await parsePrescriptionWithAI(req.file.path);
//     } catch (err) {
//       console.error("❌ AI Parsing Error:", err.message);
//     }

//     patient.prescriptions.push({
//       originalFile: req.file.path,
//       parsedData,
//       uploadedAt: new Date(),
//     });

//     patient.visitHistory.push({
//       visitDate: new Date(),
//       department: parsedData?.department || "General Medicine",
//       diagnosis: parsedData?.diagnosis || "Under Review",
//     });

//     await patient.save();
//     res.json({ success: true, message: "✅ Prescription uploaded successfully", patient });
//   } catch (err) {
//     console.error("❌ Upload error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ----------------------------------------------
//    🧾 5️⃣ MANUAL ADD PATIENT (from Hospital)
// ---------------------------------------------- */
// router.post("/add", async (req, res) => {
//   try {
//     const { name, age, gender, phone, doctorId, diagnosis, hospitalId } = req.body;
//     if (!name || !hospitalId)
//       return res
//         .status(400)
//         .json({ success: false, message: "Name and hospitalId are required." });

//     const hospital = mongoose.isValidObjectId(hospitalId)
//       ? await Hospital.findById(hospitalId)
//       : await Hospital.findOne({ hospitalId });

//     if (!hospital)
//       return res.status(404).json({ success: false, message: "Hospital not found" });

//     let doctor = null;
//     if (doctorId)
//       doctor = mongoose.isValidObjectId(doctorId)
//         ? await Doctor.findById(doctorId)
//         : await Doctor.findOne({ doctorId });

//     const patient = new Patient({
//       name: name.trim(),
//       age: age || null,
//       gender: gender || "Unknown",
//       contact: phone || "",
//       diagnosis: diagnosis || "Pending",
//       hospital: hospital._id,
//       doctor: doctor?._id || null,
//     });

//     await patient.save();

//     if (doctor?._id)
//       await Doctor.findByIdAndUpdate(doctor._id, { $push: { patients: patient._id } });

//     res.status(201).json({
//       success: true,
//       message: "✅ Patient added successfully",
//       patientID: patient.patientID,
//       patient,
//     });
//   } catch (err) {
//     console.error("❌ Add error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ----------------------------------------------
//    ✏️ 6️⃣ UPDATE EXISTING PATIENT
// ---------------------------------------------- */
// router.put("/update/:id", upload.single("prescription"), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, email, password, doctorId, diagnosis } = req.body;
//     const file = req.file;

//     const patient = await Patient.findOne({ patientID: id });
//     if (!patient)
//       return res.status(404).json({ success: false, message: "Patient not found" });

//     if (name) patient.name = name;
//     if (email) patient.email = email;
//     if (password) patient.password = await bcrypt.hash(password, 10);
//     if (diagnosis) patient.diagnosis = diagnosis;

//     if (doctorId) {
//       const doctor = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctorId }] });
//       if (doctor) patient.doctor = doctor._id;
//     }

//     let parsedData = {};
//     if (file) {
//       try {
//         parsedData = await parsePrescriptionWithAI(file.path);
//         patient.prescriptions.push({
//           originalFile: file.path,
//           parsedData,
//           uploadedAt: new Date(),
//         });
//       } catch (err) {
//         console.error("❌ AI Parsing Error:", err.message);
//       }
//     }

//     patient.visitHistory.push({
//       visitDate: new Date(),
//       department: parsedData?.department || "General Medicine",
//       diagnosis: diagnosis || parsedData?.diagnosis || "Updated record",
//     });

//     await patient.save();

//     res.json({
//       success: true,
//       message: "✅ Patient updated successfully",
//       patientID: patient.patientID,
//       patient,
//     });
//   } catch (error) {
//     console.error("❌ Update error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });



// module.exports = router;
