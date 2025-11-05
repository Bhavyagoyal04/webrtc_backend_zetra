import jwt from 'jsonwebtoken';

import logger from './logger';

export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    logger.error('JWT_SECRET is not defined');
    throw new Error('JWT_SECRET is not defined');
  }

  if (!userId) {
    logger.error('Cannot generate token: userId is required');
    throw new Error('User ID is required to generate token');
  }

  try {
    const token = jwt.sign({ userId }, jwtSecret, { 
      expiresIn: '7d',
      issuer: 'zetra-api',
    });
    
    logger.debug('Token generated successfully', { userId });
    return token;
  } catch (error: any) {
    logger.error('Error generating token', { error: error.message, userId });
    throw new Error('Failed to generate authentication token');
  }
};

export const verifyToken = (token: string): { userId: string } => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    logger.error('JWT_SECRET is not defined');
    throw new Error('JWT_SECRET is not defined');
  }

  if (!token) {
    logger.error('Cannot verify token: token is required');
    throw new Error('Token is required for verification');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'zetra-api',
    }) as { userId: string };
    
    if (!decoded.userId) {
      throw new Error('Invalid token payload');
    }
    
    logger.debug('Token verified successfully', { userId: decoded.userId });
    return decoded;
  } catch (error: any) {
    logger.error('Error verifying token', { error: error.message });
    throw error;
  }
};
