import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/grain-quality';

async function checkLatestReport() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'grain_analyzer' });
        console.log('Connected to MongoDB');

        const Report = mongoose.model('Report', new mongoose.Schema({}, { strict: false }));
        const latest = await Report.findOne().sort({ createdAt: -1 }).lean();

        if (latest) {
            console.log('--- LATEST REPORT START ---');
            console.log(JSON.stringify(latest, null, 2));
            console.log('--- LATEST REPORT END ---');
        } else {
            console.log('No reports found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkLatestReport();
