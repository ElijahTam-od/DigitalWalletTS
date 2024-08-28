import { Request } from 'express';

export interface CustomRequest extends Request {
	user?: {
		id: string;
		stripeCustomerId?: string;
		email:string;
		// Add other properties if needed
	};
}