import { Router } from 'express';
import { register, login } from '../controller/auth.controller';
import {validateRequest} from "../middleware/validation.middleware";
import schemas from '../utils/validator';

const router = Router();

// Define routes
router.post('/register', validateRequest(schemas.registerSchema), register);
router.post('/login', validateRequest(schemas.loginSchema), login);

export default router;