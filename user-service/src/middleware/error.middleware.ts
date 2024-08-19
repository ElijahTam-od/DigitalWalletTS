import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ValidationError extends Error {
    errors: Record<string, { message: string }>;
}

interface DuplicateKeyError extends Error {
    code: number;
    keyValue: Record<string, string>;
}

interface UnauthorizedError extends Error {
    name: string;
}

const errorHandler = (
    err: Error,
    req: Request,
    res: Response<any, Record<string, any>>,
    next: NextFunction
): Response<any, Record<string, any>> | void => {
    logger.error(err.stack || '');

    // Mongoose validation error
    if ((err as ValidationError).name === 'ValidationError') {
        const errors = Object.values((err as ValidationError).errors).map(error => error.message);
        return res.status(400).json({ error: errors });
    }

    // Mongoose duplicate key error
    if ((err as DuplicateKeyError).code === 11000) {
        const field = Object.keys((err as DuplicateKeyError).keyValue)[0];
        return res.status(400).json({ error: `${field} already exists.` });
    }

    // JWT authentication error
    if ((err as UnauthorizedError).name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Default to 500 server error
    return res.status(500).json({ error: 'Internal Server Error' });
};

export default errorHandler;