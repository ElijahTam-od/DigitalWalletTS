import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service';
import validator from '../utils/validator';


export class AuthController {
  private authService = new AuthService();

  async register(req: Request, res: Response) {
    try {
      const parseResult = validator.validateUser(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.format() });
      }

      const result = await this.authService.register(req.body);
      if ('error' in result) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const result = await this.authService.verifyEmail(token);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const parseResult = validator.validateLogin(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.format() });
      }

      const result = await this.authService.login(req.body);
      if ('error' in result) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Access denied. Invalid token format.' });
      return;
    }

    try {
      await this.authService.logout(token);
      res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  async createAdmin(req: Request, res: Response) {
    try {
      const parseResult = validator.validateUser(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.format() });
      }

      const result = await this.authService.createAdmin(req.body);
      if ('error' in result) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async makeAdmin(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const result = await this.authService.makeAdmin(userId);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async removeAdmin(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const result = await this.authService.removeAdmin(userId);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async setupAdmin(req: Request, res: Response) {
    try {
      const setupKey = req.query.setupKey as string;
      const parseResult = validator.validateUser(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.format() });
      }

      const result = await this.authService.setupAdmin(req.body, setupKey);
      if ('error' in result) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
