import { prisma } from "@/lib/db/prisma";

export async function writeAuditLog(input: {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? undefined,
        actorRole: input.actorRole ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        oldValues: input.oldValues as object | undefined,
        newValues: input.newValues as object | undefined,
        reason: input.reason ?? undefined,
        ip: input.ip ?? undefined,
        userAgent: input.userAgent ?? undefined,
      },
    });
  } catch (error) {
    console.error("[audit]", error);
  }
}
