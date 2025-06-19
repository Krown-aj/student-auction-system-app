import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    campus: z.string().min(2, 'Campus name is required'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmpassword: z.string(),
}).refine((data) => data.password === data.confirmpassword, {
    message: "Passwords don't match",
    path: ["confirmpassword"],
});

export const createListingSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    campus: z.string().min(3, 'Campus is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.string().min(1, 'Please select a category'),
    condition: z.enum(['New', 'Like New', 'Good', 'Fair', 'Poor'], {
        required_error: 'Please select a condition',
    }),
    startingprice: z.string().min(0.01, 'Starting price must be greater than 0'),
    enddate: z.string().min(1, 'End date is required'),
    startdate: z.string().min(1, 'Start date is required'),
    images: z.array(z.string()).min(1, 'Please add at least one image'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CreateListingFormData = z.infer<typeof createListingSchema>;