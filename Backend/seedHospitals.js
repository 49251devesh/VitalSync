/**
 * 🌐 Full Seeding Script — vitalsync
 * Inserts: Hospitals + Doctors + Patients (linked)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const Hospital = require("./model/Hospital");
const Doctor = require("./model/Doctor");
const Patient = require("./model/Patient");

dotenv.config();

// -----------------------------------------------------------------------------
// 🔌 DATABASE CONNECTION
// -----------------------------------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/vitalsync")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ DB Error:", err));

// -----------------------------------------------------------------------------
// 🏥 DEPARTMENT & EQUIPMENT SETS
// -----------------------------------------------------------------------------
const equipmentList = [
  "MRI Machine",
  "CT Scanner",
  "Ventilator",
  "ECG Monitor",
  "Defibrillator",
  "Ultrasound",
  "X-Ray",
  "Incubator",
  "Dialysis Machine",
  "Oxygen Concentrator",
  "Operation Table",
  "Blood Analyzer",
];

const departmentSets = {
  neuro: ["Neurology", "Psychiatry", "ICU", "Emergency"],
  cardio: ["Cardiology", "ICU", "Emergency"],
  ortho: ["Orthopedic", "Physiotherapy", "Emergency"],
  general: ["General Medicine", "Emergency"],
  surgery: ["Surgery", "Anesthesiology", "Emergency"],
  maternity: ["Gynecology", "Maternity", "Pediatrics"],
  kidney: ["Nephrology", "Urology", "ICU"],
  cancer: ["Oncology", "Surgery", "Emergency"],
  eye: ["Ophthalmology", "Emergency"],
  chest: ["Pulmonology", "ICU"],
};

// -----------------------------------------------------------------------------
// 📍 REALISTIC BENGALURU HOSPITAL DATA (10 hospitals)
// -----------------------------------------------------------------------------
const hospitals = [
  {
    name: "Fortis Hospital Bannerghatta",
    code: "FORT001",
    address: { line1: "Bannerghatta Road", city: "Bengaluru", state: "Karnataka", pincode: "560076" },
    contact: { phone: "08066214444", email: "info@fortis.com" },
    departments: departmentSets.cardio,
    equipment: equipmentList.slice(0, 5).map((name) => ({ name, available: true, quantity: 3 })),
    location: { type: "Point", coordinates: [77.5965, 12.9105] },
    rating: 4.6,
  },
  {
    name: "KIMS Hospital",
    code: "KIMS001",
    address: { line1: "V.V. Puram", city: "Bengaluru", state: "Karnataka", pincode: "560004" },
    contact: { phone: "08026712790", email: "info@kimshospital.com" },
    departments: departmentSets.general.concat(["Surgery", "Cardiology"]),
    equipment: ["X-Ray", "MRI Machine", "Ventilator", "Operation Table"].map((n) => ({
      name: n,
      available: true,
      quantity: 4,
    })),
    location: { type: "Point", coordinates: [77.5699, 12.9512] },
    rating: 4.5,
  },
  {
    name: "NIMHANS Hospital",
    code: "NIMH001",
    address: { line1: "Hosur Road", city: "Bengaluru", state: "Karnataka", pincode: "560029" },
    contact: { phone: "08026995000", email: "info@nimhans.ac.in" },
    departments: departmentSets.neuro,
    equipment: ["MRI Machine", "CT Scanner", "Ventilator"].map((n) => ({ name: n, available: true, quantity: 3 })),
    location: { type: "Point", coordinates: [77.598, 12.944] },
    rating: 4.8,
  },
  {
    name: "Apollo Cradle Jayanagar",
    code: "APOL001",
    address: { line1: "Jayanagar 3rd Block", city: "Bengaluru", state: "Karnataka", pincode: "560011" },
    contact: { phone: "08026304050", email: "contact@apollocradle.com" },
    departments: departmentSets.maternity,
    equipment: ["Incubator", "Ultrasound", "Defibrillator"].map((n) => ({ name: n, available: true, quantity: 2 })),
    location: { type: "Point", coordinates: [77.59, 12.929] },
    rating: 4.5,
  },
  {
    name: "Medicare Hospital",
    code: "MEDI001",
    address: { line1: "Basavanagudi", city: "Bengaluru", state: "Karnataka", pincode: "560004" },
    contact: { phone: "08022421325", email: "info@medicarehospital.com" },
    departments: departmentSets.general.concat(["Pulmonology", "Emergency"]),
    equipment: ["X-Ray", "Ultrasound", "ECG Monitor"].map((n) => ({ name: n, available: true, quantity: 2 })),
    location: { type: "Point", coordinates: [77.5681, 12.9407] },
    rating: 4.4,
  },
  {
    name: "HCG Cancer Hospital",
    code: "HCG001",
    address: { line1: "Sampangiram Nagar", city: "Bengaluru", state: "Karnataka", pincode: "560027" },
    contact: { phone: "08040206000", email: "info@hcgoncology.com" },
    departments: departmentSets.cancer,
    equipment: ["MRI Machine", "CT Scanner", "Radiation Unit"].map((n) => ({ name: n, available: true, quantity: 2 })),
    location: { type: "Point", coordinates: [77.59, 12.968] },
    rating: 4.7,
  },
  {
    name: "Shekar Hospital",
    code: "SHEK001",
    address: { line1: "JP Nagar 3rd Phase", city: "Bengaluru", state: "Karnataka", pincode: "560078" },
    contact: { phone: "08026580201", email: "info@shekarhospital.com" },
    departments: departmentSets.ortho,
    equipment: ["X-Ray", "MRI Machine", "Ventilator"].map((n) => ({ name: n, available: true, quantity: 2 })),
    location: { type: "Point", coordinates: [77.59, 12.906] },
    rating: 4.4,
  },
  {
    name: "Mallige Medical Centre",
    code: "MALL001",
    address: { line1: "Crescent Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
    contact: { phone: "08022265555", email: "info@mallige.com" },
    departments: departmentSets.general.concat(["Surgery"]),
    equipment: equipmentList.slice(0, 6).map((name) => ({ name, available: true, quantity: 3 })),
    location: { type: "Point", coordinates: [77.585, 12.98] },
    rating: 4.4,
  },
  {
    name: "Narayana Netralaya",
    code: "NARA001",
    address: { line1: "Rajajinagar Industrial Area", city: "Bengaluru", state: "Karnataka", pincode: "560010" },
    contact: { phone: "08066121300", email: "info@narayananetralaya.com" },
    departments: departmentSets.eye,
    equipment: ["Slit Lamp", "Laser System", "OCT Machine"].map((n) => ({ name: n, available: true, quantity: 2 })),
    location: { type: "Point", coordinates: [77.55, 12.98] },
    rating: 4.8,
  },
  {
    name: "Sharavathi Hospital",
    code: "SHAR001",
    address: { line1: "Banashankari 3rd Stage", city: "Bengaluru", state: "Karnataka", pincode: "560085" },
    contact: { phone: "08026797979", email: "info@sharavathihospital.com" },
    departments: departmentSets.general,
    equipment: ["X-Ray", "ECG Monitor", "Ultrasound"].map((n) => ({ name: n, available: true, quantity: 2 })),
    location: { type: "Point", coordinates: [77.55, 12.92] },
    rating: 4.3,
  },
];

// -----------------------------------------------------------------------------
// 👨‍⚕️ DOCTOR DATA
// -----------------------------------------------------------------------------
const doctors = [
  { name: "Dr. Arjun Rao", email: "arjun@fortis.com", specialization: "Cardiologist", hospitalCode: "FORT001" },
  { name: "Dr. Rekha Nair", email: "rekha@nimhans.com", specialization: "Neurologist", hospitalCode: "NIMH001" },
  { name: "Dr. Meena Das", email: "meena@apollo.com", specialization: "Gynecologist", hospitalCode: "APOL001" },
  { name: "Dr. Shankar Iyer", email: "shankar@kims.com", specialization: "General Surgeon", hospitalCode: "KIMS001" },
  { name: "Dr. Deepa R", email: "deepa@medicare.com", specialization: "Pulmonologist", hospitalCode: "MEDI001" },
  { name: "Dr. Rohan Bhat", email: "rohan@hcg.com", specialization: "Oncologist", hospitalCode: "HCG001" },
  { name: "Dr. Prakash", email: "prakash@shekar.com", specialization: "Orthopedic", hospitalCode: "SHEK001" },
  { name: "Dr. Sneha Shetty", email: "sneha@sharavathi.com", specialization: "General Physician", hospitalCode: "SHAR001" },
  { name: "Dr. Sameer Kumar", email: "sameer@mallige.com", specialization: "General Surgeon", hospitalCode: "MALL001" },
  { name: "Dr. Lakshmi Rao", email: "lakshmi@narayana.com", specialization: "Ophthalmologist", hospitalCode: "NARA001" },
];

// -----------------------------------------------------------------------------
// 🧍 PATIENT HELPERS
// -----------------------------------------------------------------------------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function createVitals() {
  return Array.from({ length: 3 }).map(() => ({
    date: new Date(Date.now() - randomInt(1, 5) * 86400000),
    systolicBP: randomInt(110, 150),
    diastolicBP: randomInt(70, 100),
    heartRate: randomInt(60, 100),
    sugarLevel: randomInt(80, 160),
  }));
}
function createMeds() {
  return Array.from({ length: 5 }).map(() => ({
    date: new Date(Date.now() - randomInt(1, 5) * 86400000),
    taken: Math.random() > 0.3 ? 1 : 0,
  }));
}

// -----------------------------------------------------------------------------
// 🚀 SEED FUNCTION
// -----------------------------------------------------------------------------
async function seed() {
  try {
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});

    const insertedHospitals = await Hospital.insertMany(hospitals);
    console.log(`🏥 ${insertedHospitals.length} hospitals inserted.`);

    const map = {};
    insertedHospitals.forEach((h) => (map[h.code] = h._id));

    const doctorDocs = doctors.map((doc, idx) => ({
      ...doc,
      doctorId: `DOC${1000 + idx}`,
      mpin: "1234",
      hospital: map[doc.hospitalCode],
      password: "123456",
      treatedPatients: 0,
    }));
    const insertedDoctors = await Doctor.insertMany(doctorDocs);
    console.log(`👨‍⚕️ ${insertedDoctors.length} doctors inserted.`);

    const patientNames = ["Amit Sharma", "Priya Singh", "Rahul Mehta", "Sneha Iyer", "Arun Das", "Nisha Reddy"];
    const patients = patientNames.map((name) => {
      const d = insertedDoctors[randomInt(0, insertedDoctors.length - 1)];
      const h = insertedHospitals.find((x) => x._id.equals(d.hospital));
      return {
        patientID: `PID-${uuidv4().split("-")[0].toUpperCase()}`,
        name,
        age: randomInt(25, 70),
        gender: Math.random() > 0.5 ? "Male" : "Female",
        contact: `+91${randomInt(7000000000, 9999999999)}`,
        address: `${randomInt(10, 250)}, ${h.address.city}`,
        doctor: d._id,
        hospital: h._id,
        vitalsHistory: createVitals(),
        medicationAdherence: createMeds(),
      };
    });

    const insertedPatients = await Patient.insertMany(patients);
    console.log(`🧍 ${insertedPatients.length} patients inserted.`);
    console.log("✅ All data seeded successfully.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
