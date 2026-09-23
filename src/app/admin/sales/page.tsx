import { SalesBoard, type SalesOrderCard } from "@/components/admin/sales-board";
import { listOrdersForKanban } from "@/features/orders/admin-service";
import { requirePermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminSalesKanbanPage() {
  await requirePermission("orders.read", "/admin/sales");
  const orders = await listOrdersForKanban();

  const cards: SalesOrderCard[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    customerFirstName: order.customerFirstName,
    customerLastName: order.customerLastName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingCity: order.shippingCity,
    shippingMethod: order.shippingMethod,
    shippingWarehouseRef: order.shippingWarehouseRef,
    shippingAddressLine: order.shippingAddressLine,
    customerNote: order.customerNote,
    items: order.items.map((item) => ({
      id: item.id,
      productTitle: item.productTitle,
      variantTitle: item.variantTitle,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceAmount: item.unitPriceAmount,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl font-semibold">Sales center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Черги за статусами без довгої каруселі: спочатку оберіть групу, потім статус. На картці —
          контакти, доставка, товари й коментар покупця. Оплата — лише повна передоплата.
        </p>
      </div>

      <SalesBoard orders={cards} />
    </div>
  );
}
