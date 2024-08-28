import User from '../model/user.model';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import validator from '../utils/validator';
import config from '../config/config';
import NotificationService from './notification.service';
import logger from '../utils/logger';
import {IUser} from "../types/types";
import tokenBlacklist from '../utils/blacklist';

interface RegisterParams {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

interface LoginParams {
    email: string;
    password: string;
}

export class AuthService {

    async register(params: RegisterParams): Promise<{ message?: string; user?: Partial<IUser>; error?: any }> {
        const { email, password, firstName, lastName } = params;

        const parseResult = validator.validateUser({ email, password, firstName, lastName });
        if (!parseResult.success) {
            return { error: parseResult.error.format() };
        }

        const session = await User.startSession();
        session.startTransaction();

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error("User already exists");
            }

            const emailVerificationToken = crypto.randomBytes(20).toString('hex');
            const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

            const newUser = new User({
                email,
                password,
                firstName,
                lastName,
                emailVerificationToken,
                emailVerificationExpires
            });

            await newUser.save({ session });

            const verificationURL = `http://localhost:3000/api/auth/verify-email/${emailVerificationToken}`;

            await NotificationService.notifyEmailVerification(newUser, verificationURL);

            await session.commitTransaction();
            session.endSession();

            return {
                message: "User registered successfully. Please check your email to verify your account.",
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName
                }
            };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();

            logger.error("Error in user registration:", error instanceof Error ? error.message : error);
            return { error: error instanceof Error ? error.message : "Internal server error" };
        }
    }

    async verifyEmail(token: string): Promise<{ message?: string; token?: string; user?: Partial<IUser>; error?: any }> {
        try {
            const user: IUser | null = await User.findOne({
                emailVerificationToken: token,
                emailVerificationExpires: { $gt: Date.now() }
            }).exec();

            if (!user) {
                throw new Error("Invalid or expired verification token");
            }

            user.isEmailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            await user.save();

            const jwtToken = jwt.sign({ id: user._id, role: user.role }, config.getInstance().jwtKey, { expiresIn: "1d" });

            return {
                message: "Email verified successfully",
                token: jwtToken, // Now it's jwtToken instead of token
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            };
        } catch (error) {
            logger.error("Error in email verification:", error instanceof Error ? error.message : error);
            return { error: error instanceof Error ? error.message : "Internal server error" };
        }
    }

    async login(params: LoginParams): Promise<{ token?: string; user?: Partial<IUser>; error?: any }> {
        const { email, password } = params;

        const parseResult = validator.validateLogin({ email, password });
        if (!parseResult.success) {
            return { error: parseResult.error.format() };
        }

        try {
            const user = await User.findOne({ email }).exec();
            if (!user) {
                throw new Error("Invalid email or password");
            }

            if (!user.isEmailVerified) {
                throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
            }

            const isMatch = await user.checkPassword(password);
            if (!isMatch) {
                throw new Error("Invalid email or password");
            }

            const token = jwt.sign({ id: user._id }, config.getInstance().jwtKey, { expiresIn: "1d" });

            const loginTime = new Date().toISOString();
            const loginLocation = ""; // Implement actual location retrieval if needed
            //await NotificationService.notifyLogin(user, loginTime, loginLocation);

            return {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            };
        } catch (error) {
            logger.error("Error in user login:", error instanceof Error ? error.message : error);
            return { error: error instanceof Error ? error.message : "Internal server error" };
        }
    }

    async logout(token: string): Promise<{ message?: string; error?: any }> {
        try {
            // Add the token to the blacklist
            tokenBlacklist.add(token);
            return { message: "Logged out successfully" };
        } catch (error) {
            logger.error("Error in user logout:", error instanceof Error ? error.message : error);
            return { error: error instanceof Error ? error.message : "Internal server error" };
        }
    }

    async createAdmin(params: RegisterParams): Promise<{ user?: Partial<IUser>; error?: any }> {
        const parseResult = validator.validateUser(params);
        if (!parseResult.success) {
            return { error: parseResult.error.format() };
        }

        try {
            const { email, password, firstName, lastName } = params;

            const existingUser = await User.findOne({ email }).exec();
            if (existingUser) {
                throw new Error("User already exists");
            }

            const emailVerificationToken = crypto.randomBytes(20).toString('hex');
            const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

            const user = new User({
                email,
                password,
                firstName,
                lastName,
                role: "admin",
                emailVerificationToken,
                emailVerificationExpires
            });
            await user.save();

            const verificationURL = `http://localhost:3000/api/auth/verify-email/${emailVerificationToken}`;

            await NotificationService.notifyEmailVerification(user, verificationURL);

            return {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            };
        } catch (error) {
            logger.error("Error in admin creation:", error instanceof Error ? error.message : error);
            return { error: error instanceof Error ? error.message : "Internal server error" };
        }
    }

    async makeAdmin(userId: string): Promise<{ user?: Partial<IUser>; error?: any }> {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { role: "admin" },
                { new: true }
            ).select("-password").exec();

            if (!user) {
                throw new Error("User not found");
            }

            return {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            };
        } catch (error) {
            logger.error("Error in making user admin:", error instanceof Error ? error.message : error);
            return { error: error instanceof Error ? error.message : "Internal server error" };
        }
    }

    async removeAdmin(userId: string): Promise<{ user?: Partial<IUser>; error?: any }> {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { role: "user" },
                { new: true }
            ).select("-password").exec();

            if (!user) {
                throw new Error("User not found");
            }

            return {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            };
        } catch (error) {
            logger.error("Error in removing admin privileges:", error instanceof Error ? error.message : error);
            return { error: error instanceof Error ? error.message : "Internal server error" };
        }
    }

    async setupAdmin(params: RegisterParams, setupKey?: string): Promise<{ message?: string; token?: string; user?: Partial<IUser>; error?: any }> {
        if (process.env.ALLOW_ADMIN_SETUP !== "true") {
            return { error: "Admin setup is not allowed" };
        }

        if (setupKey !== process.env.SETUP_KEY) {
            return { error: "Invalid setup key" };
        }

        const parseResult = validator.validateUser(params);
        if (!parseResult.success) {
            return { error: parseResult.error.format() };
        }

        try {
            const { email, password, firstName, lastName } = params;

            const adminExists = await User.findOne({ role: "admin" }).exec();
            if (adminExists) {
                throw new Error("An admin user already exists");
            }

            const emailVerificationToken = crypto.randomBytes(20).toString('hex');
            const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

            const user = new User({
                email,
                password,
                firstName,
                lastName,
                role: "admin",
                emailVerificationToken,
                emailVerificationExpires
            });
            await user.save();

            const verificationURL = `http://localhost:3000/api/auth/verify-email/${emailVerificationToken}`;

            await NotificationService.notifyEmailVerification(user, verificationURL);

            const token = jwt.sign({ id: user._id }, config.getInstance().jwtKey, { expiresIn: "1d" });

            process.env.ALLOW_ADMIN_SETUP = "false";

            return {
                message: "Admin user created successfully",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            };
        } catch (error) {
            logger.error("Error in admin setup:", error instanceof Error ? error.message : error);
            return { error: error instanceof Error ? error.message : "Internal server error" };
        }
    }
}
