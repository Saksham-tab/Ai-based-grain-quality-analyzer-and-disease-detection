import json
import os
import sys

from dotenv import load_dotenv

from advisory import build_prompt, generate_advisory
from config import PDF_PATH
from pdf_utils import chunk_text, load_pdf
from retriever import retrieve_context


def _load_env():
    backend_env = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    load_dotenv(backend_env)


def _read_input():
    if sys.stdin.isatty():
        return {}

    raw = sys.stdin.read().strip()
    if not raw:
        return {}

    return json.loads(raw)


def _to_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def _normalize_payload(payload):
    return {
        "grain": payload.get("grain", "Wheat"),
        "grade": payload.get("grade", "C"),
        "moisture": _to_float(payload.get("moisture", 0)),
        "temperature": _to_float(payload.get("temperature", 0)),
        "humidity": _to_float(payload.get("humidity", 0)),
        "params": {
            "husk": _to_float(payload.get("husk", 0)),
            "stone": _to_float(payload.get("stone", 0)),
            "broken": _to_float(payload.get("broken", 0)),
            "insect_damage": _to_float(payload.get("insect_damage", 0)),
            "black_seed": _to_float(payload.get("black_seed", 0)),
            "discoloration": _to_float(payload.get("discoloration", 0)),
        },
    }


def main():
    try:
        _load_env()
        payload = _read_input()
        sample_data = _normalize_payload(payload)

        pdf_text = load_pdf(PDF_PATH)
        chunks = chunk_text(pdf_text)

        query = (
            f"{sample_data['grain']} grade {sample_data['grade']} moisture "
            f"{sample_data['moisture']} humidity {sample_data['humidity']} "
            f"insect damage {sample_data['params']['insect_damage']} "
            f"broken grain {sample_data['params']['broken']} improvement methods"
        )
        context = retrieve_context(chunks, query)

        prompt = build_prompt(sample_data, context)
        result = generate_advisory(prompt)

        print(json.dumps({"text": result}))
    except Exception as exc:
        print(
            json.dumps(
                {
                    "text": "Advisory is temporarily unavailable.",
                    "error": f"Advisory error: {exc}",
                }
            )
        )


if __name__ == "__main__":
    main()
