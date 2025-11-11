// ✅ Import dependencies and models
const mongoose = require("mongoose");
const Doctor = require("../model/Doctor");
const Patient = require("../model/patient");

// 👨‍⚕️ Fetch a doctor’s patients
exports.getDoctorPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const limit = parseInt(req.query.limit) || 0; // e.g. ?limit=5

    // 🔍 Find doctor by custom doctorId or MongoDB _id
    const doctor =
      (await Doctor.findOne({ doctorId })) || (await Doctor.findById(doctorId));

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // 🧾 Find patients linked to this doctor (most recent first)
    let query = Patient.find({ doctor: doctor._id })
      .populate("hospital", "name")
      .populate("doctor", "name specialization")
      .sort({ "visitHistory.0.visitDate": -1, createdAt: -1 });

    if (limit > 0) query = query.limit(limit);

    const patients = await query.exec();

    // ✨ Prepare a short and clean version for the frontend
    const recentPatients = patients.map((p) => ({
      _id: p._id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      diagnosis: p.visitHistory?.[0]?.diagnosis || "General Checkup",
      visitDate: p.visitHistory?.[0]?.visitDate || p.createdAt || new Date(),
      hospital: p.hospital?.name,
    }));

    // ✅ Send the response
    res.json({
      success: true,
      doctor: {
        id: doctor._id,
        doctorId: doctor.doctorId,
        name: doctor.name,
        specialization: doctor.specialization,
        department: doctor.department,
        hospital: doctor.hospitalName,
        experience: doctor.experience,
        patientsTreated: doctor.patientsTreated || patients.length,
        totalPatients: patients.length,
      },
      patients: recentPatients,
    });
  } catch (err) {
    console.error("❌ getDoctorPatients error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
