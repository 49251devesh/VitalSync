const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendPatientIDEmail(to, name, patientID) {
  const mailOptions = {
    from: `"VitalSync Hospital" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🩺 Your Patient ID - VitalSync Hospital",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; background: #f7f8fa;">
        <h2>Hello ${name},</h2>
        <p>Thank you for registering with <strong>VitalSync Hospital</strong>.</p>
        <p>Your unique <b>Patient ID</b> is:</p>
        <h3 style="color:#007bff;">${patientID}</h3>
        <p>You can use this ID to log in to the patient portal.</p>
        <br/>
        <p>Warm regards,<br/>VitalSync Support Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendPatientIDEmail };
