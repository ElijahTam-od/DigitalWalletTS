import { Router } from 'express';
import authRoutes from './auth.routes';
import kycRoutes from "./kyc.routes";
import walletRoutes from "./wallet.routes";

const router = Router();

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/wallet', walletRoutes);

export default router;