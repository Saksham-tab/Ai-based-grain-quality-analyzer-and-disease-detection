"""
Price Agent — Redis/stdout JSON wrapper for spawnPython.js
Reads latest grain sample from Redis stream, scrapes mandi price + makes decision, returns JSON stdout.
"""
import sys
import os
import json

# Add the pricing directory to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "pricing"))

from dotenv import load_dotenv
# Load .env from backend root (parent of agents/)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


from pricing import smart_market_decision, URL
import requests
from bs4 import BeautifulSoup
import random
from redis_stream_loader import get_latest_sample


def get_market_price():
    """Scrape the current modal price from DirectMandi (non-interactive version)."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(URL, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        table = soup.find("table")
        if not table:
            return None, None, None

        rows = table.find_all("tr")
        if len(rows) < 2:
            return None, None, None

        cols = rows[1].find_all("td")
        if len(cols) >= 6:
            market = cols[0].text.strip()
            modal_text = cols[4].text.strip()
            date = cols[5].text.strip()

            modal_price = float(
                modal_text.replace("₹", "")
                          .replace("Rs./Quintal", "")
                          .replace(",", "")
                          .strip()
            )

            return modal_price, market, date
    except Exception:
        pass

    return None, None, None


def main():
    try:
        input_data = get_latest_sample()
        if not input_data:
            print(json.dumps({"value": None, "error": "No grain data found in Redis stream"}))
            sys.exit(1)

        grade = input_data.get("grade", "C")
        purity = input_data.get("purity", 0)

        # Try scraping market price
        modal_price, market, date = get_market_price()

        if modal_price is not None:
            # 🔹 DYNAMIC PRICE CALCULATION 🔹
            # Adjust price based on purity: 100% purity = full market price
            # Lower purity = deduction (e.g., -₹20 per 1% below 95%)
            quality_factor = 1.0
            if purity < 95:
                # Deduct ₹20 for every 1% below 95
                deduction = (95 - purity) * 20
                final_price = modal_price - deduction
            else:
                # Small premium for very high purity
                premium = (purity - 95) * 10
                final_price = modal_price + premium
            
            # Round for cleanliness
            final_price = round(final_price, 2)
            
            # Clean up market name (remove common scrape artifacts)
            if market:
                market = market.replace("Unknown,", "").replace("MMow", "Mow").strip()

            decision = smart_market_decision(final_price, grade)
        else:
            final_price = 0
            decision = smart_market_decision(0, grade)
            market = "unavailable"
            date = "unavailable"

        output = {
            "value": final_price,
            "market": market,
            "date": date,
            "decision": decision,
        }
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"value": None, "error": f"Price error: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
