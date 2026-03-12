import os
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from shelf_life_model import predict_shelf_life, classify_risk
from config import LLM_MODEL_self

HF_TOKEN = os.getenv("HF_TOKEN_self")

tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_self, token=HF_TOKEN)
model = AutoModelForSeq2SeqLM.from_pretrained(LLM_MODEL_self, token=HF_TOKEN)


def generate_storage_paragraph(moisture, temperature, humidity, language="en"):

    shelf_life = predict_shelf_life(moisture, temperature, humidity)
    risk = classify_risk(shelf_life)

    if language == "hi":
        language_instruction = """
        Write exactly 3 short lines in simple Hindi used by Indian farmers.
        """
    else:
        language_instruction = """
        Write exactly 3 short lines in clear English.
        """

    prompt = f"""
    You are a grain storage expert.

    {language_instruction}

    Moisture: {moisture}%
    Temperature: {temperature}°C
    Humidity: {humidity}%

    Predicted Shelf Life: {shelf_life} days
    Risk Level: {risk}

    If conditions are good, say maintain same conditions.
    If not, suggest improvement briefly.
    """

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True)
    outputs = model.generate(**inputs, max_new_tokens=120)

    return tokenizer.decode(outputs[0], skip_special_tokens=True)
