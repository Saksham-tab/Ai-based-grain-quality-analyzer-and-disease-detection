from pypdf import PdfReader

# ==============================
# LOAD PDF
# ==============================

def load_pdf(path):
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        if page.extract_text():
            text += page.extract_text() + "\n"
    return text


# ==============================
# CHUNK TEXT
# ==============================

def chunk_text(text, chunk_size=800):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
