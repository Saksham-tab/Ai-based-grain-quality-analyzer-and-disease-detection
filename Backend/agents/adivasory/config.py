import os
from pathlib import Path

from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from sentence_transformers import SentenceTransformer

# ==============================
# CONFIG
# ==============================

# Load backend + local env before reading token/model variables.
_BASE_DIR = Path(__file__).resolve().parent
load_dotenv(_BASE_DIR.parent.parent / ".env", override=False)
load_dotenv(_BASE_DIR / ".env", override=False)

MODEL_NAME = os.getenv("ADVISORY_MODEL_NAME", "meta-llama/Llama-3.2-3B-Instruct")
HF_TOKEN = os.getenv(
    "HF_TOKEN_ADVISORY",
    os.getenv("HF_TOKEN", os.getenv("HUGGINGFACEHUB_API_TOKEN")),
)

_DEFAULT_PDF_PATH = _BASE_DIR / "knowldege_pdfs" / "wheat_quality_comprehensive_manual.pdf"
PDF_PATH = os.getenv("ADVISORY_PDF_PATH", str(_DEFAULT_PDF_PATH))

client = InferenceClient(model=MODEL_NAME, token=HF_TOKEN)
embedder = SentenceTransformer("all-MiniLM-L6-v2")
