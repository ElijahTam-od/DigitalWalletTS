import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service';
import { RegisterRequestBody, LoginRequestBody } from '../types/types';

export const register = async (req: Request<{}, {}, RegisterRequestBody>, res: Response): Promise<Response> => {
  try {
    const result = await AuthService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error in user registration:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<Response> => {
  try {
    const result = await AuthService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in user login:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};