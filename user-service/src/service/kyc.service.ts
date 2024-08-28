import { Document, Types } from "mongoose";
import User from "../model/user.model";
import KYCVerification from "../model/kyc-verification.model";
import config from "../config/config";
import fs from "fs";
import path from "path";
import NotificationService from "./notification.service";
import logger from "../utils/logger";

// Auto-approve KYC setting
const AUTO_APPROVE_KYC = process.env.AUTO_APPROVE_KYC === "true";

// Interface for the file parameter
export interface File {
	buffer?: Buffer;
	path?: string;
	originalname: string;
}

class KYCService {
	static async initiateKYC(userId: Types.ObjectId) {
		const user = await User.findById(userId);
		if (!user) {
			throw new Error("User not found");
		}

		let kycVerification = await KYCVerification.findOne({ user: userId });
		if (kycVerification) {
			throw new Error("KYC verification already initiated");
		}

		kycVerification = new KYCVerification({
			user: userId,
			status: AUTO_APPROVE_KYC ? "approved" : "pending",
		});

		if (AUTO_APPROVE_KYC) {
			kycVerification.approvedAt = new Date();
		}

		await kycVerification.save();

		// Notify user about KYC initiation or auto-approval
		//await NotificationService.notifyKYCUpdate(userId, kycVerification.status);

		logger.info(`KYC initiated for user ${userId}. Auto-approve: ${AUTO_APPROVE_KYC}`);

		return kycVerification;
	}

	static async uploadDocument(userId: Types.ObjectId, documentType: string, file: Express.Multer.File) {
		let kycVerification = await KYCVerification.findOne({ user: userId });
		if (!kycVerification) {
			// Auto-initiate KYC if not already initiated
			kycVerification = await this.initiateKYC(userId);
		}

		if (AUTO_APPROVE_KYC) {
			logger.info(`Document upload skipped for user ${userId} due to auto-approval`);
			return kycVerification;
		}

		if (kycVerification.status !== "pending") {
			throw new Error("KYC verification is not in pending state");
		}

		try {
			// Convert the file to Base64
			let fileBuffer: Buffer;
			if (file.buffer) {
				fileBuffer = file.buffer;
			} else if (file.path) {
				fileBuffer = fs.readFileSync(file.path);
			} else {
				throw new Error("Invalid file object");
			}

			const fileBase64 = fileBuffer.toString('base64');
			const mimeType = file.mimetype || 'application/octet-stream'; // Fallback MIME type if not provided
			const base64String = `data:${mimeType};base64,${fileBase64}`;

			console.log('Base64 String:', base64String); // Log the Base64 string for debugging

			// Store the Base64 string in MongoDB
			kycVerification.documents.push({
				type: documentType,
				base64: base64String,
				uploadedAt: new Date(),
			});

			await kycVerification.save();

			// Optionally delete the file if it was saved to disk
			if (file.path) {
				fs.unlinkSync(file.path);
			}

			logger.info(`Document uploaded and stored as Base64 for user ${userId}`);
			return kycVerification;
		} catch (error) {
			const typedError = error as Error;
			logger.error("Error uploading document:", typedError);
			throw new Error("Failed to upload document: " + typedError.message);
		}
	}

	static async updateKYCStatus(userId: Types.ObjectId, newStatus: "approved" | "pending" | "rejected", rejectionReason: string | null = null) {
		if (AUTO_APPROVE_KYC) {
			logger.info(`KYC status update skipped for user ${userId} due to auto-approval`);
			return { status: "approved" };
		}

		const kycVerification = await KYCVerification.findOne({ user: userId });
		if (!kycVerification) {
			throw new Error("KYC verification not found");
		}

		kycVerification.status = newStatus;
		if (newStatus === "approved") {
			kycVerification.approvedAt = new Date();
		} else if (newStatus === "rejected") {
			kycVerification.rejectionReason = rejectionReason;
		}

		await kycVerification.save();

		// Notify user about KYC status update
		//await NotificationService.notifyKYCUpdate(userId, newStatus, rejectionReason);

		return kycVerification;
	}

	static async getKYCStatus(userId: Types.ObjectId) {
		const kycVerification = await KYCVerification.findOne({ user: userId });
		if (!kycVerification) {
			throw new Error("KYC verification not found");
		}

		return {
			status: kycVerification.status,
			documents: kycVerification.documents.map((doc) => ({
				type: doc.type,
				uploadedAt: doc.uploadedAt,
			})),
			initiatedAt: kycVerification.createdAt,
			approvedAt: kycVerification.approvedAt,
			rejectionReason: kycVerification.rejectionReason,
			isAutoApproved: AUTO_APPROVE_KYC,
		};
	}

	static async isKYCApproved(userId: Types.ObjectId) {
		if (AUTO_APPROVE_KYC) {
			return true;
		}
		const kycVerification = await KYCVerification.findOne({ user: userId });
		return kycVerification && kycVerification.status === "approved";
	}

	static async resubmitKYC(userId: Types.ObjectId) {
		if (AUTO_APPROVE_KYC) {
			logger.info(`KYC resubmission skipped for user ${userId} due to auto-approval`);
			return { status: "approved" };
		}

		const kycVerification = await KYCVerification.findOne({ user: userId });
		if (!kycVerification) {
			throw new Error("KYC verification not found");
		}

		if (kycVerification.status !== "rejected") {
			throw new Error("KYC verification is not in rejected state");
		}

		kycVerification.status = "pending";
		kycVerification.rejectionReason = null;
		kycVerification.documents = [];

		await kycVerification.save();

		// Notify user about KYC resubmission
		//await NotificationService.notifyKYCUpdate(userId, "pending");

		return kycVerification;
	}
}

export default KYCService;