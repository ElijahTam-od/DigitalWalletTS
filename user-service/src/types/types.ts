import { Document } from 'mongoose';
import {IWallet} from "../model/user.model";

// Define the User interface
export interface IUser extends Document {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	role: 'user' | 'admin';
	stripeCustomerId?: string;
	wallet?: IWallet;
	isEmailVerified: boolean;
	emailVerificationToken?: string;
	emailVerificationExpires?: Date;
	createdAt: Date;
	checkPassword(candidatePassword: string): Promise<boolean>;
}

export type KYCStatus = "approved" | "pending" | "rejected";
  