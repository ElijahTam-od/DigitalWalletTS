import { Request, Response, NextFunction } from 'express';
import z from 'zod';
import schemas from '../utils/validator'; // Adjust the path as needed

// Middleware function to validate request body
export const validateRequest = (schema: z.ZodType<any, any, any>) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			schema.parse(req.body);
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res.status(400).json({ error: error.errors });
			}
			next(error); // Passes other types of errors to the next error handler
		}
	};
};