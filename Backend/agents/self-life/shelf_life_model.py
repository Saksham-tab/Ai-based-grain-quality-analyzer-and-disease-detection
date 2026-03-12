def predict_shelf_life(moisture, temperature, humidity):

    base_life = 365

    moisture_factor = 2 ** (12 - moisture)
    temp_factor = 2 ** ((20 - temperature) / 10)

    shelf_life = base_life * moisture_factor * temp_factor

    if humidity > 70:
        shelf_life *= 0.5
    elif humidity > 60:
        shelf_life *= 0.8

    shelf_life = max(5, min(shelf_life, 730))

    return round(shelf_life, 1)


def classify_risk(days):
    if days > 300:
        return "Low"
    elif days > 120:
        return "Moderate"
    else:
        return "High"
