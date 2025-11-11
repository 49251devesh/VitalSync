const mongoose = require("mongoose");

const accessLogSchema = new mongoose.Schema({
  actorId: String,
  actorRole: String,
  patientId: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  reason: String,
});

module.exports=mongoose.model("AccessLog", accessLogSchema);
