const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const multer = require("multer");
const Hospital = require("./model/Hospital");
const patientRoutes = require("./routes/patientRoutes");
require("dotenv").config();
const { getDistance } = require("./utils/utils");
const { generateHospitalExtras } = require("./utils/generateHospitalsExtras");
const { parsePrescriptionWithAI } = require("./utils/ocrAndLLM");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use("/uploads", express.static("uploads"));
mongoose.connect("mongodb://127.0.0.1:27017/vitalsync", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));
//uplods here summary
app.use("/uploads", express.static("uploads"));
//routes
app.use("/api/hospitals", require("./routes/hospitalRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", require("./routes/appointmentRoutes"));

const departmentsList = [
  ["Cardiology", "Neurology", "Orthopedics", "Emergency"],
  ["Pediatrics", "Dermatology", "ENT", "General Medicine"],
  ["Oncology", "Gastroenterology", "Urology", "Psychiatry"],
  ["Gynecology", "Ophthalmology", "Respiratory", "Physiotherapy"],
  ["Radiology", "Pathology", "Surgery", "Anesthesiology"],
];

const specialtiesList = [
  ["Heart", "Brain", "Bones", "Trauma"],
  ["Children", "Skin", "Ear-Nose-Throat", "Fever"],
  ["Cancer", "Digestive", "Kidney", "Mental Health"],
  ["Women Health", "Eye", "Lungs", "Rehabilitation"],
  ["Scanning", "Lab Tests", "Operations", "Anesthesia"],
];

// Utility: map patient condition to relevant department/specialty
function mapConditionToDeptSpecialty(condition) {
  const cond = condition.toLowerCase();
  const mapping = {
    heart: ["Cardiology", "Heart", "Cardio"],
    brain: ["Neurology", "Brain"],
    bones: ["Orthopedics", "Bones"],
    trauma: ["Emergency", "Trauma"],
    children: ["Pediatrics", "Children"],
    skin: ["Dermatology", "Skin"],
    ear: ["ENT", "Ear-Nose-Throat"],
    fever: ["General Medicine", "Fever"],
    cancer: ["Oncology", "Cancer"],
    digestive: ["Gastroenterology", "Digestive"],
    kidney: ["Urology", "Kidney"],
    mental: ["Psychiatry", "Mental Health"],
    women: ["Gynecology", "Women Health"],
    eye: ["Ophthalmology", "Eye"],
    lungs: ["Respiratory", "Lungs"],
    rehab: ["Physiotherapy", "Rehabilitation"],
    scanning: ["Radiology", "Scanning"],
    lab: ["Pathology", "Lab Tests"],
    surgery: ["Surgery", "Operations"],
    anesthesia: ["Anesthesiology", "Anesthesia"],
  };

  // Return all matches
  return Object.keys(mapping)
    .filter(k => cond.includes(k))
    .map(k => mapping[k])
    .flat();
}

// POST /newlog
app.post("/newlog", async (req, res) => {
  try {
    const { patientCondition, location } = req.body;
    if (!patientCondition || !location) {
      return res.status(400).json({ success: false, message: "Missing patientCondition or location" });
    }

    const relevantKeywords = mapConditionToDeptSpecialty(patientCondition);

    const overpassQuery = `
      [out:json];
      node["amenity"="hospital"](around:3000,${location.latitude},${location.longitude});
      out;
    `;
    const overpassUrl = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    const response = await axios.get(overpassUrl);

    const elements = response.data.elements || [];
    if (!elements || elements.length === 0) {
      return res.status(200).json({ success: true, message: "No hospitals found nearby", hospitals: [] });
    }

    const hospitalsData = elements.map(el => {
      const randIndex = Math.floor(Math.random() * departmentsList.length);
      const extras = generateHospitalExtras() || { equipment: [], rating: 0 };

      const departments = departmentsList[randIndex] || [];
      const specialties = specialtiesList[randIndex] || [];

      // Defensive checks
      const tags = el.tags || {};
      const equipmentArr = Array.isArray(extras.equipment) ? extras.equipment : [];

      const matchedDepartments = departments.filter(d => relevantKeywords.includes(d));
      const matchedSpecialties = specialties.filter(s => relevantKeywords.includes(s));

      return {
        name: tags.name || `Hospital ${Math.floor(Math.random() * 10000)}`,
        address: {
          line1: tags["addr:street"] || `Street ${Math.floor(Math.random() * 100)}`,
          city: tags["addr:city"] || `City ${Math.floor(Math.random() * 100)}`,
          state: tags["addr:state"] || `State ${Math.floor(Math.random() * 100)}`,
          pincode: tags["addr:postcode"] || `${Math.floor(100000 + Math.random() * 900000)}`,
        },
        contact: {
          phone: tags.phone || tags["contact:phone"] || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          email: tags["contact:email"] || `contact${Math.floor(Math.random() * 1000)}@hospital.com`,
        },
        departments,
        specialties,
        equipment: equipmentArr.map(name => ({ name })),
        rating: extras.rating || 0,
        location: { type: "Point", coordinates: [el.lon, el.lat] },
        distance: getDistance(location.latitude, location.longitude, el.lat, el.lon),
        matchedDepartments,
        matchedSpecialties,
        isTopHospital: /KIMS|Medicare/i.test(tags.name || ""),
      };
    });

    // Upsert hospitals
    const bulkOps = hospitalsData.map(hospital => ({
      updateOne: {
        filter: { "location.coordinates": hospital.location.coordinates },
        update: { $set: hospital },
        upsert: true,
      }
    }));
    await Hospital.bulkWrite(bulkOps);


    const allHospitals = await Hospital.find();
    const nearestHospitals = allHospitals
      .filter(h => h.location && Array.isArray(h.location.coordinates) && h.location.coordinates.length === 2)
      .map(h => {
        const [lon, lat] = h.location.coordinates;
        const distance = getDistance(location.latitude, location.longitude, lat, lon);
        return { ...h.toObject(), distance };
      })
      .sort((a, b) => {
        if (a.isTopHospital && !b.isTopHospital) return -1;
        if (!a.isTopHospital && b.isTopHospital) return 1;

        if ((a.matchedDepartments?.length || 0) && !(b.matchedDepartments?.length || 0)) return -1;
        if (!(a.matchedDepartments?.length || 0) && (b.matchedDepartments?.length || 0)) return 1;

        return a.distance - b.distance;
      })
      .slice(0, 10);


    const keepIds = nearestHospitals.map(h => h._id);
    if (keepIds.length > 0) await Hospital.deleteMany({ _id: { $nin: keepIds } });

    res.json({ success: true, hospitals: nearestHospitals });

  } catch (err) {
    console.error("❌ /newlog error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /gethospitals?lat=12.95&lon=77.57&condition=fever
app.get("/gethospitals", async (req, res) => {
  try {
    const { lat, lon, condition } = req.query;
    if (!lat || !lon) return res.status(400).json({ success: false, message: "Missing lat/lon" });

    const hospitals = await Hospital.find();

    const relevantKeywords = condition ? mapConditionToDeptSpecialty(condition) : [];

    const hospitalsWithDistance = hospitals.map(h => {
      const distance = getDistance(parseFloat(lat), parseFloat(lon), h.location.coordinates[1], h.location.coordinates[0]);
      const matchedDepartments = h.departments.filter(d => relevantKeywords.includes(d));
      const matchedSpecialties = h.specialties.filter(s => relevantKeywords.includes(s));
      const isTopHospital = /KIMS|Medicare/i.test(h.name);
      return { ...h.toObject(), distance, matchedDepartments, matchedSpecialties, isTopHospital };
    });

    hospitalsWithDistance.sort((a, b) => {
      if (a.isTopHospital && !b.isTopHospital) return -1;
      if (!a.isTopHospital && b.isTopHospital) return 1;

      if (a.matchedDepartments.length && !b.matchedDepartments.length) return -1;
      if (!a.matchedDepartments.length && b.matchedDepartments.length) return 1;

      return a.distance - b.distance;
    });

    res.json({ success: true, hospitals: hospitalsWithDistance.slice(0, 10) });
  } catch (err) {
    console.error("❌ /gethospitals error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
const upload = multer({ dest: "uploads/" });

// POST /api/ai/analyze → forwards image to Flask AI microservice
app.post("/api/ai/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    }

    const flaskUrl = "http://localhost:5001/analyze";
    const form = new FormData();
    form.append("image", fs.createReadStream(req.file.path));

    const flaskResponse = await axios.post(flaskUrl, form, {
      headers: form.getHeaders(),
      timeout: 300000,
    });

    // Clean up temporary upload file
    fs.unlink(req.file.path, () => { });

    res.json({
      success: true,
      source: "flask-ai",
      analysis: flaskResponse.data,
    });
  } catch (err) {
    console.error("❌ Flask AI Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to analyze image with AI",
      error: err.message,
    });
  }
});
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
// // ===============================
// // 🏥 VitalSync Server (Full Stack)
// // ===============================
// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const axios = require("axios");
// const dotenv = require("dotenv");
// const fs = require("fs");
// const FormData = require("form-data");
// const multer = require("multer");
// const Hospital = require("./model/Hospital");
// const patientRoutes = require("./routes/patientRoutes");
// const { getDistance } = require("./utils/utils");
// const { generateHospitalExtras } = require("./utils/generateHospitalsExtras");

// dotenv.config();
// const app = express();
// app.use(express.json());
// app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// // ✅ MongoDB Connection
// mongoose
//   .connect("mongodb://127.0.0.1:27017/vitalsync", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch((err) => console.error("❌ MongoDB Error:", err));

// // ✅ Static file route
// app.use("/uploads", express.static("uploads"));

// // ✅ Core API Routes
// app.use("/api/hospitals", require("./routes/hospitalRoutes"));
// app.use("/api/doctors", require("./routes/doctorRoutes"));
// app.use("/api/patients", patientRoutes);
// app.use("/api/appointments", require("./routes/appointmentRoutes"));

// // =======================================
// // 🧠 AI ANALYZER PROXY (Flask Integration)
// // =======================================
// const upload = multer({ dest: "uploads/" });

// // POST /api/ai/analyze → forwards image to Flask AI microservice
// app.post("/api/ai/analyze", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No image uploaded" });
//     }

//     const flaskUrl = "http://localhost:5001/analyze";
//     const form = new FormData();
//     form.append("image", fs.createReadStream(req.file.path));

//     const flaskResponse = await axios.post(flaskUrl, form, {
//       headers: form.getHeaders(),
//       timeout: 300000,
//     });

//     // Clean up temporary upload file
//     fs.unlink(req.file.path, () => {});

//     res.json({
//       success: true,
//       source: "flask-ai",
//       analysis: flaskResponse.data,
//     });
//   } catch (err) {
//     console.error("❌ Flask AI Error:", err.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to analyze image with AI",
//       error: err.message,
//     });
//   }
// });

// // ============================================================
// // 🧭 Nearby Hospital Finder (Smart condition-based recommendations)
// // ============================================================
// const departmentsList = [
//   ["Cardiology", "Neurology", "Orthopedics", "Emergency"],
//   ["Pediatrics", "Dermatology", "ENT", "General Medicine"],
//   ["Oncology", "Gastroenterology", "Urology", "Psychiatry"],
//   ["Gynecology", "Ophthalmology", "Respiratory", "Physiotherapy"],
//   ["Radiology", "Pathology", "Surgery", "Anesthesiology"],
// ];

// const specialtiesList = [
//   ["Heart", "Brain", "Bones", "Trauma"],
//   ["Children", "Skin", "Ear-Nose-Throat", "Fever"],
//   ["Cancer", "Digestive", "Kidney", "Mental Health"],
//   ["Women Health", "Eye", "Lungs", "Rehabilitation"],
//   ["Scanning", "Lab Tests", "Operations", "Anesthesia"],
// ];

// // Utility: condition → department/specialty
// function mapConditionToDeptSpecialty(condition) {
//   const cond = condition.toLowerCase();
//   const mapping = {
//     heart: ["Cardiology", "Heart"],
//     brain: ["Neurology", "Brain"],
//     bones: ["Orthopedics", "Bones"],
//     trauma: ["Emergency", "Trauma"],
//     children: ["Pediatrics", "Children"],
//     skin: ["Dermatology", "Skin"],
//     ear: ["ENT", "Ear-Nose-Throat"],
//     fever: ["General Medicine", "Fever"],
//     cancer: ["Oncology", "Cancer"],
//     digestive: ["Gastroenterology", "Digestive"],
//     kidney: ["Urology", "Kidney"],
//     mental: ["Psychiatry", "Mental Health"],
//     women: ["Gynecology", "Women Health"],
//     eye: ["Ophthalmology", "Eye"],
//     lungs: ["Respiratory", "Lungs"],
//     rehab: ["Physiotherapy", "Rehabilitation"],
//     scanning: ["Radiology", "Scanning"],
//     lab: ["Pathology", "Lab Tests"],
//     surgery: ["Surgery", "Operations"],
//     anesthesia: ["Anesthesiology", "Anesthesia"],
//   };

//   return Object.keys(mapping)
//     .filter((k) => cond.includes(k))
//     .map((k) => mapping[k])
//     .flat();
// }

// // ===================================================
// // POST /newlog → Map condition to nearby hospitals
// // ===================================================
// app.post("/newlog", async (req, res) => {
//   try {
//     const { patientCondition, location } = req.body;
//     if (!patientCondition || !location) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing patientCondition or location",
//       });
//     }

//     const relevantKeywords = mapConditionToDeptSpecialty(patientCondition);

//     // Fetch nearby hospitals via OpenStreetMap
//     const overpassQuery = `
//       [out:json];
//       node["amenity"="hospital"](around:3000,${location.latitude},${location.longitude});
//       out;
//     `;
//     const overpassUrl = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(
//       overpassQuery
//     )}`;
//     const response = await axios.get(overpassUrl);

//     const elements = response.data.elements || [];
//     if (!elements.length) {
//       return res.json({
//         success: true,
//         message: "No hospitals found nearby",
//         hospitals: [],
//       });
//     }

//     // Build hospital entries
//     const hospitalsData = elements.map((el) => {
//       const randIndex = Math.floor(Math.random() * departmentsList.length);
//       const extras = generateHospitalExtras() || { equipment: [], rating: 0 };
//       const departments = departmentsList[randIndex];
//       const specialties = specialtiesList[randIndex];
//       const tags = el.tags || {};
//       const matchedDepartments = departments.filter((d) =>
//         relevantKeywords.includes(d)
//       );
//       const matchedSpecialties = specialties.filter((s) =>
//         relevantKeywords.includes(s)
//       );

//       return {
//         name: tags.name || `Hospital ${Math.floor(Math.random() * 10000)}`,
//         address: {
//           line1:
//             tags["addr:street"] || `Street ${Math.floor(Math.random() * 100)}`,
//           city: tags["addr:city"] || `City ${Math.floor(Math.random() * 100)}`,
//           state:
//             tags["addr:state"] || `State ${Math.floor(Math.random() * 100)}`,
//           pincode:
//             tags["addr:postcode"] ||
//             `${Math.floor(100000 + Math.random() * 900000)}`,
//         },
//         contact: {
//           phone:
//             tags.phone ||
//             tags["contact:phone"] ||
//             `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
//           email:
//             tags["contact:email"] ||
//             `contact${Math.floor(Math.random() * 1000)}@hospital.com`,
//         },
//         departments,
//         specialties,
//         equipment: extras.equipment.map((e) => ({ name: e })),
//         rating: extras.rating,
//         location: { type: "Point", coordinates: [el.lon, el.lat] },
//         distance: getDistance(
//           location.latitude,
//           location.longitude,
//           el.lat,
//           el.lon
//         ),
//         matchedDepartments,
//         matchedSpecialties,
//         isTopHospital: /KIMS|Medicare/i.test(tags.name || ""),
//       };
//     });

//     // Upsert all hospitals
//     const bulkOps = hospitalsData.map((hospital) => ({
//       updateOne: {
//         filter: { "location.coordinates": hospital.location.coordinates },
//         update: { $set: hospital },
//         upsert: true,
//       },
//     }));
//     await Hospital.bulkWrite(bulkOps);

//     // Get and sort top 10 nearby
//     const allHospitals = await Hospital.find();
//     const nearestHospitals = allHospitals
//       .filter(
//         (h) =>
//           h.location &&
//           Array.isArray(h.location.coordinates) &&
//           h.location.coordinates.length === 2
//       )
//       .map((h) => {
//         const [lon, lat] = h.location.coordinates;
//         const distance = getDistance(location.latitude, location.longitude, lat, lon);
//         return { ...h.toObject(), distance };
//       })
//       .sort((a, b) => {
//         if (a.isTopHospital && !b.isTopHospital) return -1;
//         if (!a.isTopHospital && b.isTopHospital) return 1;
//         if ((a.matchedDepartments?.length || 0) && !(b.matchedDepartments?.length || 0))
//           return -1;
//         if (!(a.matchedDepartments?.length || 0) && (b.matchedDepartments?.length || 0))
//           return 1;
//         return a.distance - b.distance;
//       })
//       .slice(0, 10);

//     res.json({ success: true, hospitals: nearestHospitals });
//   } catch (err) {
//     console.error("❌ /newlog error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // ===================================================
// // GET /gethospitals → Retrieve nearest hospitals
// // ===================================================
// app.get("/gethospitals", async (req, res) => {
//   try {
//     const { lat, lon, condition } = req.query;
//     if (!lat || !lon)
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing lat/lon" });

//     const hospitals = await Hospital.find();
//     const relevantKeywords = condition
//       ? mapConditionToDeptSpecialty(condition)
//       : [];

//     const hospitalsWithDistance = hospitals.map((h) => {
//       const distance = getDistance(
//         parseFloat(lat),
//         parseFloat(lon),
//         h.location.coordinates[1],
//         h.location.coordinates[0]
//       );
//       const matchedDepartments = h.departments.filter((d) =>
//         relevantKeywords.includes(d)
//       );
//       const matchedSpecialties = h.specialties.filter((s) =>
//         relevantKeywords.includes(s)
//       );
//       const isTopHospital = /KIMS|Medicare/i.test(h.name);
//       return {
//         ...h.toObject(),
//         distance,
//         matchedDepartments,
//         matchedSpecialties,
//         isTopHospital,
//       };
//     });

//     hospitalsWithDistance.sort((a, b) => {
//       if (a.isTopHospital && !b.isTopHospital) return -1;
//       if (!a.isTopHospital && b.isTopHospital) return 1;
//       if (a.matchedDepartments.length && !b.matchedDepartments.length) return -1;
//       if (!a.matchedDepartments.length && b.matchedDepartments.length) return 1;
//       return a.distance - b.distance;
//     });

//     res.json({
//       success: true,
//       hospitals: hospitalsWithDistance.slice(0, 10),
//     });
//   } catch (err) {
//     console.error("❌ /gethospitals error:", err.message);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // ===================================================
// // 🚀 Start Server
// // ===================================================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//   console.log(`🚀 Server running at http://localhost:${PORT}`)
// );
