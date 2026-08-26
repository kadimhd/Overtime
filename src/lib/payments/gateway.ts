// Payment gateway abstraction (spec §7).
//
// Overtime must NEVER hold funds itself: escrow means instructing a
// QCB-licensed gateway (Dibsy, Fatora, SADAD, ...) to authorize/hold a charge
// and capture or refund it later. This module is the single seam where a real
// integration replaces the mock — application code only ever talks to
// `getGateway()`.

export interface HoldResult {
  ok: boolean;
  /** Gateway-side reference for the held charge. */
  ref: string;
}

export interface PaymentGateway {
  name: "MOCK" | "DIBSY" | "FATORA";
  /** Authorize + hold an amount (QAR) against the client's payment method. */
  hold(amountQar: number, meta: { userId: string; purpose: string }): Promise<HoldResult>;
  /** Capture a previously held charge and pay out to the provider. */
  release(ref: string): Promise<boolean>;
  /** Void/refund a previously held charge back to the client. */
  refund(ref: string): Promise<boolean>;
  /** Charge a recurring subscription (no hold; captured immediately). */
  chargeSubscription(amountQar: number, meta: { userId: string; packageId: string }): Promise<HoldResult>;
}

class MockGateway implements PaymentGateway {
  name = "MOCK" as const;

  async hold(amountQar: number, meta: { userId: string; purpose: string }): Promise<HoldResult> {
    return { ok: true, ref: `mock_hold_${meta.purpose}_${amountQar}_${Date.now()}` };
  }

  async release(): Promise<boolean> {
    return true;
  }

  async refund(): Promise<boolean> {
    return true;
  }

  async chargeSubscription(amountQar: number, meta: { packageId: string; userId: string }): Promise<HoldResult> {
    return { ok: true, ref: `mock_sub_${meta.packageId}_${amountQar}_${Date.now()}` };
  }
}

// Placeholder adapters: wire these to the real SDKs once the gateway is chosen
// (spec §12 leaves Dibsy vs Fatora open) and the fintech-counsel review of the
// permitted escrow structure is done.
class DibsyGateway extends MockGateway {
  name = "DIBSY" as unknown as "MOCK";
}
class FatoraGateway extends MockGateway {
  name = "FATORA" as unknown as "MOCK";
}

export function getGateway(): PaymentGateway {
  switch (process.env.PAYMENT_GATEWAY) {
    case "DIBSY":
      return new DibsyGateway() as unknown as PaymentGateway;
    case "FATORA":
      return new FatoraGateway() as unknown as PaymentGateway;
    default:
      return new MockGateway();
  }
}
