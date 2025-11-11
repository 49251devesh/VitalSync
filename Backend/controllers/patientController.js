const Patient = require("../model/patient");

exports.registerPatient = async (req, res) => {
  try {
    const { patientID, name, age, gender, contact, address, doctor, hospital } = req.body;
    const existing = await Patient.findOne({ patientID });
    if (existing) return res.status(400).json({ message: "Patient ID exists" });

    const patient = await Patient.create({
      patientID,
      name,
      age,
      gender,
      contact,
      address,
      doctor,
      hospital,
    });

    res.status(201).json({ message: "Patient registered", patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPatientDashboard = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("doctor", "name specialization")
      .populate("hospital", "name");

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const vitals6 = patient.vitalsHistory.filter((v) => v.date >= sixMonthsAgo);

    res.json({
      patient: {
        name: patient.name,
        doctor: patient.doctor?.name,
        hospital: patient.hospital?.name,
      },
      vitalsHistory: vitals6,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
