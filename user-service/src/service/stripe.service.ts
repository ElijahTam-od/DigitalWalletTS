import Stripe from 'stripe';
import Config from '../config/config'; // Adjust the import path as needed
import logger from '../utils/logger';

// Initialize Stripe with your secret key
const stripe = new Stripe(Config.getInstance().stripeApiKey, {
	apiVersion: '2024-06-20',
});

class StripeService {
	private stripe: Stripe;

	constructor(stripeSecretKey: string) {
		this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
	}
	static async createCustomer(email: string): Promise<Stripe.Customer> {
		try {
			const customer = await stripe.customers.create({ email });
			logger.info(`Created Stripe customer for email: ${email}`);
			return customer;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error creating Stripe customer: ${typedError.message}`);
			throw new Error(`Failed to create Stripe customer: ${typedError.message}`);
		}
	}

	static async createPaymentIntent(
		amount: number,
		currency: string,
		customerId: string,
		paymentMethodId?: string
	): Promise<Stripe.PaymentIntent> {
		logger.info(
			`Creating PaymentIntent: amount=${amount}, currency=${currency}, customerId=${customerId}, paymentMethodId=${paymentMethodId}`
		);

		try {
			const paymentIntent = await stripe.paymentIntents.create({
				amount: amount * 0.01, // Convert to cents
				currency,
				customer: customerId,
				payment_method: paymentMethodId,
				setup_future_usage: 'off_session',
				confirm: false,
				confirmation_method: 'manual', // Use 'manual' to confirm payment later
			});

			logger.info(`PaymentIntent created: ${JSON.stringify(paymentIntent)}`);
			return paymentIntent;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error creating PaymentIntent: ${typedError.message}`);
			throw new Error(`Failed to create PaymentIntent: ${typedError.message}`);
		}
	}

	static async confirmPaymentIntent(
		paymentIntentId: string,
		paymentMethodId: string
	): Promise<Stripe.PaymentIntent> {
		try {
			const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
				payment_method: paymentMethodId,
				return_url: "https://example.com"

			});
			logger.info(`Confirmed PaymentIntent: ${paymentIntentId}`);
			return confirmedPaymentIntent;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error confirming PaymentIntent: ${typedError.message}`);
			throw new Error(`Failed to confirm PaymentIntent: ${typedError.message}`);
		}
	}

	static async createPaymentMethod(
		type: 'card', // Currently, Stripe supports only 'card' for payment method type
		paymentMethodData: Stripe.PaymentMethodCreateParams
	): Promise<Stripe.PaymentMethod> {
		logger.info(`Creating payment method of type ${type}`);

		try {
			const paymentMethod = await stripe.paymentMethods.create({
				type,
				...paymentMethodData,
			});
			logger.info(`Payment method created: ${JSON.stringify(paymentMethod)}`);
			return paymentMethod;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error creating payment method: ${typedError.message}`);
			throw new Error(`Failed to create payment method: ${typedError.message}`);
		}
	}

	static async attachPaymentMethodToCustomer(
		paymentMethodId: string,
		customerId: string
	): Promise<Stripe.PaymentMethod> {
		try {
			const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
				customer: customerId,
			});
			logger.info(`Attached payment method ${paymentMethodId} to customer ${customerId}`);
			return paymentMethod;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error attaching payment method: ${typedError.message}`);
			throw new Error(`Failed to attach payment method: ${typedError.message}`);
		}
	}

	static async createPayout(amount: number, customerId: string): Promise<Stripe.Payout> {
		try {
			// Note: In a real-world scenario, you'd typically use a connected account for payouts
			// This is a simplified version for demonstration purposes
			const payout = await stripe.payouts.create({
				amount: amount * 100, // Convert to cents
				currency: 'usd',
				method: 'instant',
			}, {
				stripeAccount: customerId, // This assumes the customer ID can be used as a connected account ID, which is not typically the case
			});
			logger.info(`Created payout for customer ${customerId}: ${JSON.stringify(payout)}`);
			return payout;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error creating payout: ${typedError.message}`);
			throw new Error(`Failed to create payout: ${typedError.message}`);
		}
	}

	static async listPaymentMethods(customerId: string): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
		try {
			const paymentMethods = await stripe.paymentMethods.list({
				customer: customerId,
				type: 'card',
			});
			logger.debug(`Retrieved ${paymentMethods.data.length} payment methods for customer ${customerId}`);
			return paymentMethods;
		} catch (error) {
			const typedError = error as Error;
			logger.error('Error listing payment methods:', typedError);
			throw new Error(`Failed to list payment methods: ${typedError.message}`);
		}
	}

	static async retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
		try {
			const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
			logger.debug(`Retrieved payment method ${paymentMethodId}`);
			return paymentMethod;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error retrieving payment method ${paymentMethodId}:`, error);
			throw new Error(`Failed to retrieve payment method: ${typedError.message}`);
		}
	}

	static async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
		try {
			const detachedPaymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
			logger.info(`Detached payment method ${paymentMethodId}`);
			return detachedPaymentMethod;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error detaching payment method ${paymentMethodId}:`, error);
			throw new Error(`Failed to detach payment method: ${typedError.message}`);
		}
	}
}

export default StripeService;
