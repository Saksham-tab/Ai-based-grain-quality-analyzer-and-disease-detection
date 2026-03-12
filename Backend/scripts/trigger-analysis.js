import mqtt from 'mqtt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MQTT_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC_SENSOR || 'grain/quality/test';

const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
    console.log('Connected to MQTT');
    const data = {
        temperature: 28.5,
        humidity: 65,
        moisture: 11.2,
        purity: 90.9,
        grade: "B",
        impurities: {
            husk: 1.2,
            stones: 0.5,
            blackSpots: 0.8,
            brokenPieces: 0.3,
            insectDamage: 0
        }
    };
    client.publish(MQTT_TOPIC, JSON.stringify(data), () => {
        console.log('Published');
        client.end();
    });
});
