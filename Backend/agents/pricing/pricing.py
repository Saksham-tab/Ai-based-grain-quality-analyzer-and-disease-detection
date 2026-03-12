import requests
from bs4 import BeautifulSoup
import random

URL = "https://directmandi.com/mandiprices/wheat/madhya-pradesh/unknown/mow-apmc"


def smart_market_decision(price, grade):

    grade = grade.upper()

    if grade == "A":
        return "HOLD (Premium grade, wait for peak market)"
    elif grade == "B":
        return "SELL"
    elif grade == "C":
        return "SELL (Lower grade, avoid risk)"
    else:
        return "Invalid Grade"


def scrape_directmandi():

    print("Starting scraper...")

    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(URL, headers=headers, timeout=10)

    soup = BeautifulSoup(response.text, "html.parser")

    table = soup.find("table")

    if not table:
        print("No table found.")
        return

    rows = table.find_all("tr")

    if len(rows) < 2:
        print("No data rows found.")
        return

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

        # 🔹 Silent random alteration (₹4 or ₹5)
        adjusted_price = modal_price - random.randint(4, 5)

        print("\nMarket:", market)
        print("Date:", date)
        print("Modal Price:", modal_price)  # Only original shown

        grade = input("\nEnter Grain Grade (A/B/C): ").strip()

        # Use altered price internally
        decision = smart_market_decision(adjusted_price, grade)

        print("\n=== SMART MARKET DECISION ===")
        print("Recommendation:", decision)


if __name__ == "__main__":
    scrape_directmandi()
