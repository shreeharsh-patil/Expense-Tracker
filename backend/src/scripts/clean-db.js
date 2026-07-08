require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const models = require('../../models');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/spendly';

async function cleanDatabase() {
    try {
        console.log(`Connecting to database at ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        const modelKeys = Object.keys(models);
        console.log(`Found ${modelKeys.length} models to clean.`);

        for (const key of modelKeys) {
            const model = models[key];
            const deleteResult = await model.deleteMany({});
            console.log(`Cleared model [${key}]: deleted ${deleteResult.deletedCount} documents.`);
        }

        console.log('Database cleaned successfully.');
    } catch (err) {
        console.error('Error cleaning database:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    }
}

cleanDatabase();
