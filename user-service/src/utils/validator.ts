import { z } from "zod";

// Define the validation schemas using Zod
const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const walletCreationSchema = z.object({
    userId: z.string(),
    email: z.string(),
    initialBalance: z.number().min(0).default(0),
});

const transactionSchema = z.object({
    type: z.enum(['deposit', 'withdraw', 'transfer']),
    amount: z.number().positive(),
    fromUserId: z.string().optional().refine(val => val !== undefined || z.enum(['transfer']).safeParse(val).success, {
        message: "fromUserId is required for 'transfer' type"
    }),
    toUserId: z.string().optional().refine(val => val !== undefined || z.enum(['transfer']).safeParse(val).success, {
        message: "toUserId is required for 'transfer' type"
    }),
    currency: z.string().default('USD'),
});

// Validator object
const validator = {
    validateUser: (user: unknown) => userSchema.safeParse(user),
    validateLogin: (data: unknown) => loginSchema.safeParse(data),
    validateWalletCreation: (data: unknown) => walletCreationSchema.safeParse(data),
    validateTransaction: (transaction: unknown) => transactionSchema.safeParse(transaction),
    validateAmount: (amount: unknown) => z.number().positive().safeParse(amount),
    validateId: (id: unknown) => z.string().nonempty().safeParse(id),
    validateEmail: (email: unknown) => z.string().email().safeParse(email),
};

export default validator;