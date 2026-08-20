export type ShippingQuoteInput = {
  cityRef: string;
  weightGrams: number;
  subtotalAmount: number;
  method: "WAREHOUSE" | "LOCKER" | "ADDRESS";
};

export type ShippingQuoteResult = {
  amount: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isFree: boolean;
};

export type CreateShipmentInput = {
  orderId: string;
  orderNumber: string;
  recipientName: string;
  phone: string;
  cityRef: string;
  warehouseRef?: string;
  addressLine?: string;
  weightGrams: number;
};

export type CreateShipmentResult = {
  externalShipmentId: string;
  trackingNumber: string;
  labelUrl?: string;
};

export interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult>;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  cancelShipment(externalShipmentId: string): Promise<void>;
  getTracking(trackingNumber: string): Promise<{ status: string; events: { at: string; description: string }[] }>;
}
