import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      logger.warn('Request validation failed: missing fields', { 
        missingFields, 
        path: req.path,
        method: req.method,
      });
      
      res.status(400).json({
        error: 'Missing required fields',
        missingFields,
      });
      return;
    }

    next();
  };
};

export const validateRequestParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingParams: string[] = [];

    for (const param of requiredParams) {
      if (!req.params[param]) {
        missingParams.push(param);
      }
    }

    if (missingParams.length > 0) {
      logger.warn('Request validation failed: missing params', { 
        missingParams, 
        path: req.path,
        method: req.method,
      });
      
      res.status(400).json({
        error: 'Missing required parameters',
        missingParams,
      });
      return;
    }

    next();
  };
};

export const sanitizeRequestBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
};
