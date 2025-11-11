const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const hospitalSchema = new mongoose.Schema({
  hospitalId: {
    type: String,
    unique: true,
    default: () => `HOSP-${uuidv4().split("-")[0].toUpperCase()}`,
  },
  name: { type: String, required: true },
  address: {
    line1: String,
    city: String,
    state: String,
    pincode: String,
  },
  contact: {
    phone: String,
    email: String,
  },
  departments: [String],
  specialties: [String],
  equipment: [{ name: String, quantity: Number }],
  rating: { type: Number, default: () => parseFloat((Math.random() * 2 + 3).toFixed(1)) },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" },
  },
});

hospitalSchema.index({ name: 1, "location.coordinates": 1 }, { unique: true });

module.exports = mongoose.model("Hospital", hospitalSchema);
