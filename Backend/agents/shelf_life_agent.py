"""
Shelf-Life Agent — Redis/stdout JSON wrapper for spawnPython.js
Reads latest grain sample from Redis stream, predicts shelf life, returns JSON stdout.
"""
import sys
import os
import json

# Add the self-life directory to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "self-life"))

from dotenv import load_dotenv
# Load .env from backend root (parent of agents/)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


from shelf_life_model import predict_shelf_life, classify_risk
from storage_engine import generate_storage_paragraph
from redis_stream_loader import get_latest_sample


def main():
    try:
        input_data = get_latest_sample()
        if not input_data:
            print(json.dumps({"value": None, "error": "No grain data found in Redis stream"}))
            sys.exit(1)

        moisture = float(input_data.get("moisture", 0))
        temperature = float(input_data.get("temperature", 0))
        humidity = float(input_data.get("humidity", 0))
        language = input_data.get("language", "en")

        shelf_life_days = predict_shelf_life(moisture, temperature, humidity)
        risk = classify_risk(shelf_life_days)

        # Try to generate storage paragraph, fallback on error
        try:
            paragraph = generate_storage_paragraph(
                moisture, temperature, humidity, language
            )
        except Exception:
            paragraph = f"Shelf life: {shelf_life_days} days. Risk: {risk}."

        output = {
            "value": shelf_life_days,
            "unit": "days",
            "risk": risk,
            "paragraph": paragraph,
        }
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"value": None, "error": f"Shelf-life error: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
