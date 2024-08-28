import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the PaymentMethod document
export interface IPaymentMethod extends Document {
	user: mongoose.Types.ObjectId;
	stripePaymentMethodId: string;
	type: string;
	card: {
		brand: string;
		last4: string;
		expMonth: number;
		expYear: number;
	};
	isDefault: boolean;
	createdAt: Date;
}

// Define the schema
const paymentMethodSchema = new Schema<IPaymentMethod>({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	stripePaymentMethodId: {
		type: String,
		required: true,
		unique: true
	},
	type: {
		type: String,
		required: true
	},
	card: {
		brand: String,
		last4: String,
		expMonth: Number,
		expYear: Number
	},
	isDefault: {
		type: Boolean,
		default: false
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

// Create the model
const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;
