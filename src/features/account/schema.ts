import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max);

export const customerProfileSchema = z.object({
  firstName: optionalText(80),
  lastName: optionalText(80),
  phone: optionalText(40),
  city: optionalText(80),
  telegramUsername: z
    .string()
    .trim()
    .max(64)
    .regex(/^@?[a-zA-Z0-9_]*$/, "Invalid telegram"),
  birthDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Invalid date"),
  note: optionalText(500),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, "Invalid email"),
});

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
