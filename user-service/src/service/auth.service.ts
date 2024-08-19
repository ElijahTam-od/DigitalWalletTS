import jwt from 'jsonwebtoken';
import User from '../model/user.model';
import {IUser, LoginRequestBody, RegisterRequestBody} from '../types/types';
import Config from '../config/config';

const jwtSecret = Config.getInstance().jwtKey;

export interface RegisterResponseBody {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export interface LoginResponseBody {
    token: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export class AuthService {
    static async register(data: RegisterRequestBody): Promise<RegisterResponseBody> {

        const { email, password, firstName, lastName } = data;

        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            throw new Error('User already exists');
        }

        // Create and save the new user
        user = new User({ email, password, firstName, lastName });
        await user.save();

        return {
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };
    }

    static async login(data: LoginRequestBody): Promise<LoginResponseBody> {

        const { email, password } = data;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check password
        const isMatch = await user.checkPassword(password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });

        return {
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };
    }
}