import mongoose, { Document, Schema, Model } from "mongoose";

export interface IKYCVerification extends Document {
	user: mongoose.Types.ObjectId;
	status: "pending" | "approved" | "rejected";
	documents: Array<{
		type: string;
		base64: string; // New field for Base64 encoding
		uploadedAt: Date;
	}>;
	createdAt: Date;
	approvedAt?: Date;
	rejectionReason?: string | null;
}

const kycVerificationSchema = new Schema<IKYCVerification>(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending",
		},
		documents: [
			{
				type: {
					type: String,
					required: true,
				},
				base64: {
					type: String, // Storing the Base64 encoded file content
					required: true,
				},
				uploadedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		createdAt: {
			type: Date,
			default: Date.now, // Automatically set the current date
		},
		approvedAt: {
			type: Date,
		},
		rejectionReason: {
			type: String,
		},
	},
	{ timestamps: { createdAt: true, updatedAt: true } }
);

const KYCVerification: Model<IKYCVerification> = mongoose.model(
	"KYCVerification",
	kycVerificationSchema
);

export default KYCVerification;
