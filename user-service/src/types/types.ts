import { Document } from "mongoose";

export interface IUser extends Document {
	_id: string;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	//wallet: IWallet;
	createdAt: Date;
	checkPassword(candidatePassword:string): Promise<boolean>;
}

export interface RegisterRequestBody {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
}

export interface LoginRequestBody {
	email: string;
	password: string;
}
  