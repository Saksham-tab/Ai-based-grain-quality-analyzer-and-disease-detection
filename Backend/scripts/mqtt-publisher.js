import mqtt from 'mqtt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MQTT_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC_SENSOR || 'grain/quality/test';

console.log(`📡 Connecting to MQTT broker at ${MQTT_URL}...`);
const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');

    // Publish bad-quality data every 10 seconds
    setInterval(publishBadQualityData, 10000);
});

client.on('error', (err) => {
    console.error('❌ MQTT Connection Error:', err.message);
    process.exit(1);
});

function publishBadQualityData() {
    const data = generateBadQualityData();
    const payload = JSON.stringify(data);

    client.publish(MQTT_TOPIC, payload, (err) => {
        if (err) {
            console.error('❌ Publish error:', err);
        } else {
            console.log(`📤 [${new Date().toLocaleTimeString()}] Published BAD data to ${MQTT_TOPIC}:`, payload);
        }
    });
}

function generateBadQualityData() {
    return {
        // Environmental (worse storage conditions)
        temperature: parseFloat((30 + Math.random() * 8).toFixed(2)),   // hotter
        humidity: parseFloat((60 + Math.random() * 25).toFixed(2)),     // high humidity
        moisture: parseFloat((15 + Math.random() * 8).toFixed(2)),      // high moisture

        // Quality (bad grain)
        purity: parseFloat((10 + Math.random() * 15).toFixed(2)),       // low purity
        grade: Math.random() > 0.7 ? 'B' : 'C',                         // mostly C

        // Impurities (significantly higher)
        impurities: {
            husk: parseFloat((2 + Math.random() * 4).toFixed(2)),
            stones: parseFloat((1 + Math.random() * 2).toFixed(2)),
            blackSpots: parseFloat((2 + Math.random() * 4).toFixed(2)),
            brokenPieces: parseFloat((3 + Math.random() * 5).toFixed(2)),
            discolored: parseFloat((1 + Math.random() * 3).toFixed(2)),
            insectDamage: parseFloat((1 + Math.random() * 3).toFixed(2))
        }
    };
}