import { Response } from 'express';
import WalletService from '../service/wallet.service';
import { CustomRequest } from '../types/custom-request';
import logger from '../utils/logger';

export class WalletController {
	async createWallet(req: CustomRequest, res: Response): Promise<void> {
		try {
			const { initialBalance } = req.body;
			const userId = req.user?.id;
			const email = req.user?.email;

			if (!userId || !email) {
				res.status(400).json({ error: 'User ID and email are required' });
				return;
			}

			const wallet = await WalletService.createWallet(userId, email, initialBalance);
			res.status(201).json(wallet);
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message.includes("KYC verification")) {
					res.status(403).json({ error: error.message });
				} else {
					res.status(400).json({ error: error.message });
				}
			} else {
				res.status(500).json({ error: 'An unknown error occurred' });
			}
		}
	}

	async createPaymentIntent(req: CustomRequest, res: Response): Promise<void> {
		try {
			const { amount } = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(400).json({ error: 'User ID is required' });
				return;
			}

			const paymentIntent = await WalletService.createPaymentIntent(userId, amount);
			res.json(paymentIntent);
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({ error: error.message });
			} else {
				res.status(500).json({ error: 'An unknown error occurred' });
			}
		}
	}

	async confirmPaymentIntent(req: CustomRequest, res: Response): Promise<void> {
		try {
			const { paymentIntentId, paymentMethodId } = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(400).json({ error: 'User ID is required' });
				return;
			}

			const result = await WalletService.confirmPaymentIntent(userId, paymentIntentId, paymentMethodId);
			res.json(result);
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({ error: error.message });
			} else {
				res.status(500).json({ error: 'An unknown error occurred' });
			}
		}
	}

	async getPaymentStatus(req: CustomRequest, res: Response): Promise<void> {
		try {
			const { paymentIntentId } = req.params;
			const userId = req.user?.id;

			if (!userId) {
				res.status(400).json({ error: 'User ID is required' });
				return;
			}

			const status = await WalletService.getPaymentStatus(userId, paymentIntentId);
			res.json(status);
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({ error: error.message });
			} else {
				res.status(500).json({ error: 'An unknown error occurred' });
			}
		}
	}

	async getBalance(req: CustomRequest, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;

			if (!userId) {
				res.status(400).json({ error: 'User ID is required' });
				return;
			}

			const balance = await WalletService.getBalance(userId);
			res.json(balance);
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({ error: error.message });
			} else {
				res.status(500).json({ error: 'An unknown error occurred' });
			}
		}
	}

	async addPaymentMethod(req: CustomRequest, res: Response): Promise<void> {
		try {
			const { paymentMethodId } = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(400).json({ error: 'User ID is required' });
				return;
			}

			const result = await WalletService.addPaymentMethod(userId, paymentMethodId);
			res.json(result);
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({ error: error.message });
			} else {
				res.status(500).json({ error: 'An unknown error occurred' });
			}
		}
	}

	// async listPaymentMethods(req: CustomRequest, res: Response): Promise<void> {
	// 	try {
	// 		const userId = req.user?.id;
	//
	// 		if (!userId) {
	// 			res.status(400).json({ error: 'User ID is required' });
	// 			return;
	// 		}
	//
	// 		const paymentMethods = await WalletService.listPaymentMethods(userId);
	// 		res.json(paymentMethods);
	// 	} catch (error: unknown) {
	// 		if (error instanceof Error) {
	// 			res.status(400).json({ error: error.message });
	// 		} else {
	// 			res.status(500).json({ error: 'An unknown error occurred' });
	// 		}
	// 	}
	// }

	// async deletePaymentMethod(req: CustomRequest, res: Response): Promise<void> {
	// 	try {
	// 		const { paymentMethodId } = req.params;
	// 		const userId = req.user?.id;
	//
	// 		if (!userId) {
	// 			res.status(400).json({ error: 'User ID is required' });
	// 			return;
	// 		}
	//
	// 		await WalletService.deletePaymentMethod(userId, paymentMethodId);
	// 		res.json({ message: "Payment method deleted successfully" });
	// 	} catch (error: unknown) {
	// 		if (error instanceof Error) {
	// 			res.status(400).json({ error: error.message });
	// 		} else {
	// 			res.status(500).json({ error: 'An unknown error occurred' });
	// 		}
	// 	}
	// }

	// async withdraw(req: CustomRequest, res: Response): Promise<void> {
	// 	try {
	// 		const { amount } = req.body;
	// 		const userId = req.user?.id;
	//
	// 		if (!userId) {
	// 			res.status(400).json({ error: 'User ID is required' });
	// 			return;
	// 		}
	//
	// 		const result = await WalletService.withdraw(userId, amount);
	// 		res.json(result);
	// 	} catch (error: unknown) {
	// 		if (error instanceof Error) {
	// 			res.status(400).json({ error: error.message });
	// 		} else {
	// 			res.status(500).json({ error: 'An unknown error occurred' });
	// 		}
	// 	}
	// }

	async transfer(req: CustomRequest, res: Response): Promise<void> {
		try {
			const { toUserId, amount } = req.body;
			const fromUserId = req.user?.id;

			if (!fromUserId) {
				res.status(400).json({ error: 'User ID is required' });
				return;
			}

			const result = await WalletService.transfer(fromUserId, toUserId, amount);
			res.json(result);
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({ error: error.message });
			} else {
				res.status(500).json({ error: 'An unknown error occurred' });
			}
		}
	}

	// async getTransactions(req: CustomRequest, res: Response): Promise<void> {
	// 	try {
	// 		const userId = req.user?.id;
	//
	// 		if (!userId) {
	// 			res.status(400).json({ error: 'User ID is required' });
	// 			return;
	// 		}
	//
	// 		const transactions = await WalletService.getTransactions(userId);
	// 		res.json(transactions);
	// 	} catch (error: unknown) {
	// 		if (error instanceof Error) {
	// 			res.status(400).json({ error: error.message });
	// 		} else {
	// 			res.status(500).json({ error: 'An unknown error occurred' });
	// 		}
	// 	}
	// }

	async deposit(req: CustomRequest, res: Response): Promise<void> {
		try {
			const { amount, paymentMethodId } = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(400).json({ error: 'User ID is required' });
				return;
			}

			const result = await WalletService.deposit(userId, amount, paymentMethodId);
			res.json(result);
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({ error: error.message });
			} else {
				res.status(500).json({ error: 'An unknown error occurred' });
			}
		}
	}

	// async generatePaymentQR(req: CustomRequest, res: Response): Promise<void> {
	// 	try {
	// 		const { amount } = req.body;
	// 		const userId = req.user?.id;
	//
	// 		if (!userId) {
	// 			res.status(400).json({ error: 'User ID is required' });
	// 			return;
	// 		}
	//
	// 		const qrCode = await WalletService.generatePaymentQR(userId, amount);
	// 		res.json(qrCode);
	// 	} catch (error: unknown) {
	// 		if (error instanceof Error) {
	// 			res.status(400).json({ error: error.message });
	// 		} else {
	// 			res.status(500).json({ error: 'An unknown error occurred' });
	// 		}
	// 	}
	// }

	// async initiateQRPayment(req: CustomRequest, res: Response): Promise<void> {
	// 	try {
	// 		const { paymentId, paymentMethodId } = req.body;
	// 		const userId = req.user?.id;
	//
	// 		if (!userId || !paymentId || !paymentMethodId) {
	// 			return res.status(400).json({ error: "paymentId, paymentMethodId, and User ID are required" });
	// 		}
	//
	// 		const result = await WalletService.initiateQRPayment(paymentId, userId, paymentMethodId);
	// 		res.json(result);
	// 	} catch (error: unknown) {
	// 		if (error instanceof Error) {
	// 			res.status(400).json({ error: error.message });
	// 		} else {
	// 			res.status(500).json({ error: 'An unknown error occurred' });
	// 		}
	// 	}
	// }

	// async confirmQRPayment(req: CustomRequest, res: Response): Promise<void> {
	// 	try {
	// 		const { paymentIntentId, paymentMethodId } = req.body;
	// 		const userId = req.user?.id;
	//
	// 		if (!userId) {
	// 			res.status(400).json({ error: 'User ID is required' });
	// 			return;
	// 		}
	//
	// 		const result = await WalletService.confirmQRPayment(userId, paymentIntentId, paymentMethodId);
	// 		res.json(result);
	// 	} catch (error: unknown) {
	// 		if (error instanceof Error) {
	// 			res.status(400).json({ error: error.message });
	// 		} else {
	// 			res.status(500).json({ error: 'An unknown error occurred' });
	// 		}
	// 	}
	// }
}
