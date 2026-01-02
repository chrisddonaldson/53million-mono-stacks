import mongoose from 'mongoose';
import { Entry } from './src/models/Entry';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://db:27017/body-dimensions';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB for seeding...');

    // Clear existing data
    await Entry.deleteMany({});
    logger.info('Cleared existing entries.');

    const entries = [];
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Initial values
    let currentWeight = 85.0;
    let currentBodyFat = 22.0;

    // Daily entries for 90 days
    for (let i = 0; i < 90; i++) {
      const date = new Date(threeMonthsAgo);
      date.setDate(date.getDate() + i);
      
      // Simulate minor daily fluctuations and a slight downward trend
      currentWeight += (Math.random() - 0.6) * 0.2; // -0.12 to +0.08 kg per day
      currentBodyFat += (Math.random() - 0.55) * 0.1; // -0.055 to +0.045 % per day

      entries.push({
        measuredAt: date,
        weightKg: Number(currentWeight.toFixed(2)),
        bodyFatPercent: Number(currentBodyFat.toFixed(2)),
        circumferences: [
          { site: 'waist', cm: Number((95 - (i * 0.05) + (Math.random() * 0.5)).toFixed(2)) },
          { site: 'chest', cm: Number((105 + (i * 0.02) + (Math.random() * 0.3)).toFixed(2)) }
        ],
        skinfolds: [
          { site: 'abdominal', mm: Number((20 - (i * 0.08) + (Math.random() * 1.5)).toFixed(2)) }
        ],
        notes: i % 7 === 0 ? 'Weekly check-in' : 'Morning fasted'
      });
    }

    await Entry.insertMany(entries);
    logger.info(`Successfully seeded ${entries.length} entries (3 months of data).`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error(err, 'Seeding failed');
    process.exit(1);
  }
}

seed();
