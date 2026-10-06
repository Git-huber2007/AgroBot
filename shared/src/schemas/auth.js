import { z } from 'zod';
export const SignUpSchema = z
    .object({
    email: z.string().trim().email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one digit'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
})
    .strict()
    .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
export const LoginSchema = z
    .object({
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})
    .strict();
export const ForgotPasswordSchema = z
    .object({
    email: z.string().trim().email('Please enter a valid email address'),
})
    .strict();
export const ResetPasswordSchema = z
    .object({
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one digit'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
})
    .strict()
    .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
export const DeleteAccountSchema = z
    .object({
    password: z.string().min(8, 'Password is required to confirm account deletion'),
})
    .strict();
