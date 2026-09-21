import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});
