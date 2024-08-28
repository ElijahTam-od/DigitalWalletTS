import express, { Router } from 'express';
import { authenticateJWT, authenticateAdmin } from '../middleware/auth.middleware';
import upload from '../middleware/file-upload.middleware';
import { KYCController } from '../controller/kyc.controller';

const router: Router = express.Router();
const kycController = new KYCController();

router.post('/initiate', authenticateJWT, (req, res) => kycController.initiateKYC(req, res));
router.post('/upload-document', authenticateJWT, upload.single('document'), (req, res) => kycController.uploadDocument(req, res));
router.get('/status', authenticateJWT, (req, res) => kycController.getKYCStatus(req, res));
router.put('/update-status', authenticateAdmin, (req, res) => kycController.updateKYCStatus(req, res));

export default router;
