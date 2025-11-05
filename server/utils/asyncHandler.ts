import { Request, Response, NextFunction } from 'express';
import logger from './logger';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('Async handler caught error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
      });
      next(error);
    });
  };
};
