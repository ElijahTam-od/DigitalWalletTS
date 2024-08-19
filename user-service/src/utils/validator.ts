import z from 'zod';

const registerSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
    firstName: z.string().min(2).max(50, { message: 'First name must be between 2 and 50 characters long' }),
    lastName: z.string().min(2).max(50, { message: 'Last name must be between 2 and 50 characters long' }),
}).strict();

const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
}).strict();

export default {
    registerSchema,
    loginSchema,
};
