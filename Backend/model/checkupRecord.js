const mongoose = require("mongoose");

const checkupRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  checkupDate: { type: Date, default: Date.now },
  diagnosis: String,
  prescription: String,
  vitals: {
    bloodPressure: String,
    heartRate: String,
    sugarLevel: String,
  },
});

module.exports=mongoose.model("CheckupRecord", checkupRecordSchema);
