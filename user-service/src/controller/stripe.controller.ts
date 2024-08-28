import { Response } from 'express';
import StripeService from '../service/stripe.service';
import validator from '../utils/validator';
import logger from '../utils/logger';
import { CustomRequest } from '../types/custom-request';

const initStripeService = (req: CustomRequest): StripeService => {
	const stripeSecretKey = req.headers['stripe-secret-key'] as string;
	return new StripeService(stripeSecretKey);
};

export const createPaymentMethod = async (req: CustomRequest, res: Response): Promise<void> => {
	try {
		const { type, card } = req.body;

		if (type !== 'card' || !card) {
			res.status(400).json({ error: 'Invalid payment method details' });
			return;
		}

		const paymentMethod = await StripeService.createPaymentMethod(type, card);
		const customerId = req.user?.stripeCustomerId; // Retrieve stripeCustomerId from the user object

		if (!customerId) {
			res.status(400).json({ error: 'Customer ID is required' });
			return;
		}

		await StripeService.attachPaymentMethodToCustomer(paymentMethod.id, customerId);
		res.json({ paymentMethod });
	} catch (error: unknown) {
		if (error instanceof Error) {
			logger.error('Error creating payment method:', error);
			res.status(500).json({ error: error.message });
		} else {
			logger.error('Unknown error creating payment method');
			res.status(500).json({ error: 'Unknown error occurred' });
		}
	}
};

// export const getPaymentMethods = async (req: CustomRequest, res: Response): Promise<void> => {
// 	try {
// 		const customerId = req.user?.stripeCustomerId; // Retrieve stripeCustomerId from the user object
//
// 		if (!customerId) {
// 			res.status(400).json({ error: 'Customer ID is required' });
// 			return;
// 		}
//
// 		const stripeService = initStripeService(req);
// 		const paymentMethods = StripeService.listCustomerPaymentMethods(customerId);
// 		res.json({ paymentMethods });
// 	} catch (error: unknown) {
// 		if (error instanceof Error) {
// 			logger.error('Error getting payment methods:', error);
// 			res.status(500).json({ error: error.message });
// 		} else {
// 			logger.error('Unknown error getting payment methods');
// 			res.status(500).json({ error: 'Unknown error occurred' });
// 		}
// 	}
// };

export const createPaymentIntent = async (req: CustomRequest, res: Response): Promise<void> => {
	try {
		const validation = validator.validateAmount(req.body.amount);
		if (!validation.success) {
			const errorMessages = validation.error.errors.map(err => err.message);
			res.status(400).json({ error: errorMessages.join(', ') });
			return;
		}

		const { amount } = req.body;
		const customerId = req.user?.stripeCustomerId; // Retrieve stripeCustomerId from the user object

		if (!customerId) {
			res.status(400).json({ error: 'Customer ID is required' });
			return;
		}

		const paymentIntent = await StripeService.createPaymentIntent(amount, 'usd', customerId);
		res.json({ clientSecret: paymentIntent.client_secret });
	} catch (error: unknown) {
		if (error instanceof Error) {
			logger.error('Error creating payment intent:', error);
			res.status(500).json({ error: error.message });
		} else {
			logger.error('Unknown error creating payment intent');
			res.status(500).json({ error: 'Unknown error occurred' });
		}
	}
};
