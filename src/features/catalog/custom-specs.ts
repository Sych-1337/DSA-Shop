import { z } from "zod";

export const customSpecRowSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(200),
});

export type CustomSpecRow = z.infer<typeof customSpecRowSchema>;

export const MAX_CUSTOM_SPECS = 20;

export function parseCustomSpecs(raw: unknown): CustomSpecRow[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return parseCustomSpecs(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  const result = z.array(customSpecRowSchema).max(MAX_CUSTOM_SPECS).safeParse(raw);
  if (!result.success) return [];
  return result.data;
}
