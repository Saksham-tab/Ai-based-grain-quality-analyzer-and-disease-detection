"""
Advisory Agent — Redis/stdout JSON wrapper for spawnPython.js
Reads latest grain sample from Redis stream, runs advisory engine, returns JSON stdout.
"""
import sys
import os
import json


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "adivasory"))

from dotenv import load_dotenv
# Load .env from backend root (parent of agents/)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from rag_engine import generate_advisory
from redis_stream_loader import get_latest_sample


def main():
    try:
        input_data = get_latest_sample()
        if not input_data:
            print(json.dumps({"text": "Advisory error: No grain data found in Redis stream"}))
            sys.exit(1)

        # generate_advisory now hardcodes Hinglish and doesn't need a language param
        result = generate_advisory(input_data)

        output = {"text": result}
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"text": f"Advisory error: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
