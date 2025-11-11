from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import numpy as np
import torch, re, google.generativeai as genai, os

app = Flask(__name__)

# === Load Models ===
cnn = load_model("./model/injury_detector_v3.h5", compile=False)
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
blip = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")

classes = [
    "Abrasions", "Bruises", "Burns", "Cut", "Diabetic Wounds",
    "Laseration", "Normal", "Pressure Wounds", "Surgical Wounds", "Venous Wounds"
]

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini = genai.GenerativeModel("models/gemini-2.5-flash")

# === Caption Cleaner ===
def neutralize_caption(caption: str):
    caption = caption.lower()
    replacements = {
        r"\bwound\b": "surface area",
        r"\bcut\b": "fine surface line",
        r"\bbleed(ing)?\b": "discoloration",
        r"\bred\b": "light area",
        r"\bbruise(d)?\b": "minor patch",
        r"\bburn(ed|s)?\b": "sensitive patch"
    }
    for pattern, repl in replacements.items():
        caption = re.sub(pattern, repl, caption)
    return caption

# === Severity Estimation ===
def estimate_severity(label, confidence, caption):
    desc = caption.lower()
    severe_words = ["deep", "extensive", "heavy", "open", "large", "blister", "intense", "raw"]
    moderate_words = ["visible", "patch", "irritated", "swollen", "discoloration", "moderate", "mild"]

    if confidence > 90 or any(w in desc for w in severe_words):
        return "Severe"
    elif 60 <= confidence <= 90 or any(w in desc for w in moderate_words):
        return "Moderate"
    else:
        return "Mild"

# === Fallback Generator ===
def generate_fallback_summary(label, caption, severity):
    label_lower = label.lower()
    # safeguard if severity is not one of the expected values
    base_days = {"Mild": "3–5", "Moderate": "5–7", "Severe": "10–14"}.get(severity, "")
    risk = {"Mild": "Low", "Moderate": "Medium", "Severe": "High"}.get(severity, "")

    def block(desc, care, include_healing=True):
        """Helper: builds structured summary; skips healing/risk for normal cases."""
        text = f"""
🩺 Detailed Analysed Report
1. Severity: {severity}
2. Description: {desc}
3. Suggested Action: {care}
""".strip()

        if include_healing and base_days:
            text += f"""
4. Estimated Healing Duration: {base_days} days
5. Infection Risk: {risk}
""".rstrip()
        return text

    # === Normal / Healthy surface ===
    if label_lower == "normal":
        return block(
            "Healthy skin surface with no visible injury signs.",
            "No medical care required; maintain hygiene and hydration.",
            include_healing=False
        )

    # === Burns ===
    elif "burn" in label_lower:
        if severity == "Severe":
            return block("Extensive sensitive patch with possible blistering",
                         "Cool gently with clean water, keep sterile, avoid creams, seek supervision if spreading.")
        elif severity == "Moderate":
            return block("Localized irritated sensitive patch",
                         "Cool the area, avoid friction, and apply sterile breathable cover.")
        else:
            return block("Light sensitive patch with mild irritation",
                         "Keep dry and clean; avoid exposure to heat or friction.")

    # === Cuts / Lacerations ===
    elif "cut" in label_lower or "laser" in label_lower:
        if severity == "Severe":
            return block("Deep surface line with visible separation",
                         "Clean gently, apply sterile dressing, minimize movement, monitor for redness.")
        elif severity == "Moderate":
            return block("Moderate surface line with slight gap",
                         "Clean with mild antiseptic and protect with breathable cover.")
        else:
            return block("Fine surface line visible",
                         "Rinse with clean water, apply mild protection layer, keep dry.")

    # === Bruises ===
    elif "bruise" in label_lower:
        if severity == "Severe":
            return block("Dark extended patch with possible swelling",
                         "Cold compress for 10 min, avoid pressure, and elevate area.")
        elif severity == "Moderate":
            return block("Noticeable discoloration and mild swelling",
                         "Apply cool compress, rest, and monitor for pain.")
        else:
            return block("Small faint patch of discoloration",
                         "Light compression and rest; fades naturally.")

    # === Abrasions ===
    elif "abrasion" in label_lower:
        if severity == "Severe":
            return block("Wider scraped area with raw exposure",
                         "Rinse gently, apply sterile dressing, keep dry and protected.")
        elif severity == "Moderate":
            return block("Superficial rough patch with visible texture",
                         "Clean with mild solution, allow partial air exposure.")
        else:
            return block("Lightly scraped surface with minimal mark",
                         "Rinse with clean water and maintain dryness.")

    # === Others ===
    else:
        return block("Neutral surface variation.", "Keep clean and observe daily for improvement.")


# === Gemini Summary Generator ===
def generate_gemini_summary(label, confidence, caption, safe_caption, severity):
    if label.lower() == "normal":
        return "🩺 Surface appears healthy and intact. No treatment necessary."

    prompt = f"""
You are a clinical documentation assistant producing neutral, medical-grade wound observations.

Classification: {label}
Confidence: {confidence}%
Visual Description: {safe_caption}
Estimated Severity: {severity}

Please produce a short structured summary that includes:

1. Description — concise clinical observation in neutral tone
2. Prescription — brief first-aid or treatment recommendation (2–3 lines)
3. Estimated Healing Time — in days
4. Infection Risk — Low / Medium / High

Tone guide:
- Mild → gentle reassurance and minimal care guidance
- Moderate → attentive cleaning and short protection steps
- Severe → urgent caution and medical supervision advice

Keep the output structured, under 100 words, and medically accurate.
"""
    try:
        response = gemini.generate_content(prompt)
        text = getattr(response, "text", "")
        return text.strip() if text else ""
    except Exception as e:
        return f"⚠️ Gemini Error: {e}"


# === Flask Endpoint ===
@app.route("/analyze", methods=["POST"])
def analyze():
    file = request.files.get("image")
    if not file:
        return jsonify({"error": "No image uploaded"}), 400

    img = Image.open(file.stream).convert("RGB")
    img_resized = img.resize((224, 224))
    arr = np.expand_dims(np.array(img_resized) / 255.0, axis=0)

    try:
        pred = cnn.predict(arr)[0]
    except Exception:
        pred = cnn.predict([arr, arr])[0]

    idx = int(np.argmax(pred))
    label = str(classes[idx])
    confidence = round(float(pred[idx] * 100), 2)

    # === Handle Normal Separately ===
    if label.lower() == "normal":
        severity = "Mild"
        report = generate_fallback_summary(label, "", severity)
        return jsonify({
            "label": label,
            "confidence": confidence,
            "severity": severity,
            "caption": None,
            "neutralized": None,
            "report": report
        })

    # === For Injury Cases ===
    inputs = processor(img, return_tensors="pt")
    with torch.no_grad():
        cap_id = blip.generate(**inputs, max_length=60)
    caption = processor.decode(cap_id[0], skip_special_tokens=True)
    safe_caption = neutralize_caption(caption)
    severity = estimate_severity(label, confidence, caption)

    text = generate_gemini_summary(label, confidence, caption, safe_caption, severity)
    if "⚠️" in text or len(text) < 50:
        text = generate_fallback_summary(label, caption, severity)

    return jsonify({
        "label": label,
        "confidence": confidence,
        "severity": severity,
        "caption": caption,
        "neutralized": safe_caption,
        "report": text
    })


if __name__ == "__main__":
    app.run(port=int(os.getenv("FLASK_PORT", 5001)))
