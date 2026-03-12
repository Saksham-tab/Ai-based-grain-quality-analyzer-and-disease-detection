#include <Arduino.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT11
#define Moistue_pin 34

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  delay(2000);
}

float readSoilMoisture() {
  int value = analogRead(SOIL_PIN);

  // Convert to percentage (adjust after calibration)
  float moisturePercent = map(value, 4095, 1500, 0, 100);

  moisturePercent = constrain(moisturePercent, 0, 100);

  return moisturePercent;
}

void loop() {

  if (Serial.available()) {

    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "SEND") {

      float temperature = dht.readTemperature();
      float humidity = dht.readHumidity();
      float moisture = readSoilMoisture();

      if (isnan(temperature) || isnan(humidity)) {
        Serial.println("{\"error\":\"DHT11_read_failed\"}");
        return;
      }

      String json = "{";
      json += "\"temperature\":" + String(temperature, 2) + ",";
      json += "\"humidity\":" + String(humidity, 2) + ",";
      json += "\"moisture\":" + String(moisture, 2);
      json += "}";

      Serial.println(json);
    }
  }
}