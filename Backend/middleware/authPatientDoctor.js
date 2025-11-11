// middleware/authPatientDoctor.js
const jwt = require("jsonwebtoken");
const Doctor = require("../model/Doctor");
const Patient = require("../model/patient");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // patient trying to access their data
    if (decoded.role === "patient") {
      req.user = { id: decoded.id, role: "patient" };
      return next();
    }

    // doctor trying to access
    const doctor = await Doctor.findById(decoded.id);
    if (doctor) {
      req.user = { id: doctor._id, role: "doctor" };
      return next();
    }

    res.status(403).json({ message: "Unauthorized" });
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};
