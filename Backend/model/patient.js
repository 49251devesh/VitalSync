const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

/* ----------------------------------------------
   🩸 SUBSCHEMAS
---------------------------------------------- */

// 🫀 Vital Signs
const vitalsHistorySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  systolicBP: Number,
  diastolicBP: Number,
  heartRate: Number,
  sugarLevel: Number,
  oxygenSaturation: Number,
  temperature: Number,
});

// 💊 Medication Adherence
const medicationAdherenceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  medicineName: String,
  dosage: String,
  frequency: String,
  taken: { type: Boolean, default: false },
});

// 🧰 Equipment Usage
const equipmentUsageSchema = new mongoose.Schema({
  equipmentName: String,
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  dateUsed: { type: Date, default: Date.now },
  notes: String,
});

// 🧩 Observation
const observationSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
  unit: String,
  recordedAt: { type: Date, default: Date.now },
  source: { type: String, default: "manual" },
});

// 🏥 Visit History
const visitHistorySchema = new mongoose.Schema({
  visitDate: { type: Date, default: Date.now },
  department: String,
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  diagnosis: String,
  treatment: String,
  followUpDate: Date,
  observations: [observationSchema],
});

// 💊 Prescription
const prescriptionSchema = new mongoose.Schema({
  originalFile: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  parsedData: {
    patientName: String,
    age: Number,
    gender: String,
    department: String,
    diagnosis: String,
    medicines: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        notes: String,
      },
    ],
    observations: [observationSchema],
    notes: String,
  },
});

// 🧾 Report
const reportSchema = new mongoose.Schema({
  reportType: String,
  reportFile: String,
  issuedDate: { type: Date, default: Date.now },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  department: String,
  findings: [observationSchema],
  summary: String,
});

// 🚨 Emergency Access Log
const emergencyAccessSchema = new mongoose.Schema({
  accessedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  timestamp: { type: Date, default: Date.now },
  reason: { type: String, default: "Emergency override - patient unconscious" },
});

/* ----------------------------------------------
   👩‍⚕️ MAIN PATIENT SCHEMA
---------------------------------------------- */
const patientSchema = new mongoose.Schema(
  {
    patientID: {
      type: String,
      unique: true,
      default: () => `PID-${uuidv4().split("-")[0].toUpperCase()}`,
    },
    doctorId: { type: String, index: true },
    hospitalId: { type: String, index: true },
    hospitalCode: String,
    fingerprintId: { type: String, index: true },
    fingerprintFile: String,

    name: { type: String, required: true },
    age: Number,
    dob: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Unknown"],
      default: "Unknown",
    },
    contact: String,
    address: String,

    email: { type: String, lowercase: true, trim: true },
    password: String, // hashed

    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },

    vitalsHistory: [vitalsHistorySchema],
    medicationAdherence: [medicationAdherenceSchema],
    equipmentUsed: [equipmentUsageSchema],
    visitHistory: [visitHistorySchema],

    prescriptions: [prescriptionSchema],
    reports: [reportSchema],

    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String],
    diseaseCategory: String,
    isCritical: { type: Boolean, default: false },

    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
    emergencyAccessLog: [emergencyAccessSchema],

    dataAccessPolicy: {
      type: String,
      enum: ["normal", "emergency_only", "restricted"],
      default: "normal",
    },

    lastAccessedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, refPath: "lastAccessedByModel" },
      lastAccessedByModel: { type: String, enum: ["Doctor", "Patient", "Admin"] },
      timestamp: { type: Date },
    },

    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  },
  { timestamps: true }
);

/* ----------------------------------------------
   ⚙️ INDEXING
---------------------------------------------- */
patientSchema.index({ patientID: 1 });
patientSchema.index({ hospitalId: 1 });
patientSchema.index({ doctorId: 1 });
patientSchema.index({ fingerprintId: 1 });

module.exports = mongoose.model("Patient", patientSchema);
