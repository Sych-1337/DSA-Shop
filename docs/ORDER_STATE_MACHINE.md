# Order State Machine

Order, payment, and fulfillment statuses are **separate fields**. Transitions go through domain services + transactions + `OrderStatusHistory` + audit.

## Order status transitions (allowed)

```text
DRAFT → NEW | CANCELLED
NEW → AWAITING_CONFIRMATION | CONFIRMED | CANCELLED
AWAITING_CONFIRMATION → CONFIRMED | CANCELLED
CONFIRMED → PICKING | CANCELLED
PICKING → READY_TO_SHIP | CONFIRMED (unpick) | CANCELLED
READY_TO_SHIP → SHIPPED | PICKING
SHIPPED → DELIVERED | RETURN_IN_PROGRESS
DELIVERED → COMPLETED | RETURN_IN_PROGRESS
COMPLETED → RETURN_IN_PROGRESS (late return)
RETURN_IN_PROGRESS → RETURNED | COMPLETED | DELIVERED (reject return)
RETURNED → (terminal for order product state)
CANCELLED → (terminal)
```

Kanban drag-and-drop only for allowed edges.

## Payment rules

- Success only via verified webhook (or COD flow).
- Manual `PAID` requires `payments.manualMark` + reason.
- Refunds create `Refund` rows; may set `PARTIALLY_REFUNDED` / `REFUNDED`.
- Never delete payment records.

## Fulfillment rules

- Label creation may set `LABEL_CREATED`.
- Carrier webhooks/polling update transit states.
- Split shipments allowed; order fulfillment reflects aggregate.

## Inventory coupling

1. Checkout (online pay): create reservation (e.g. 15 min).
2. Payment success: keep reservation → convert to sale movement on confirm/pick policy (see `DECISIONS.md`).
3. Payment fail / expire: release reservation.
4. Cancel after sale: reverse movements as needed.

## Returns

`RETURN_IN_PROGRESS` → inspect → restock or write-off → refund/exchange → commission adjustment if needed.
