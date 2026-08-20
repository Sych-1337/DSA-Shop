import { z } from "zod";

import { ReturnReason } from "@/generated/prisma";

export const returnRequestSchema = z.object({
  orderNumber: z.string().min(3).max(40),
  email: z.string().email(),
  reason: z.nativeEnum(ReturnReason),
  customerNote: z.string().max(1000).optional(),
  itemIds: z.array(z.string().min(1)).min(1).max(50),
});

export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;
