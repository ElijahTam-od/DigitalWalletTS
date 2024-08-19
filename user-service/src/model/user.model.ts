import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types/types';

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
  }
}, {
  timestamps: true
});

//Hash the password before saving
userSchema.pre<IUser>('save', async function(next){
  if (!this.isModified('password')) return next(); //If password is not modified, it skips the hash
  this.password = await bcrypt.hash(this.password, 12);
  next();
})

// Method to check password
userSchema.methods.checkPassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;