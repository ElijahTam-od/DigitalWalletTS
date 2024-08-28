import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWallet extends Document {
	user: mongoose.Schema.Types.ObjectId;
	balance: number;
	currency: string;
	stripeCustomerId: string;
	createdAt: Date;
	updatedAt: Date;
}

const walletSchema: Schema<IWallet> = new Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	balance: {
		type: Number,
		default: 0,
		min: 0
	},
	currency: {
		type: String,
		default: 'USD'
	},
	stripeCustomerId: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

// Update the updatedAt field before saving
walletSchema.pre<IWallet>('save', function(next) {
	this.updatedAt = new Date();
	next();
});

const Wallet: Model<IWallet> = mongoose.model<IWallet>('Wallet', walletSchema);

export default Wallet;
