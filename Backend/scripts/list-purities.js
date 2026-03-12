import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/grain-quality';

async function listPurities() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'grain_analyzer' });
        const Report = mongoose.model('Report', new mongoose.Schema({}, { strict: false }));
        const reports = await Report.find({ purity: { $gte: 90.8, $lte: 91.0 } }).sort({ createdAt: -1 }).select('purity aiOutputs.price').lean();

        console.log('COUNT:' + reports.length);
        reports.forEach(r => {
            console.log('REPORT:' + JSON.stringify(r));
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

listPurities();
