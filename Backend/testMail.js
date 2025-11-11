// require("dotenv").config();
// const nodemailer = require("nodemailer");
// const path = require("path");

// // ✅ Create reusable transporter (uses Gmail App Password)
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// async function sendHospitalRegistrationMail({ to, name, hospitalId }) {
//   try {
//     // ✅ Absolute path to logo in frontend/public
//     const logoPath = path.join(__dirname, "../frontend/healthcare/public/logo.png");

//     console.log("📧 Sending registration email to:", to);
//     console.log("🖼️ Using logo path:", logoPath);

//     const mailOptions = {
//       from: `"VitalSync System" <${process.env.EMAIL_USER}>`,
//       to,
//       subject: `🏥 Welcome to VitalSync — Your Hospital ID`,
//       html: `
//         <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f3f6fa; padding: 25px;">
//           <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">

//             <div style="text-align: center; margin-bottom: 20px;">
//               <img src="cid:vitalsynclogo" alt="VitalSync Logo" style="width: 140px; height: auto;" />
//             </div>

//             <h2 style="color: #2563eb; text-align: center; margin-bottom: 15px;">
//               Welcome, ${name}!
//             </h2>

//             <p style="color:#333; font-size: 15px; line-height: 1.6; text-align: center;">
//               Thank you for registering your hospital with <strong>VitalSync</strong>.<br/>
//               Your hospital is now part of a connected, digital healthcare ecosystem.
//             </p>

//             <div style="text-align:center; margin: 25px 0;">
//               <p style="font-size: 16px; margin-bottom: 5px;">Your unique Hospital ID:</p>
//               <h2 style="background:#e0f2fe; color:#1e3a8a; padding:12px 20px; border-radius:8px; display:inline-block;">
//                 ${hospitalId}
//               </h2>
//             </div>

//             <p style="color:#555; font-size:14px; text-align:center;">
//               You can now log in to your <b>Hospital Dashboard</b> using this ID.
//             </p>

//             <div style="text-align:center; margin-top:25px;">
//               <a href="http://localhost:5173"
//                 style="background:#2563eb; color:white; padding:12px 25px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">
//                 🔑 Go to Login
//               </a>
//             </div>

//             <hr style="margin:30px 0; border:none; border-top:1px solid #e5e7eb;">

//             <p style="font-size:12px; color:#888; text-align:center;">
//               This email was sent by VitalSync Healthcare System.<br>
//               If you did not request this, please ignore this message.
//             </p>
//           </div>
//         </div>
//       `,
//       attachments: [
//         {
//           filename: "vitalsync-logo.png",
//           path: logoPath, // ✅ Load image from frontend/public
//           cid: "vitalsynclogo", // must match `src="cid:vitalsynclogo"`
//         },
//       ],
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log("✅ Email sent successfully:", info.response);
//   } catch (err) {
//     console.error("❌ Email sending failed:", err.message);
//     if (err.response) console.error("📩 Gmail Response:", err.response);
//   }
// }

// // 🧪 Call function with dummy test data
// sendHospitalRegistrationMail({
//   to: "jeevanreddychalla77@gmail.com",
//   name: "Apollo Hospitals",
//   hospitalId: "HOSP-12345",
// });
require("dotenv").config();
const nodemailer = require("nodemailer");

async function sendTest() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"VitalSync Test" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: "✅ Test Email from VitalSync",
    text: "If you see this, your Gmail SMTP works perfectly!",
  });

  console.log("📧 Test email sent successfully!");
}

sendTest().catch(console.error);
