/**
 * HSN classification and CGST/SGST vs IGST split for the GST tax invoice.
 * Only the codes the business has actually confirmed are mapped — an
 * unclassified component shows "Confirm HSN" rather than a fabricated code,
 * since a wrong HSN on a tax invoice is a compliance problem, not a cosmetic one.
 */
export const HSN_BY_COMPONENT_TYPE: Record<string, string> = {
  MOTOR: "8501",
  ESC: "8504",
  BATTERY: "8507",
  PROPELLER: "8807",
  FRAME: "8807",
};

export const COMPLETE_UAV_HSN = "8806";

export function hsnForItem(componentType?: string | null): string {
  if (!componentType) return "Confirm HSN";
  if (componentType === "COMPLETE_UAV") return COMPLETE_UAV_HSN;
  return HSN_BY_COMPONENT_TYPE[componentType] ?? "Confirm HSN";
}

// Supplier is registered in Odisha (state code 21) — see store settings GSTIN.
const SUPPLIER_STATE = "odisha";

export function isIntraState(shippingProvince?: string | null): boolean {
  return (shippingProvince || "").trim().toLowerCase() === SUPPLIER_STATE;
}

const GST_RATE = 0.18;

/** Splits a GST-inclusive amount into its taxable value and CGST+SGST (intra-state) or IGST (inter-state) components. */
export function splitGst(amountInclGst: number, intraState: boolean) {
  const taxable = amountInclGst / (1 + GST_RATE);
  const totalTax = amountInclGst - taxable;
  if (intraState) {
    return { taxable, cgst: totalTax / 2, sgst: totalTax / 2, igst: 0 };
  }
  return { taxable, cgst: 0, sgst: 0, igst: totalTax };
}
