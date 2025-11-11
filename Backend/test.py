from tensorflow.keras.models import load_model
cnn = load_model("./model/injury_detector_full2.h5", compile=False)
print("Model expects", len(cnn.inputs), "inputs:")
for inp in cnn.inputs:
    print(" →", inp)

cnn.summary()
