/**
 * Bulk Orders & Custom UAV Builds Core Logic & State Machine
 */

export type BulkOrderRequestType =
  | "BULK_PURCHASE"
  | "CUSTOM_BUILD"
  | "BULK_CUSTOM_BUILD";

export type BulkOrderStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "QUOTED"
  | "ACCEPTED"
  | "CONVERTED_TO_ORDER"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export const ALLOWED_STATUS_TRANSITIONS: Record<BulkOrderStatus, BulkOrderStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "NEEDS_INFORMATION", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["NEEDS_INFORMATION", "QUOTED", "REJECTED", "CANCELLED"],
  NEEDS_INFORMATION: ["UNDER_REVIEW", "QUOTED", "REJECTED", "CANCELLED"],
  QUOTED: ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED", "UNDER_REVIEW"],
  ACCEPTED: ["CONVERTED_TO_ORDER", "CANCELLED"],
  CONVERTED_TO_ORDER: [],
  REJECTED: [],
  EXPIRED: ["UNDER_REVIEW"],
  CANCELLED: [],
};

export interface BulkOrderLineItemInput {
  productId?: string;
  variantId?: string;
  title: string;
  configurationReference?: string;
  requestedQuantity: number;
  notes?: string;
}

export interface BulkOrderCreateInput {
  customerId?: string | null;
  contactName: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  gstin?: string | null;
  requestType: BulkOrderRequestType;
  items: BulkOrderLineItemInput[];
  // Custom Engineering Requirements
  intendedApplication?: string | null;
  targetPayloadG?: number | null;
  targetFlightTimeMin?: number | null;
  operatingEnvironment?: string | null;
  sensorsPayload?: string | null;
  telemetryRequirements?: string | null;
  targetUnitCount?: number;
  additionalSpecifications?: string | null;
  // Delivery & Commercial
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryPincode?: string | null;
  timeframeWeeks?: number | null;
  budgetRange?: string | null;
}

export function generateReferenceNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `REQ-${year}-${rand}`;
}

export function isValidTransition(from: BulkOrderStatus, to: BulkOrderStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
