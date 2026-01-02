import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

export const connectDB = async () => {
  const url = process.env.DATABASE_URL || 'mongodb://localhost:27017/body-dimensions';
  try {
    await mongoose.connect(url);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error(err as any, 'MongoDB connection error');
    process.exit(1);
  }
};
