import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdminAuthBypassEnabled } from "@/lib/auth/bypass";
import { prisma } from "@/lib/db/prisma";

export type StaffContext = {
  userId: string;
  email: string;
  name: string;
  roleKeys: string[];
  permissions: Set<string>;
};

export { isAdminAuthBypassEnabled } from "@/lib/auth/bypass";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getStaffContext(): Promise<StaffContext | null> {
  if (isAdminAuthBypassEnabled()) {
    return {
      userId: "bypass",
      email: "bypass@local",
      name: "Dev Bypass",
      roleKeys: ["OWNER"],
      permissions: new Set([
        "orders.read",
        "orders.write",
        "orders.cancel",
        "payments.read",
        "payments.refund",
        "payments.manualMark",
        "products.read",
        "products.write",
        "products.cost.read",
        "inventory.read",
        "inventory.adjust",
        "customers.read",
        "customers.export",
        "content.write",
        "seo.write",
        "analytics.read",
        "finance.read",
        "commissions.read",
        "commissions.manage",
        "staff.manage",
        "settings.manage",
        "audit.read",
      ]),
    };
  }

  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      staffProfile: true,
      userRoles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!user?.staffProfile?.isActive) return null;

  const roleKeys = user.userRoles.map((ur) => ur.role.key);
  const permissions = new Set<string>();
  for (const ur of user.userRoles) {
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.key);
    }
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    roleKeys,
    permissions,
  };
}

export async function requireStaff(returnTo = "/admin") {
  const staff = await getStaffContext();
  if (!staff) {
    redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  }
  return staff;
}

export async function requirePermission(permission: string, returnTo = "/admin") {
  const staff = await requireStaff(returnTo);
  if (!staff.permissions.has(permission)) {
    redirect("/admin/forbidden");
  }
  return staff;
}

/** For Server Actions — throws instead of redirecting. */
export async function assertPermission(permission: string) {
  const staff = await getStaffContext();
  if (!staff) {
    throw new Error("Unauthorized");
  }
  if (!staff.permissions.has(permission)) {
    throw new Error("Forbidden");
  }
  return staff;
}

export function staffHasPermission(staff: StaffContext, permission: string) {
  return staff.permissions.has(permission);
}

/** Route permission used to filter admin nav links. */
export const ADMIN_NAV_PERMISSION: Record<string, string | null> = {
  "/admin": null,
  "/admin/sales": "orders.read",
  "/admin/orders": "orders.read",
  "/admin/returns": "orders.read",
  "/admin/payments": "payments.read",
  "/admin/emails": "orders.read",
  "/admin/notifications": "orders.read",
  "/admin/shipments": "orders.read",
  "/admin/customers": "customers.read",
  "/admin/products": "products.read",
  "/admin/reviews": "products.read",
  "/admin/back-in-stock": "customers.read",
  "/admin/coupons": "products.read",
  "/admin/inventory": "inventory.read",
  "/admin/content": "content.write",
  "/admin/seo": "seo.write",
  "/admin/analytics": "analytics.read",
  "/admin/commissions": "commissions.read",
  "/admin/settings": "settings.manage",
};
