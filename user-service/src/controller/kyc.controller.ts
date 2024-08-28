import { Response } from 'express';
import KYCService from '../service/kyc.service';
import mongoose from 'mongoose';
import { KYCStatus } from '../types/types';
import { CustomRequest } from '../types/custom-request';

export class KYCController {
	async initiateKYC(req: CustomRequest, res: Response): Promise<void> {
		try {
			const userId = new mongoose.Types.ObjectId(req.user!.id);
			const kycVerification = await KYCService.initiateKYC(userId);
			res.status(201).json(kycVerification);
		} catch (error) {
			this.handleError(res, error);
		}
	}

	async uploadDocument(req: CustomRequest, res: Response): Promise<void> {
		try {
			if (!req.file) {
				res.status(400).json({ error: 'No file uploaded' });
				return;
			}

			const userId = new mongoose.Types.ObjectId(req.user!.id);
			const documentType = req.body.documentType as string;
			const kycVerification = await KYCService.uploadDocument(userId, documentType, req.file);
			res.json(kycVerification);
		} catch (error) {
			this.handleError(res, error);
		}
	}

	async getKYCStatus(req: CustomRequest, res: Response): Promise<void> {
		try {
			const userId = new mongoose.Types.ObjectId(req.user!.id);
			const status = await KYCService.getKYCStatus(userId);
			res.json(status);
		} catch (error) {
			this.handleError(res, error);
		}
	}

	async updateKYCStatus(req: CustomRequest, res: Response): Promise<void> {
		try {
			const { userId, newStatus } = req.body as { userId: string; newStatus: string };

			const validStatuses: KYCStatus[] = ["approved", "pending", "rejected"];
			if (!validStatuses.includes(newStatus as KYCStatus)) {
				res.status(400).json({ error: 'Invalid status value.' });
				return;
			}

			const userObjectId = new mongoose.Types.ObjectId(userId);
			const kycVerification = await KYCService.updateKYCStatus(userObjectId, newStatus as KYCStatus);

			res.json(kycVerification);
		} catch (error) {
			this.handleError(res, error);
		}
	}

	private handleError(res: Response, error: unknown): void {
		if (error instanceof Error) {
			res.status(400).json({ error: error.message });
		} else {
			res.status(500).json({ error: 'An unexpected error occurred.' });
		}
	}
}
