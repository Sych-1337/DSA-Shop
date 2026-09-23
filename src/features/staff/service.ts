import { hashPassword } from "better-auth/crypto";

import { prisma } from "@/lib/db/prisma";

export type CreateStaffInput = {
  name: string;
  email: string;
  password: string;
  roleKeys?: string[];
  phone?: string;
};

export async function listStaff() {
  return prisma.user.findMany({
    where: { staffProfile: { isNot: null } },
    orderBy: [{ staffProfile: { isActive: "desc" } }, { createdAt: "desc" }],
    include: {
      staffProfile: true,
      userRoles: { include: { role: true } },
    },
  });
}

export async function listRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } });
}

export async function createStaffUser(input: CreateStaffInput) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!email) throw new Error("Email обовʼязковий");
  if (!password || password.length < 8) {
    throw new Error("Пароль має містити щонайменше 8 символів");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Користувач з таким email вже існує");

  const hashed = await hashPassword(password);
  const roleKeys = [...new Set((input.roleKeys ?? []).filter(Boolean))];

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: name || email,
        email,
        emailVerified: true,
        accounts: {
          create: {
            accountId: email,
            providerId: "credential",
            password: hashed,
          },
        },
        staffProfile: {
          create: {
            isActive: true,
            phone: input.phone?.trim() || null,
          },
        },
      },
    });

    if (roleKeys.length > 0) {
      const roles = await tx.role.findMany({ where: { key: { in: roleKeys } } });
      for (const role of roles) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: role.id },
        });
      }
    }

    return user;
  });
}

export async function setStaffActive(userId: string, isActive: boolean) {
  const profile = await prisma.staffProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Користувач не є співробітником");
  return prisma.staffProfile.update({
    where: { userId },
    data: { isActive },
  });
}

export async function assignStaffRoles(userId: string, roleKeys: string[]) {
  const profile = await prisma.staffProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Користувач не є співробітником");

  const uniqueKeys = [...new Set(roleKeys.filter(Boolean))];
  const roles = await prisma.role.findMany({ where: { key: { in: uniqueKeys } } });

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    ...roles.map((role) =>
      prisma.userRole.create({
        data: { userId, roleId: role.id },
      }),
    ),
  ]);
}
