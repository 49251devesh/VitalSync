const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    specialization: String,
    department: String,
    experience: { type: Number, default: 0 },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    hospitalName: String,
    hospitalCode: String,

    doctorId: { type: String, unique: true, required: true },

    patientsTreated: { type: Number, default: 0 },
    contact: {
      phone: String,
      email: String,
    },

    appointments: [
      {
        patientName: String,
        condition: String,
        appointmentDate: Date,
        status: {
          type: String,
          enum: ["Upcoming", "Completed", "Cancelled"],
          default: "Upcoming",
        },
      },
    ],
  },
  { timestamps: true }
);

doctorSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("Doctor", doctorSchema);
