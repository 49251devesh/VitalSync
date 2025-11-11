// ✅ Dependencies
const fs = require("fs");
const Tesseract = require("tesseract.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ✅ Load Gemini API
console.log("🔑 Gemini Key:", process.env.GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCe2eB4-DRteKc0WKdVRNHYUnkXEOb1DTM");

/* ----------------------------------------------
   🧠 STEP 1️⃣ — Extract text from image/PDF
---------------------------------------------- */
async function extractTextFromFile(filePath) {
  const { data: { text } } = await Tesseract.recognize(filePath, "eng");
  console.log("🧾 OCR Extracted Text (first 200 chars):", text.slice(0, 200));
  return text.trim();
}

/* ----------------------------------------------
   🧠 STEP 2️⃣ — Parse using Gemini LLM
---------------------------------------------- */
async function analyzeReportText(rawText) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an intelligent medical data structuring assistant.

You will receive a raw medical report text extracted by OCR.
Analyze the content carefully and return a **valid JSON object** with the following schema:

{
  "patientID": "PID-XXXX",
  "name": "string (if found)",
  "age": "number (if found)",
  "gender": "Male/Female/Other/Unknown",
  "department": "string (derive from context, e.g., Neurology, Cardiology)",
  "diagnosis": "core diagnosis summary",
  "prescriptions": [
    {
      "parsedData": {
        "diagnosis": "string",
        "observations": [
          { "key": "string", "value": "string" }
        ],
        "medicines": [
          { "name": "string", "dosage": "string", "duration": "string" }
        ]
      }
    }
  ],
  "visitHistory": [
    {
      "department": "string",
      "diagnosis": "string",
      "observations": [
        { "key": "string", "value": "string" }
      ]
    }
  ],
  "reports": [
    {
      "reportType": "string (e.g., MRI, CT, Blood Test)",
      "findings": [
        { "key": "string", "value": "string" }
      ],
      "summary": "string"
    }
  ]
}

🩺 Rules:
- Be **strictly JSON** (no extra text, no markdown, no explanations).
- Fill missing values with null or empty lists.
- Derive department from symptoms or report type if possible.
- Avoid hallucinations — only use data mentioned or implied in the text.

Example Output:
{
  "patientID": "PID-AB1234",
  "name": "John Doe",
  "age": 45,
  "gender": "Male",
  "department": "Cardiology",
  "diagnosis": "Coronary artery disease",
  "prescriptions": [
    {
      "parsedData": {
        "diagnosis": "Coronary artery disease",
        "observations": [
          { "key": "BP", "value": "140/90" },
          { "key": "ECG", "value": "ST depression" }
        ],
        "medicines": [
          { "name": "Atorvastatin", "dosage": "10mg/day", "duration": "5 days" }
        ]
      }
    }
  ],
  "visitHistory": [
    {
      "department": "Cardiology",
      "diagnosis": "Ischemic heart disease",
      "observations": [
        { "key": "ECG", "value": "ST depression" }
      ]
    }
  ],
  "reports": [
    {
      "reportType": "ECG",
      "findings": [
        { "key": "ST segment", "value": "depressed" }
      ],
      "summary": "Possible ischemic changes."
    }
  ]
}

Now extract data from this report text:
"""${rawText}"""
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    // 🧹 Clean markdown-style wrapping (Gemini often wraps JSON)
    const cleaned = text.replace(/```json|```/g, "").trim();
    const json = JSON.parse(cleaned);
    console.log("✅ Parsed JSON structure received from Gemini");
    return json;
  } catch (err) {
    console.error("⚠️ Gemini returned invalid JSON. Raw output:", text);
    return {
      patientID: `PID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      department: "General",
      diagnosis: "Under Review",
      prescriptions: [],
      visitHistory: [],
      reports: []
    };
  }
}

/* ----------------------------------------------
   🧠 STEP 3️⃣ — Unified helper to parse a prescription/report file
---------------------------------------------- */
async function parsePrescriptionWithAI(filePath) {
  try {
    const text = await extractTextFromFile(filePath);
    const parsed = await analyzeReportText(text);
    return parsed;
  } catch (err) {
    console.error("❌ Error in parsePrescriptionWithAI:", err.message);
    return {
      patientID: `PID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      department: "General",
      diagnosis: "Parsing Failed",
      prescriptions: [],
      visitHistory: [],
      reports: []
    };
  }
}

/* ---------------------------------------------- */
module.exports = { parsePrescriptionWithAI };
