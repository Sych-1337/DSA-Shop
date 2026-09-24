import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
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
      imageUrl: item.imageUrl,
    })),
  }));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Sales"
        description="Черги за статусами: група → статус → картка з контактами, доставкою й товарами."
        meta={`У черзі: ${cards.length}`}
        actions={
          <Button href="/admin/orders" variant="secondary" size="sm">
            Список
          </Button>
        }
      />

      <SalesBoard orders={cards} />
    </div>
  );
}
