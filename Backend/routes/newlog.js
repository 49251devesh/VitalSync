/**
 * POST /newlog
 * Finds hospitals near user location (≤7 km),
 * stores them with randomized departments & specialties,
 * keeps only 10 nearest hospitals (≤5 km) in DB, removes others.
 */
const express = require("express");
const axios = require("axios");
const Hospital = require("../model/Hospital");
const { generateHospitalExtras } = require("../utils/generateHospitalsExtras");
const { getDistance } = require("../utils/utils");

const router = express.Router();

/**
 * POST /newlog
 * Fetches hospitals near user, adds dynamic departments/specialties, keeps only nearest 10 hospitals ≤5 km.
 */
router.post("/newlog", async (req, res) => {
  try {
    const { patientCondition, location } = req.body;

    if (!patientCondition || !location) {
      return res.status(400).json({
        success: false,
        message: "Missing patientCondition or location fields.",
      });
    }

    const { latitude, longitude } = location;

    // STEP 1: Fetch hospitals from Overpass API (7 km radius)
    const query = `
      [out:json][timeout:30];
      (
        node["amenity"="hospital"](around:7000,${latitude},${longitude});
        way["amenity"="hospital"](around:7000,${latitude},${longitude});
        relation["amenity"="hospital"](around:7000,${latitude},${longitude});
      );
      out center tags;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      query
    )}`;
    const { data } = await axios.get(url);
    const elements = data.elements || [];

    if (!elements.length) {
      return res.status(200).json({
        success: true,
        message: "No hospitals found within 7 km radius.",
        hospitals: [],
      });
    }

    // Dynamic departments & specialties arrays
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

    // STEP 2: Map & create hospital objects dynamically
    const hospitalsData = elements
      .filter((el) => el.center?.lat && el.center?.lon)
      .map((el) => {
        const tags = el.tags || {};
        const extras = generateHospitalExtras();
        const center = el.center;

        const randIndex = Math.floor(Math.random() * departmentsList.length);

        return {
          name: tags.name || `Hospital ${Math.floor(Math.random() * 10000)}`,
          address: {
            line1: tags["addr:street"] || "Unknown Street",
            city: tags["addr:city"] || "Unknown City",
            state: tags["addr:state"] || "Unknown State",
            pincode: tags["addr:postcode"] || "",
          },
          contact: {
            phone:
              tags.phone ||
              tags["contact:phone"] ||
              `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            email:
              tags["contact:email"] ||
              `contact${Math.floor(Math.random() * 1000)}@hospital.com`,
          },
          departments: departmentsList[randIndex],
          specialties: specialtiesList[randIndex],
          equipment: extras.equipment.map((name) => ({ name, quantity: 1 })),
          rating: Number(extras.rating),
          location: {
            type: "Point",
            coordinates: [center.lon, center.lat],
          },
        };
      });

    // STEP 3: Save hospitals (duplicates allowed)
    await Hospital.insertMany(hospitalsData, { ordered: false });

    // STEP 4: Condition → department mapping
    const conditionMappings = {
      heart: "Cardiology",
      cardiac: "Cardiology",
      brain: "Neurology",
      neuro: "Neurology",
      bone: "Orthopedics",
      fracture: "Orthopedics",
      injury: "Emergency",
      accident: "Emergency",
      child: "Pediatrics",
      skin: "Dermatology",
      breathing: "Respiratory",
      fever: "General Medicine",
      kidney: "Urology",
      cancer: "Oncology",
      stomach: "Gastroenterology",
      woman: "Gynecology",
      mental: "Psychiatry",
    };

    const matchedKey = Object.keys(conditionMappings).find((key) =>
      patientCondition.toLowerCase().includes(key)
    );
    const matchedDept = conditionMappings[matchedKey] || "General Medicine";

    // STEP 5: Filter ≤5 km, sort, and keep only 10 nearest hospitals
    // const allHospitals = await Hospital.find();
    // const filtered = allHospitals
    //   .map((h) => {
    //     const [lon, lat] = h.location.coordinates;
    //     return {
    //       ...h.toObject(),
    //       distance: getDistance(latitude, longitude, lat, lon),
    //     };
    //   })
    //   .filter((h) => h.distance <= 5)
    //   .sort((a, b) => a.distance - b.distance)
    //   .slice(0, 10);
    const allHospitals = await Hospital.find();

    const filtered = allHospitals
      .filter(
        (h) =>
          h.location &&
          Array.isArray(h.location.coordinates) &&
          h.location.coordinates.length === 2
      )
      .map((h) => {
        const [lon, lat] = h.location.coordinates;
        return {
          ...h.toObject(),
          distance: getDistance(latitude, longitude, lat, lon),
        };
      })
      .filter((h) => h.distance <= 5 && !isNaN(h.distance))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    // STEP 6: Remove other hospitals beyond nearest 10
    const keepIds = filtered.map((h) => h._id);
    await Hospital.deleteMany({ _id: { $nin: keepIds } });

    // STEP 7: Response
    return res.status(200).json({
      success: true,
      matchedCondition: matchedDept,
      count: filtered.length,
      hospitals: filtered,
    });
  } catch (error) {
console.error("❌ /newlog error details:", error.name, error.message);
if (error.errors) console.error("Validation errors:", error.errors);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
      error: error.stack,
    });
  }
});

module.exports = router;
