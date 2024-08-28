import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types/types';

export interface IWallet extends Document {
  balance: number;
  stripeCustomerId: string;
}

const walletSchema = new Schema<IWallet>(
    {
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },
      stripeCustomerId: {
        type: String,
        required: true,
      },
    },
    { _id: false }
);

const userSchema: Schema<IUser> = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: undefined
  },
  emailVerificationExpires: {
    type: Date,
    default: undefined
  },
  role: {
    type: String,
    default: 'user' // Default role
  },
  wallet: walletSchema,
  stripeCustomerId: {
    type: String,
    default: undefined // Optional field
  }
}, {
  timestamps: true
});

// Hash the password before saving
userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next(); // If password is not modified, skip the hash
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
userSchema.methods.checkPassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
