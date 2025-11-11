function generateHospitalExtras() {
  const equipmentList = [
    "MRI Machine",
    "CT Scanner",
    "X-Ray Machine",
    "Ultrasound",
    "ECG Machine",
    "Ventilator",
    "Defibrillator",
    "Dialysis Machine",
    "Operation Theater",
    "Blood Bank",
  ];

  // Pick 3–6 random equipment
  const shuffled = equipmentList.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.floor(Math.random() * 4) + 3);

  // Rating between 3.0–5.0
  const rating = parseFloat((Math.random() * 2 + 3).toFixed(1));

  return { equipment: selected, rating };
}

module.exports = { generateHospitalExtras };
