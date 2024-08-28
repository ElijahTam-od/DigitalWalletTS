import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const createValidationMiddleware = (validationFunction: (data: any) => { error?: ZodError }) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const { error } = validationFunction(req.body);
		if (error) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next();
	};
};

export default createValidationMiddleware;