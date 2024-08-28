import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../model/user.model';
import logger from '../utils/logger';
import config from '../config/config';
import tokenBlacklist from '../utils/blacklist';

interface AuthenticatedRequest extends Request {
	user?: any;
}

export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.header('Authorization');
		if (!authHeader) {
			return res.status(401).json({ error: 'Access denied. No token provided.' });
		}

		const token = authHeader.split(' ')[1];
		if (!token) {
			return res.status(401).json({ error: 'Access denied. Invalid token format.' });
		}

		// Check if the token is blacklisted
		if (tokenBlacklist.has(token)) {
			return res.status(401).json({ error: 'Token is blacklisted.' });
		}

		const decoded = jwt.verify(token, config.getInstance().jwtKey) as { id: string };
		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			return res.status(401).json({ error: 'Invalid token. User not found.' });
		}

		req.user = user;
		next();
	} catch (error: any) {
		logger.error('Authentication error:', error);
		if (error.name === 'JsonWebTokenError') {
			return res.status(401).json({ error: 'Invalid token.' });
		}
		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({ error: 'Token expired.' });
		}
		res.status(500).json({ error: 'Internal server error.' });
	}
};

export const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	authenticateJWT(req, res, () => {
		if (req.user && req.user.role === 'admin') {
			next();
		} else {
			res.status(403).json({ error: 'Access denied. Admin privileges required.' });
		}
	});
};