import { Request, Response, NextFunction } from 'express';
import { FailureResponse } from '../helpers/api-response';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error details:', error);
  console.error('Error stack:', error.stack);

  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Handle Prisma errors
  if (error.code === 'P2037' || error.message?.includes('too many clients already')) {
    res.status(503).json(
      FailureResponse(
        'Database is temporarily unavailable. Please try again in a moment.',
        'DB_CONNECTION_LIMIT'
      )
    );
    return;
  }

  if (error.code?.startsWith('P')) {
    // Other Prisma errors
    res.status(500).json(
      FailureResponse(
        'Database error occurred. Please try again.',
        error.code
      )
    );
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json(
      FailureResponse('Invalid token', 'INVALID_TOKEN')
    );
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json(
      FailureResponse('Token expired', 'TOKEN_EXPIRED')
    );
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json(
      FailureResponse(error.message, 'VALIDATION_ERROR')
    );
    return;
  }

  // Default error response
  res.status(error.status || 500).json(
    FailureResponse(
      error.message || 'Internal server error',
      error.code || 'INTERNAL_ERROR'
    )
  );
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};