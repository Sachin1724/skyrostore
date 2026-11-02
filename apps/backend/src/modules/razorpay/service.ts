import crypto from "crypto";
import Razorpay from "razorpay";
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentSessionStatus,
  isDefined,
} from "@medusajs/framework/utils";

type RazorpayOptions = {
  key_id: string;
  key_secret: string;
  webhook_secret: string;
};

class RazorpayProviderService extends AbstractPaymentProvider<RazorpayOptions> {
  static identifier = "razorpay";

  protected razorpay_: InstanceType<typeof Razorpay>;
  protected options_: RazorpayOptions;

  static validateOptions(options: RazorpayOptions) {
    if (!isDefined(options.key_id)) {
      throw new Error("Razorpay key_id is required");
    }
    if (!isDefined(options.key_secret)) {
      throw new Error("Razorpay key_secret is required");
    }
  }

  constructor(cradle: any, options: RazorpayOptions) {
    // @ts-ignore
    super(...arguments);
    this.options_ = options;
    this.razorpay_ = new Razorpay({
      key_id: options.key_id,
      key_secret: options.key_secret,
    });
  }

  /**
   * Wraps a provider failure in a Medusa error. The provider's raw description
   * is kept, but never its request payload, which can carry payment details.
   */
  private paymentError(message: string, err?: unknown): MedusaError {
    const detail =
      err && typeof err === "object"
        ? (err as any)?.error?.description || (err as any)?.message
        : undefined;
    return new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      detail ? `${message}: ${detail}` : message
    );
  }

  async initiatePayment(input: any): Promise<any> {
    const { amount, currency_code, context, data } = input;

    // Amount in smallest unit (paise for INR)
    const amountInSmallest = Math.round(Number(amount));

    // Magic Checkout: Razorpay collects the address and adds shipping on top of
    // line_items_total, so the order is created for the items only and the
    // remainder of the cart total is returned as the shipping fee.
    const lineItems = Array.isArray(data?.line_items) ? data.line_items : null;
    const lineItemsTotal = lineItems
      ? lineItems.reduce((sum: number, li: any) => sum + Number(li.offer_price) * Number(li.quantity), 0)
      : amountInSmallest;
    if (lineItems && (lineItemsTotal <= 0 || lineItemsTotal > amountInSmallest)) {
      throw this.paymentError("Line items do not match the cart total");
    }

    const order = await this.razorpay_.orders.create({
      amount: lineItemsTotal,
      currency: (currency_code || "INR").toUpperCase(),
      receipt: context?.session_id || `rcpt_${Date.now()}`,
      notes: {
        session_id: context?.session_id || "",
        cart_id: data?.cart_id || context?.extra?.cart_id || "",
        shipping_fee: String(amountInSmallest - lineItemsTotal),
      },
      ...(lineItems ? { line_items_total: lineItemsTotal, line_items: lineItems } : {}),
    } as any);

    return {
      id: order.id,
      data: {
        razorpay_order_id: order.id,
        razorpay_key_id: this.options_.key_id,
        amount: amountInSmallest,
        currency: order.currency,
        status: order.status,
        magic_checkout: Boolean(lineItems),
      },
    };
  }

  async authorizePayment(input: any): Promise<any> {
    const { data } = input;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: expectedAmount,
    } = data || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: { error: "Missing payment verification fields" },
      };
    }

    // Verify signature server-side
    const expectedSignature = crypto
      .createHmac("sha256", this.options_.key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: { error: "Payment signature verification failed" },
      };
    }

    // Fetch payment from Razorpay to confirm status
    const payment = await this.razorpay_.payments.fetch(razorpay_payment_id);

    // The payment must belong to this order and cover the whole cart, so a
    // tampered order (e.g. cheaper line items) can never complete a cart.
    if (payment.order_id !== razorpay_order_id || Number(payment.amount) < Number(expectedAmount || 0)) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: { razorpay_payment_id, error: "Payment does not match this order" },
      };
    }

    if (payment.status === "captured" || payment.status === "authorized") {
      return {
        status: PaymentSessionStatus.AUTHORIZED,
        data: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          razorpay_status: payment.status,
          razorpay_key_id: data.razorpay_key_id,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
        },
      };
    }

    return {
      status: PaymentSessionStatus.ERROR,
      data: {
        razorpay_payment_id,
        razorpay_status: payment.status,
        error: `Payment status: ${payment.status}`,
      },
    };
  }

  async capturePayment(input: any): Promise<any> {
    const paymentId = input.data?.razorpay_payment_id;
    if (!paymentId) {
      return { data: input.data || {} };
    }

    try {
      const payment = await this.razorpay_.payments.fetch(paymentId);
      if (payment.status === "authorized") {
        await this.razorpay_.payments.capture(
          paymentId,
          payment.amount as number,
          payment.currency as string
        );
      }
      return { data: { ...input.data, captured: true } };
    } catch (err: any) {
      throw this.paymentError("Razorpay capture failed", err);
    }
  }

  async refundPayment(input: any): Promise<any> {
    const paymentId = input.data?.razorpay_payment_id;
    const amount = input.amount;

    if (!paymentId) {
      throw this.paymentError("Missing razorpay_payment_id for refund");
    }

    try {
      const refund = await this.razorpay_.payments.refund(paymentId, {
        amount: Math.round(amount),
      });
      return {
        data: {
          ...input.data,
          refund_id: refund.id,
          refund_status: refund.status,
        },
      };
    } catch (err: any) {
      throw this.paymentError("Razorpay refund failed", err);
    }
  }

  async cancelPayment(input: any): Promise<any> {
    return { data: { ...input.data, cancelled: true } };
  }

  async deletePayment(input: any): Promise<any> {
    return { data: {} };
  }

  async getPaymentStatus(input: any): Promise<any> {
    const paymentId = input.data?.razorpay_payment_id;
    if (!paymentId) return PaymentSessionStatus.PENDING;

    try {
      const payment = await this.razorpay_.payments.fetch(paymentId);
      switch (payment.status) {
        case "captured":
          return PaymentSessionStatus.AUTHORIZED;
        case "authorized":
          return PaymentSessionStatus.AUTHORIZED;
        case "failed":
          return PaymentSessionStatus.ERROR;
        case "refunded":
          return PaymentSessionStatus.AUTHORIZED;
        default:
          return PaymentSessionStatus.PENDING;
      }
    } catch {
      return PaymentSessionStatus.ERROR;
    }
  }

  async retrievePayment(input: any): Promise<any> {
    const paymentId = input.data?.razorpay_payment_id;
    if (!paymentId) return {};

    try {
      return await this.razorpay_.payments.fetch(paymentId);
    } catch {
      return {};
    }
  }

  async updatePayment(input: any): Promise<any> {
    return { data: input.data || {} };
  }

  async getPaymentData(input: any): Promise<any> {
    return input.data || {};
  }

  async getStatus(paymentSessionData: any): Promise<string> {
    return paymentSessionData?.razorpay_status || "pending";
  }

  /**
   * Translates a verified Razorpay webhook into the normalised action the
   * payment module acts on. Signature verification happens in the webhook
   * route before this is reached.
   */
  async getWebhookActionAndData(payload: any): Promise<any> {
    const event = payload?.data ?? payload;
    const entity = event?.payload?.payment?.entity;
    const sessionId = entity?.notes?.session_id || entity?.notes?.cart_id;
    const amount = entity?.amount;

    if (!entity || !sessionId) {
      return { action: "not_supported" };
    }

    switch (event?.event) {
      case "payment.captured":
        return { action: "captured", data: { session_id: sessionId, amount } };
      case "payment.authorized":
        return { action: "authorized", data: { session_id: sessionId, amount } };
      case "payment.failed":
        return { action: "failed", data: { session_id: sessionId, amount } };
      default:
        return { action: "not_supported" };
    }
  }

  async createAccountHolder(input: any): Promise<any> {
    return { id: input.data?.customer_id || input.id || "unknown" };
  }

  async deleteAccountHolder(input: any): Promise<any> {
    return { id: input.id };
  }

  async retrieveAccountHolder(input: any): Promise<any> {
    return { id: input.id };
  }
}

export default RazorpayProviderService;
