import Link from "next/link";

import { ReturnsPanel, type AdminReturnRow } from "@/components/admin/returns-panel";
import { ReturnRequestStatus } from "@/generated/prisma";
import { listAdminReturnRequests } from "@/features/returns/service";
import { getStaffContext, requirePermission, staffHasPermission } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

const FILTERS: { key: string; label: string; status?: ReturnRequestStatus }[] = [
  { key: "all", label: "Усі" },
  { key: "REQUESTED", label: "Нові", status: "REQUESTED" },
  { key: "APPROVED", label: "Схвалені", status: "APPROVED" },
  { key: "RECEIVED", label: "Отримані", status: "RECEIVED" },
  { key: "REFUNDED", label: "Завершені", status: "REFUNDED" },
  { key: "REJECTED", label: "Відхилені", status: "REJECTED" },
];

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("orders.read", "/admin/returns");
  const staff = await getStaffContext();
  const params = await searchParams;
  const statusFilter = FILTERS.find((f) => f.key === params.status)?.status;

  const { items, total } = await listAdminReturnRequests({
    status: statusFilter,
    pageSize: 50,
  });

  const rows: AdminReturnRow[] = items.map((item) => ({
    id: item.id,
    status: item.status,
    reason: item.reason,
    customerNote: item.customerNote,
    adminNote: item.adminNote,
    refundAmount: item.refundAmount,
    createdAt: item.createdAt.toISOString(),
    order: item.order,
    items: item.items.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      productTitle: line.orderItem.productTitle,
      variantTitle: line.orderItem.variantTitle,
      sku: line.orderItem.sku,
    })),
  }));

  const canWrite = staff ? staffHasPermission(staff, "orders.write") : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl font-semibold">Повернення</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Заявки покупців «товар не підійшов». Схвалення → отримання → повернення коштів. За
          потреби товар повертається на склад.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Заявок: {total}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = (params.status ?? "all") === filter.key;
          const href =
            filter.key === "all" ? "/admin/returns" : `/admin/returns?status=${filter.key}`;
          return (
            <Link
              key={filter.key}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <ReturnsPanel rows={rows} canWrite={canWrite} />
    </div>
  );
}
