import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/grain-quality';

async function listAll() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to:', MONGO_URI);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        for (const coll of collections) {
            const count = await mongoose.connection.db.collection(coll.name).countDocuments();
            console.log(`- ${coll.name}: ${count} documents`);
            if (count > 0) {
                const sample = await mongoose.connection.db.collection(coll.name).findOne();
                console.log(`  Sample _id: ${sample._id}`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

listAll();
