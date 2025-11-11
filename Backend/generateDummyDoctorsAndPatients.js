const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Hospital = require("./model/Hospital");
const Doctor = require("./model/Doctor");
const Patient = require("./model/patient");
const { v4: uuidv4 } = require("uuid");

/* ----------------------------------------------
   🧠 Dummy data sources
---------------------------------------------- */
const doctorNames = [
  "Dr. Arjun Rao",
  "Dr. Sneha Iyer",
  "Dr. Ramesh Kumar",
  "Dr. Meena Sharma",
  "Dr. Rajesh Patel",
  "Dr. Kavya Nair",
  "Dr. Aditya Verma",
  "Dr. Priya Menon",
  "Dr. Karthik Das",
  "Dr. Reena Bhat",
  "Dr. Manoj Joshi",
  "Dr. Shilpa Reddy",
];

const firstNames = [
  "Aarav", "Ishaan", "Vihaan", "Rohan", "Karan", "Dev", "Aditya", "Siddharth",
  "Arnav", "Nikhil", "Ananya", "Diya", "Aisha", "Sneha", "Riya", "Kavya",
  "Meera", "Nisha", "Priya", "Suhani",
];
const lastNames = ["Sharma", "Reddy", "Patel", "Nair", "Menon", "Iyer", "Kumar", "Das", "Verma", "Bhat", "Joshi", "Rao"];
const conditions = ["Fever", "Fracture", "Migraine", "Asthma", "Hypertension", "Diabetes", "Chest Pain", "Skin Rash", "Cough & Cold", "Gastritis", "Back Pain", "Thyroid"];
const genders = ["Male", "Female", "Other"];
const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const allergies = ["Pollen", "Dust", "Peanuts", "Shellfish", "None"];
const chronic = ["Hypertension", "Asthma", "Diabetes", "None"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ----------------------------------------------
   🧹 Optional: clear existing data
---------------------------------------------- */
async function cleanDatabase() {
  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  console.log("🧹 Cleared existing Doctors & Patients");
}

/* ----------------------------------------------
   🚀 MAIN SEED FUNCTION
---------------------------------------------- */
async function main() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/vitalsync", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");

    await cleanDatabase();

    const hospitals = await Hospital.find();
    console.log(`🏥 Found ${hospitals.length} hospitals in DB`);

    for (const hospital of hospitals) {
      console.log(`\n🏨 Generating data for hospital: ${hospital.name}`);

      // --- Generate 3 Doctors per hospital ---
      for (let i = 0; i < 3; i++) {
        const docName = getRandom(doctorNames);
        const spec =
          getRandom(hospital.specialties) ||
          getRandom(hospital.departments) ||
          "General Medicine";

        const hashedPassword = await bcrypt.hash("password123", 10);

        const emailBase = docName
          .replace("Dr. ", "")
          .replace(/\s+/g, "_")
          .toLowerCase();
        const uniqueEmail = `${emailBase}_${uuidv4().split("-")[0]}@${hospital.hospitalId.toLowerCase()}.com`;

        const doctorId = `DOC-${uuidv4().split("-")[0].toUpperCase()}`;

        const doctor = await Doctor.create({
          name: docName,
          email: uniqueEmail,
          password: hashedPassword,
          specialization: spec,
          department: getRandom(hospital.departments) || "General Medicine",
          experience: Math.floor(Math.random() * 20) + 1,
          hospital: hospital._id,
          hospitalName: hospital.name,
          hospitalCode: hospital.hospitalId,
          doctorId, // ✅ stored doctorId
          patientsTreated: Math.floor(Math.random() * 300) + 20,
          contact: {
            phone: `+91${Math.floor(9000000000 + Math.random() * 1000000000)}`,
            email: uniqueEmail,
          },
          appointments: [],
        });

        console.log(`👨‍⚕️ Added: ${doctor.name} (${spec}) → ${doctor.doctorId}`);

        // --- Generate 3–6 Patients for each Doctor ---
        const numPatients = Math.floor(Math.random() * 4) + 3;
        for (let j = 0; j < numPatients; j++) {
          const gender = getRandom(genders);
          const condition = getRandom(conditions);
          const patientName = `${getRandom(firstNames)} ${getRandom(lastNames)}`;

          // 🩺 Generate random vitals
          const vitalsHistory = Array.from({ length: 3 }).map((_, k) => {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() - (k * 5 + 1));
            return {
              date: baseDate,
              systolicBP: 110 + Math.floor(Math.random() * 30),
              diastolicBP: 70 + Math.floor(Math.random() * 20),
              heartRate: 60 + Math.floor(Math.random() * 40),
              sugarLevel: 80 + Math.floor(Math.random() * 60),
              oxygenSaturation: 94 + Math.floor(Math.random() * 5),
              temperature: 97.5 + Math.random() * 2,
            };
          });

          const patientID = `PID-${uuidv4().split("-")[0].toUpperCase()}`;

          const patient = await Patient.create({
            name: patientName,
            age: Math.floor(Math.random() * 60) + 18,
            gender,
            contact: `+91${Math.floor(9000000000 + Math.random() * 1000000000)}`,
            address: `${hospital.address?.city || "Unknown City"}, ${hospital.address?.state || "Unknown State"}`,
            doctor: doctor._id,
            doctorId: doctor.doctorId, // ✅ also save doctorId
            hospital: hospital._id,
            hospitalId: hospital.hospitalId, // ✅ also save hospitalId
            hospitalCode: hospital.hospitalId,
            bloodGroup: getRandom(bloodGroups),
            allergies: [getRandom(allergies)],
            chronicConditions: [getRandom(chronic)],
            diseaseCategory: getRandom(["Cardiology", "Neurology", "Dermatology", "General"]),
            patientID, // ✅ custom readable patientID
            dataAccessPolicy: "normal",
            vitalsHistory,
            visitHistory: [
              {
                visitDate: new Date(),
                department: doctor.department,
                diagnosis: condition,
                treatment: "Prescribed medication & rest",
                doctor: doctor._id,
                hospital: hospital._id,
              },
            ],
          });

          // Add appointment under doctor
          doctor.appointments.push({
            patientName: patient.name,
            condition,
            appointmentDate: new Date(),
            status: "Completed",
          });

          console.log(`👩‍⚕️ Patient: ${patient.name} (${patient.patientID}) for ${doctor.name}`);
        }

        await doctor.save();
      }
    }

    console.log("\n🎉 Dummy doctors & patients generation complete!");
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error generating dummy data:", err);
    mongoose.connection.close();
  }
}

main();
