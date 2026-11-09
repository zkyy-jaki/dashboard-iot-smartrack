/**
 * Express error handling middleware.
 * Must be registered AFTER all routes (4-argument signature).
 */
import type { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found.`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[GlobalErrorHandler]', err.stack ?? err.message);

  const isDev = process.env['NODE_ENV'] === 'development';

  res.status(500).json({ 
    success: false,
    error: 'An unexpected error occurred.',
    ...(isDev && { details: err.message, stack: err.stack }),
  });
}
