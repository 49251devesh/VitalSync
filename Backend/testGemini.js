require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

(async () => {
  try {
    const genAI = new GoogleGenerativeAI("AIzaSyCe2eB4-DRteKc0WKdVRNHYUnkXEOb1DTM");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello, Gemini is working!");
    console.log(result.response.text());
  } catch (err) {
    console.error("Gemini test error:", err);
  }
})();
