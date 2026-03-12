import re

from config import client

# ==============================
# BUILD PROMPT
# ==============================


def build_prompt(data, context):
    params = data["params"]

    return f"""
Tum ek experienced Indian krishi salahkar ho.

Neeche diya gaya knowledge verified document se liya gaya hai:
{context}

IMPORTANT:
Har parameter ko document ke ideal range se compare karo.
Agar value ideal se zyada hai to clearly bolo "yeh zyada hai aur ise kam karna hoga".
Agar kam hai to bolo "yeh kam hai aur ise improve karna hoga".
Galat direction kabhi mat bolo.

Is wheat sample me:

Grade: {data['grade']}
Moisture: {data['moisture']}%
Temperature: {data['temperature']} C
Humidity: {data['humidity']}%

Husk: {params.get('husk', 0)}%
Stone: {params.get('stone', 0)}%
Broken: {params.get('broken', 0)}%
Insect damage: {params.get('insect_damage', 0)}%
Black seed: {params.get('black_seed', 0)}%
Discoloration: {params.get('discoloration', 0)}%

Rules:
- Agar moisture 12% se zyada hai -> drying suggest karo
- Agar insect damage 1% se zyada hai -> cleaning machine suggest karo
- Agar broken 2% se zyada hai -> grading machine suggest karo
- Agar black seed 1% se zyada hai -> color sorter suggest karo
- Stone zyada ho to destoner suggest karo

Output Rules (STRICT):
- Sirf bullet points do
- Har point nayi line me ho aur "- " se start ho
- Koi intro, outro, heading, ya paragraph mat do
- Farmer ko "Aapka" bolkar baat karo
- Galat direction kabhi mat do
- Repeat mat karo
- Logical aur consistent raho
- Market ya shelf life mention mat karo
"""


def _force_bullet_points(text):
    if not text:
        return "- Advisory generate nahi ho payi."

    cleaned = text.replace("\r", "").strip()

    # If model returned inline bullets, split them into separate lines.
    cleaned = re.sub(r"\s([*-])\s", r"\n\1 ", cleaned)
    cleaned = re.sub(r"\n{2,}", "\n", cleaned)

    lines = [line.strip() for line in cleaned.split("\n") if line.strip()]

    bullet_items = []
    for line in lines:
        if re.match(r"^[*-]\s+", line):
            item = re.sub(r"^[*-]\s+", "", line).strip()
            if item:
                bullet_items.append(item)

    if not bullet_items:
        # Fallback: split paragraph into sentence-like chunks.
        chunks = re.split(r"(?<=[.!?])\s+", cleaned)
        bullet_items = [chunk.strip() for chunk in chunks if chunk.strip()]

    bullet_items = bullet_items[:8]
    return "\n".join(f"- {item}" for item in bullet_items)


# ==============================
# GENERATE RESPONSE
# ==============================


def generate_advisory(prompt):
    response = client.chat_completion(
        messages=[
            {
                "role": "system",
                "content": "Return only bullet points. Each line must start with '- '.",
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=600,
        temperature=0.2,
    )

    raw_text = response.choices[0].message.content
    return _force_bullet_points(raw_text)
