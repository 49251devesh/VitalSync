const Appointment = require("../model/Appointment");
const Doctor = require("../model/Doctor");
const Patient = require("../model/patient");
const HospitalData = require("../model/Hospital");

exports.bookAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, date, timeSlot, reason } = req.body;
    const doctor = await Doctor.findById(doctorId);
    const patient = await Patient.findById(patientId);
    const hospital = await HospitalData.findById(hospitalId);

    if (!doctor || !patient || !hospital)
      return res.status(404).json({ message: "Invalid doctor/patient/hospital" });

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      hospital: hospitalId,
      date,
      timeSlot,
      reason,
    });

    res.status(201).json({ message: "Appointment booked", appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
