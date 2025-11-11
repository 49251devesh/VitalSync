const jwt = require("jsonwebtoken");
const Patient = require("../model/patient");

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ success: false, message: "Authorization header missing" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findById(decoded.id);
    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    req.patient = patient;
    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
