import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReturnsPanel, type AdminReturnRow } from "@/components/admin/returns-panel";
import { ReturnRequestStatus } from "@/generated/prisma";
import { listAdminReturnRequests } from "@/features/returns/service";
import { getStaffContext, requirePermission, staffHasPermission } from "@/lib/auth/rbac";

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
    <div className="space-y-5">
      <AdminPageHeader
        title="Повернення"
        description="Схвалення → отримання → повернення коштів. За потреби — повернення на склад."
        meta={`Заявок: ${total}`}
      />

      <AdminFilterBar
        chips={FILTERS.map((filter) => ({
          href: filter.key === "all" ? "/admin/returns" : `/admin/returns?status=${filter.key}`,
          label: filter.label,
          active: (params.status ?? "all") === filter.key,
        }))}
      />

      <ReturnsPanel rows={rows} canWrite={canWrite} />
    </div>
  );
}
