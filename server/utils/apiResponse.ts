import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any, message?: string, statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message: message || 'Success',
      data,
    });
  }

  static error(res: Response, message: string, statusCode: number = 500, details?: any) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(details && { details }),
    });
  }

  static created(res: Response, data: any, message?: string) {
    return this.success(res, data, message || 'Resource created successfully', 201);
  }

  static badRequest(res: Response, message: string, details?: any) {
    return this.error(res, message, 400, details);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static conflict(res: Response, message: string) {
    return this.error(res, message, 409);
  }

  static tooManyRequests(res: Response, message: string = 'Too many requests', retryAfter?: number) {
    return this.error(res, message, 429, retryAfter ? { retryAfter } : undefined);
  }

  static internalError(res: Response, message: string = 'Internal server error') {
    return this.error(res, message, 500);
  }
}
