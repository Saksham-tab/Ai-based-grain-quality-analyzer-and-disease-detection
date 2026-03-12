# ======================================
# Grain Quality Detection - Raspberry Pi
# ======================================

import os
import numpy as np
from PIL import Image
import tflite_runtime.interpreter as tflite
import time
import json

# ==============================
# Configuration
# ==============================
MODEL_PATH = "grain_mobilenet_finally.tflite"
IMAGE_PATH = "test.jpg"
IMG_SIZE = (128, 128)

# ==============================
# Capture Image (no output shown)
# ==============================
os.system(f"rpicam-still -o {IMAGE_PATH} -n")
time.sleep(1)

# ==============================
# Load TFLite Model
# ==============================
interpreter = tflite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# ==============================
# Load & Preprocess Image
# ==============================
img = Image.open(IMAGE_PATH).convert("RGB")
img = img.resize(IMG_SIZE)

img = np.array(img)
img = img / 255.0
img = np.expand_dims(img, axis=0).astype(np.float32)

# ==============================
# Run Inference
# ==============================
interpreter.set_tensor(input_details[0]['index'], img)
interpreter.invoke()

prediction = interpreter.get_tensor(output_details[0]['index'])[0][0]

# ==============================
# Calculate Results
# ==============================
purity = float(prediction * 100)
black_percentage = float((1 - prediction) * 100)

# Grade Logic
if purity >= 95:
    grade = "A"
elif purity >= 85:
    grade = "B"
else:
    grade = "C"

# ==============================
# Final JSON Output ONLY
# ==============================
final_output = {
    "purity": round(purity, 2),
    "grade": grade,
    "impurities": {
        "blackSpots": round(black_percentage, 2),
        "brokenPieces": 0.0,
        "discolored": 0.0,
        "insectDamage": 0.0,
        "stones": 0.0,
        "husk": 0.0
    }
}

print(json.dumps(final_output, indent=4))