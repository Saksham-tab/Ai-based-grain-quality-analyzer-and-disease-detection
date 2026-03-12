from storage_engine import generate_storage_paragraph

if __name__ == "__main__":

    moisture = float(input("Enter moisture (%): "))
    temperature = float(input("Enter temperature (°C): "))
    humidity = float(input("Enter humidity (%): "))
    language = input("Select language (en/hi): ").strip()

    result = generate_storage_paragraph(
        moisture,
        temperature,
        humidity,
        language
    )

    print("\n=== STORAGE REPORT ===\n")
    print(result)
