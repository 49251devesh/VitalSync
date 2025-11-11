const nodemailer = require("nodemailer");

exports.sendAppointmentEmail = async (to, { patientName, doctorName, hospitalName, date, timeSlot }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "Appointment Confirmation",
    html: `
      <h3>✅ Appointment Confirmed</h3>
      <p>Dear ${patientName},</p>
      <p>Your appointment has been booked successfully:</p>
      <ul>
        <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
        <li><strong>Hospital:</strong> ${hospitalName}</li>
        <li><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${timeSlot}</li>
      </ul>
      <p>Thank you for choosing our service!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
