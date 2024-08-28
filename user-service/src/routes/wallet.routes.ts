import express, { Router } from 'express';
import { WalletController } from '../controller/wallet.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router: Router = express.Router();
const walletController = new WalletController();

router.post('/create', authenticateJWT, (req, res) => walletController.createWallet(req, res));
router.post('/create-payment-intent', authenticateJWT, (req, res) => walletController.createPaymentIntent(req, res));
router.post('/confirm-payment-intent', authenticateJWT, (req, res) => walletController.confirmPaymentIntent(req, res));
router.get('/payment-status/:paymentIntentId', authenticateJWT, (req, res) => walletController.getPaymentStatus(req, res));
router.get('/balance', authenticateJWT, (req, res) => walletController.getBalance(req, res));
router.post('/add-payment-method', authenticateJWT, (req, res) => walletController.addPaymentMethod(req, res));
// router.get('/payment-methods', authenticateJWT, (req, res) => walletController.listPaymentMethods(req, res));
// router.delete('/payment-methods/:paymentMethodId', authenticateJWT, (req, res) => walletController.deletePaymentMethod(req, res));
// router.post('/withdraw', authenticateJWT, (req, res) => walletController.withdraw(req, res));
router.post('/transfer', authenticateJWT, (req, res) => walletController.transfer(req, res));
router.post('/deposit', authenticateJWT, (req, res) => walletController.deposit(req, res));
// router.get('/transactions', authenticateJWT, (req, res) => walletController.getTransactionHistory(req, res));
// router.post('/generate-qr', authenticateJWT, (req, res) => walletController.generatePaymentQR(req, res));
// router.post('/initiate-qr-payment', authenticateJWT, (req, res) => walletController.initiateQRPayment(req, res));
// router.post('/confirm-qr-payment', authenticateJWT, (req, res) => walletController.confirmQRPayment(req, res));

export default router;
