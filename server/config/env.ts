import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

interface EnvConfig {
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  SOCKET_URL: string;
  NEXT_PUBLIC_API_BASE_URL: string;
  NODE_ENV: string;
  TURN_SERVER_URL?: string;
  TURN_SERVER_USERNAME?: string;
  TURN_SERVER_CREDENTIAL?: string;
}

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
];

const validateEnv = (): EnvConfig => {
  const missing: string[] = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const config: EnvConfig = {
    PORT: parseInt(process.env.PORT || '4000', 10),
    MONGO_URI: process.env.MONGO_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:4000',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    TURN_SERVER_URL: process.env.TURN_SERVER_URL,
    TURN_SERVER_USERNAME: process.env.TURN_SERVER_USERNAME,
    TURN_SERVER_CREDENTIAL: process.env.TURN_SERVER_CREDENTIAL,
  };

  logger.info('Environment configuration validated', {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    hasTurnServer: !!config.TURN_SERVER_URL,
  });

  return config;
};

export default validateEnv();
