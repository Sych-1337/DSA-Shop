/**
 * Ensure two OWNER staff accounts exist (full permissions).
 * Safe to re-run — updates password + activates staff profile.
 *
 * Render Shell:
 *   ./node_modules/.bin/tsx prisma/ensure-owners.ts
 */
import "dotenv/config";

import { hashPassword } from "better-auth/crypto";

import { prisma } from "../src/lib/db/prisma";

const OWNERS = [
  {
    name: "Owner One",
    email: "owner1@dsa-anime.shop",
    password: "Vx9#mKq2Lp7!Rn4W",
  },
  {
    name: "Owner Two",
    email: "owner2@dsa-anime.shop",
    password: "Hz3$tYb8Jc5!Nf6Q",
  },
] as const;

async function ensureOwner(input: (typeof OWNERS)[number]) {
  const email = input.email.toLowerCase();
  const hashed = await hashPassword(input.password);

  let user = await prisma.user.findUnique({
    where: { email },
    include: { staffProfile: true, accounts: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        emailVerified: true,
        accounts: {
          create: {
            accountId: email,
            providerId: "credential",
            password: hashed,
          },
        },
        staffProfile: { create: { isActive: true } },
      },
      include: { staffProfile: true, accounts: true },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: input.name, emailVerified: true },
    });

    const credential = user.accounts.find((a) => a.providerId === "credential");
    if (credential) {
      await prisma.account.update({
        where: { id: credential.id },
        data: { password: hashed },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: email,
          providerId: "credential",
          password: hashed,
        },
      });
    }

    if (user.staffProfile) {
      await prisma.staffProfile.update({
        where: { userId: user.id },
        data: { isActive: true },
      });
    } else {
      await prisma.staffProfile.create({
        data: { userId: user.id, isActive: true },
      });
    }
  }

  const ownerRole = await prisma.role.findUnique({ where: { key: "OWNER" } });
  if (!ownerRole) {
    throw new Error(
      'Role OWNER missing — run full seed first: ./node_modules/.bin/tsx prisma/seed.ts',
    );
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: ownerRole.id } },
    update: {},
    create: { userId: user.id, roleId: ownerRole.id },
  });

  return email;
}

async function main() {
  for (const owner of OWNERS) {
    const email = await ensureOwner(owner);
    console.info(`OWNER ready: ${email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
