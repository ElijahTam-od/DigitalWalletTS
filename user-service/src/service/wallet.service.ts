import Wallet, { IWallet } from '../model/wallet.model';
import PaymentMethod, { IPaymentMethod } from '../model/payment-method.model';
import Transaction, { ITransaction } from '../model/transaction.model';
import StripeService from './stripe.service';
import KYCVerification, { IKYCVerification } from '../model/kyc-verification.model';
import NotificationService from './notification.service';
import crypto from 'crypto';
import qrcode from 'qrcode';
import logger from '../utils/logger';
import mongoose from "mongoose";

const STRIPE_TEST_PAYMENT_METHODS = new Set([
	'pm_card_visa', 'pm_card_mastercard', 'pm_card_amex', 'pm_card_discover',
	'pm_card_diners', 'pm_card_jcb', 'pm_card_unionpay', 'pm_card_visa_debit',
	'pm_card_mastercard_prepaid', 'pm_card_threeDSecure2Required', 'pm_usBankAccount',
	'pm_sepaDebit', 'pm_bacsDebit', 'pm_alipay', 'pm_wechat'
]);

class WalletService {

	static async createTransaction(
		type: 'deposit' | 'withdraw' | 'transfer',
		amount: number,
		fromWallet: mongoose.Types.ObjectId | null,
		toWallet: mongoose.Types.ObjectId,
		stripePaymentIntentId?: string
	): Promise<ITransaction> {
		try {
			const transaction = new Transaction({
				type,
				amount,
				fromWallet: fromWallet ? await Wallet.findById(fromWallet) : null,
				toWallet: toWallet ? await Wallet.findById(toWallet) : null,
				stripePaymentIntentId: stripePaymentIntentId || null,
				status: "completed",
			});

			await transaction.save();

			logger.info(`Transaction created: ${transaction._id}`);
			return transaction;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error in createTransaction: ${typedError.message}`);
			throw new Error(`Failed to create transaction: ${typedError.message}`);
		}
	}


	static async createWallet(userId: string, email: string, initialBalance: number): Promise<IWallet> {
		try {
			// Check KYC status first
			const kycVerification = await KYCVerification.findOne({ user: userId }) as IKYCVerification;
			if (!kycVerification || kycVerification.status !== "approved") {
				throw new Error("KYC verification is not approved. Cannot create wallet.");
			}

			// Check if user already has a wallet
			const existingWallet = await Wallet.findOne({ user: userId }) as IWallet;
			if (existingWallet) {
				throw new Error("User already has a wallet");
			}

			const stripeCustomer = await StripeService.createCustomer(email);

			const wallet = new Wallet({
				user: userId,
				balance: initialBalance,
				stripeCustomerId: stripeCustomer.id,
			});

			await wallet.save();

			const walletId = wallet._id as mongoose.Types.ObjectId;

			if (initialBalance > 0) {
				const transaction = await this.createTransaction("deposit", initialBalance, null, walletId);
				// Send notification for initial balance as a deposit
				//await NotificationService.notifyDeposit(userId, initialBalance, transaction._id);
			}

			logger.info(`Wallet created for user ${userId} with initial balance ${initialBalance}`);

			return wallet;
		} catch (error) {
			const typedError = error as Error;
			logger.error("Error in createWallet:", error);
			throw new Error(`Failed to create wallet: ${typedError.message}`);
		}
	}

	static async deposit(userId: string, amount: number, paymentMethodId: string): Promise<{ balance: number, transactionId: string }> {
		try {
			const wallet = await Wallet.findOne({ user: userId }) as IWallet;
			if (!wallet) {
				throw new Error("Wallet not found");
			}

			const paymentMethod = await PaymentMethod.findOne({
				user: userId,
				stripePaymentMethodId: paymentMethodId
			}) as IPaymentMethod;

			if (!paymentMethod) {
				throw new Error("Payment method not found or does not belong to this user");
			}

			let paymentIntent;
			paymentIntent = await StripeService.createPaymentIntent(
				amount * 100, // Convert to cents for Stripe
				"usd",
				wallet.stripeCustomerId,
				paymentMethodId
			);

			// paymentIntent = await StripeService.confirmPaymentIntent(
			// 	paymentIntent.id,
			// 	paymentMethodId
			// );

			if (paymentIntent.status === "requires_confirmation") {
				const depositAmount = paymentIntent.amount / 100; // Convert back to dollars
				wallet.balance += depositAmount;
				await wallet.save();

				const transaction = await this.createTransaction(
					"deposit",
					depositAmount,
					null,
					wallet._id as mongoose.Types.ObjectId,
					paymentIntent.id
				);

				// Send notification
				//await NotificationService.notifyDeposit(wallet.user, depositAmount, transaction._id);

				return {
					balance: wallet.balance,
					transactionId: paymentIntent.id,
				};
			} else {
				throw new Error("Deposit failed");
			}
		} catch (error) {
			const typedError = error as Error;
			logger.error("Error in deposit:", typedError);
			throw new Error(`Deposit failed: ${typedError.message}`);
		}
	}

	static async createPaymentIntent(userId: string, amount: number): Promise<{ clientSecret: string, paymentIntentId: string }> {
		const wallet = await Wallet.findOne({ user: userId }) as IWallet;
		if (!wallet) {
			throw new Error("Wallet not found");
		}

		const paymentIntent = await StripeService.createPaymentIntent(
			amount * 100,
			"usd",
			wallet.stripeCustomerId
		);

		if (!paymentIntent.client_secret) {
			throw new Error("Payment intent client secret is not available");
		}

		return {
			clientSecret: paymentIntent.client_secret,
			paymentIntentId: paymentIntent.id,
		};
	}

	static async confirmPaymentIntent(userId: string, paymentIntentId: string, paymentMethodId: string): Promise<{ balance: number, transactionId: string }> {
		const wallet = await Wallet.findOne({ user: userId }) as IWallet;
		if (!wallet) {
			throw new Error("Wallet not found");
		}

		const paymentMethod = await PaymentMethod.findOne({
			user: userId,
			stripePaymentMethodId: paymentMethodId
		}) as IPaymentMethod;

		if (!paymentMethod) {
			throw new Error("Payment method not found or does not belong to this user");
		}

		let paymentIntent;
		paymentIntent = await StripeService.confirmPaymentIntent(
			paymentIntentId,
			paymentMethodId
		);

		if (paymentIntent.status === "succeeded") {
			const amount = paymentIntent.amount / 100; // Convert from cents to dollars
			wallet.balance += amount;
			await wallet.save();

			const transaction = await this.createTransaction(
				"deposit",
				amount,
				null,
				wallet._id as mongoose.Types.ObjectId,
				paymentIntent.id
			);

			// Send notification
			//await NotificationService.notifyDeposit(userId, amount, transaction._id);

			return { balance: wallet.balance, transactionId: paymentIntent.id };
		} else {
			throw new Error("Payment failed");
		}
	}

	static async getPaymentStatus(userId: string, paymentIntentId: string): Promise<{
		status: string;
		amount: number;
		createdAt: Date;
		updatedAt: Date;
		type: string;
		fromWallet: string | null;
		toWallet: string | null;
	}> {
		try {
			const transaction = await Transaction.findOne({
				stripePaymentIntentId: paymentIntentId,
			}).populate('fromWallet').populate('toWallet') as ITransaction;

			if (!transaction) {
				throw new Error("Payment not found");
			}

			// Ensure correct type handling for the populated wallets
			const isUserTransaction = (transaction.fromWallet && transaction.fromWallet.user.toString() === userId) ||
				(transaction.toWallet && transaction.toWallet.user.toString() === userId);

			if (!isUserTransaction) {
				throw new Error("Payment does not belong to this user");
			}

			return {
				status: transaction.status,
				amount: transaction.amount,
				createdAt: transaction.createdAt,
				updatedAt: transaction.updatedAt,
				type: transaction.type,
				fromWallet: transaction.fromWallet ? (transaction.fromWallet._id as mongoose.Types.ObjectId).toString() : null,
				toWallet: transaction.toWallet ? (transaction.toWallet._id as mongoose.Types.ObjectId).toString() : null,
			};
		} catch (error) {
			const typedError = error as Error;
			throw new Error(`Failed to get payment status: ${typedError.message}`);
		}
	}

	static async getBalance(userId: string): Promise<{ balance: number }> {
		const wallet = await Wallet.findOne({ user: userId }) as IWallet;
		if (!wallet) {
			throw new Error("Wallet not found");
		}
		return { balance: wallet.balance };
	}

	static async addPaymentMethod(userId: string, paymentMethodId: string): Promise<{ message: string }> {
		try {
			const wallet = await Wallet.findOne({ user: userId }) as IWallet;
			if (!wallet) {
				throw new Error("Wallet not found");
			}

			// Check if the payment method already exists in the database
			const existingPaymentMethod = await PaymentMethod.findOne({ stripePaymentMethodId: paymentMethodId }) as IPaymentMethod;
			if (existingPaymentMethod) {
				logger.info(`Payment method ${paymentMethodId} already exists for user ${userId}`);
				return { message: "Payment method already exists for this user" };
			}

			// Retrieve the payment method details from Stripe
			const stripePaymentMethod = await StripeService.retrievePaymentMethod(paymentMethodId);

			// Attach the payment method to the customer in Stripe
			await StripeService.attachPaymentMethodToCustomer(paymentMethodId, wallet.stripeCustomerId);

			// Create a new PaymentMethod document in the database
			const newPaymentMethod = new PaymentMethod({
				user: userId,
				stripePaymentMethodId: paymentMethodId,
				type: stripePaymentMethod.type,
				card: stripePaymentMethod.card ? {
					brand: stripePaymentMethod.card.brand,
					last4: stripePaymentMethod.card.last4,
					expMonth: stripePaymentMethod.card.exp_month,
					expYear: stripePaymentMethod.card.exp_year
				} : null,
				isDefault: false // You might want to set this based on some logic
			});

			await newPaymentMethod.save();

			return { message: "Payment method added successfully" };
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error in addPaymentMethod: ${typedError.message}`);
			throw new Error(`Failed to add payment method: ${typedError.message}`);
		}
	}

	static async removePaymentMethod(userId: string, paymentMethodId: string): Promise<{ message: string }> {
		try {
			const wallet = await Wallet.findOne({ user: userId }) as IWallet;
			if (!wallet) {
				throw new Error("Wallet not found");
			}

			// Find the payment method to remove
			const paymentMethod = await PaymentMethod.findOne({
				user: userId,
				stripePaymentMethodId: paymentMethodId
			}) as IPaymentMethod;

			if (!paymentMethod) {
				throw new Error("Payment method not found or does not belong to this user");
			}

			// Remove payment method from Stripe
			await StripeService.detachPaymentMethod(paymentMethodId);

			// Delete the payment method from the database
			await PaymentMethod.deleteOne({ stripePaymentMethodId: paymentMethodId });

			return { message: "Payment method removed successfully" };
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error in removePaymentMethod: ${typedError.message}`);
			throw new Error(`Failed to remove payment method: ${typedError.message}`);
		}
	}

	static async generateQRCode(walletId: string): Promise<string> {
		try {
			const wallet = await Wallet.findById(walletId) as IWallet;
			if (!wallet) {
				throw new Error("Wallet not found");
			}

			const qrCodeData = JSON.stringify({
				walletId: wallet._id,
				balance: wallet.balance,
			});

			const qrCodeUrl = await qrcode.toDataURL(qrCodeData);
			return qrCodeUrl;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error in generateQRCode: ${typedError.message}`);
			throw new Error(`Failed to generate QR code: ${typedError.message}`);
		}
	}

	static async verifyTransaction(userId: string, transactionId: string): Promise<ITransaction> {
		try {
			const transaction = await Transaction.findById(transactionId)
				.populate('fromWallet')
				.populate('toWallet') as ITransaction;

			if (!transaction) {
				throw new Error("Transaction not found");
			}

			const isUserTransaction = (transaction.fromWallet && transaction.fromWallet.user.toString() === userId) ||
				(transaction.toWallet && transaction.toWallet.user.toString() === userId);

			if (!isUserTransaction) {
				throw new Error("Transaction does not belong to this user");
			}

			return transaction;
		} catch (error) {
			const typedError = error as Error;
			logger.error(`Error in verifyTransaction: ${typedError.message}`);
			throw new Error(`Failed to verify transaction: ${typedError.message}`);
		}
	}

	static async transfer(fromUserId: string, toUserId: string, amount: number): Promise<any> {
		if (amount <= 0) {
			throw new Error('Amount must be greater than zero');
		}

		const session = await Wallet.startSession();
		session.startTransaction();
		try {
			const fromWallet = await Wallet.findOne({ user: fromUserId }).session(session);
			const toWallet = await Wallet.findOne({ user: toUserId }).session(session);

			if (!fromWallet || !toWallet) {
				throw new Error('One or both wallets not found');
			}

			if (fromWallet.balance < amount) {
				throw new Error('Insufficient funds');
			}

			fromWallet.balance -= amount;
			toWallet.balance += amount;

			await fromWallet.save();
			await toWallet.save();

			const transaction = new Transaction({
				type: 'transfer',
				amount,
				currency: 'USD', // Assuming USD, adjust as needed
				fromWallet: fromWallet._id,
				toWallet: toWallet._id,
				status: 'completed',
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await transaction.save({ session });

			await session.commitTransaction();
			session.endSession();

			return { success: true, message: 'Transfer successful', transaction };
		} catch (error) {
			const typedError = error as Error;
			await session.abortTransaction();
			session.endSession();
			throw new Error(`Transfer failed: ${typedError.message}`);
		}
	}
}

export default WalletService;

