import mongoose from 'mongoose';
import logger from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const connectDB = async (retryCount = 0): Promise<typeof mongoose> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    logger.info('MongoDB connected successfully', {
      host: conn.connection.host,
      database: conn.connection.name,
      retryCount,
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      
      // Attempt to reconnect
      if (retryCount < MAX_RETRIES) {
        logger.info('Attempting to reconnect to MongoDB...', { retryCount: retryCount + 1 });
        setTimeout(() => {
          connectDB(retryCount + 1).catch((err) => {
            logger.error('Reconnection failed', { error: err.message });
          });
        }, RETRY_DELAY);
      }
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
    });

    return conn;
  } catch (error: any) {
    logger.error('MongoDB connection failed', { 
      error: error.message, 
      stack: error.stack,
      retryCount,
    });

    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`, { 
        retryCount: retryCount + 1,
        maxRetries: MAX_RETRIES,
      });
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    } else {
      logger.error('Max retry attempts reached. Exiting...', { maxRetries: MAX_RETRIES });
      process.exit(1);
    }
  }
};

export default connectDB;
