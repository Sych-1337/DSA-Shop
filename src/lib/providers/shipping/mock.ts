import type {
  CreateShipmentInput,
  CreateShipmentResult,
  ShippingProvider,
  ShippingQuoteInput,
  ShippingQuoteResult,
} from "./types";

const FREE_SHIPPING_THRESHOLD = 150_000; // 1500 UAH in kopiyky

export class MockShippingProvider implements ShippingProvider {
  async quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult> {
    const isFree = input.subtotalAmount >= FREE_SHIPPING_THRESHOLD;
    return {
      amount: isFree ? 0 : 7_900,
      currency: "UAH",
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
      isFree,
    };
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    return {
      externalShipmentId: `mock_ship_${input.orderId}`,
      trackingNumber: `MOCK${Date.now()}`,
      labelUrl: undefined,
    };
  }

  async cancelShipment(externalShipmentId: string): Promise<void> {
    void externalShipmentId;
  }

  async getTracking(trackingNumber: string) {
    return {
      status: "IN_TRANSIT",
      events: [
        {
          at: new Date().toISOString(),
          description: `Mock tracking for ${trackingNumber}`,
        },
      ],
    };
  }
}
