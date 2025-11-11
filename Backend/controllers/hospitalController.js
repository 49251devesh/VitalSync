const Hospital = require("../model/Hospital");
const Doctor = require("../model/Doctor");
const Patient = require("../model/patient");

// 📊 Get full hospital dashboard
exports.getHospitalDashboard = async (req, res) => {
  try {
    const { id } = req.params; // hospital _id or hospitalCode

    // 1️⃣ Find hospital
    const hospital = await Hospital.findById(id);
    if (!hospital)
      return res.status(404).json({ success: false, message: "Hospital not found" });

    // 2️⃣ Fetch all doctors linked to this hospital
    const doctors = await Doctor.find({ hospital: hospital._id });

    // 3️⃣ Fetch all patients linked to this hospital
    const patients = await Patient.find({ hospital: hospital._id });

    // 4️⃣ Calculate totals
    const totalDoctors = doctors.length;
    const totalPatients = patients.length;

    // 5️⃣ Total operations (count from visitHistory or equipmentUsed)
    let totalOperations = 0;
    patients.forEach((p) => {
      totalOperations += (p.visitHistory?.length || 0);
    });

    // 6️⃣ Enrich doctor stats
    const doctorStats = doctors.map((doc) => {
      const treatedPatients = patients.filter(
        (p) => p.doctor?.toString() === doc._id.toString()
      );
      return {
        doctorId: doc.doctorId,
        name: doc.name,
        specialization: doc.specialization,
        patientsTreated: treatedPatients.length,
        totalAppointments: doc.appointments?.length || 0,
        patients: treatedPatients.map((p) => ({
          id: p._id,
          name: p.name,
          age: p.age,
          lastVisit:
            p.visitHistory.length > 0
              ? p.visitHistory[p.visitHistory.length - 1].visitDate
              : null,
        })),
      };
    });

    // 7️⃣ Respond with data
    res.json({
      success: true,
      dashboard: {
        hospital: {
          id: hospital._id,
          name: hospital.name,
          code: hospital.code,
        },
        totalDoctors,
        totalPatients,
        totalOperations,
        doctors: doctorStats,
      },
    });
  } catch (err) {
    console.error("❌ getHospitalDashboard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
