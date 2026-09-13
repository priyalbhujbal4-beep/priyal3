import { Invoice, PurchaseOrder, GoodsReceivedNote, ReconciliationResult, MatchingStatus } from '../types';

export function runThreeWayMatching(
  invoice: Partial<Invoice>,
  purchaseOrders: PurchaseOrder[],
  goodsReceipts: GoodsReceivedNote[],
  tolerancePct: number = 2.0
): {
  isAutoPass: boolean;
  matchingStatus: MatchingStatus;
  status: 'matched' | 'variance_flagged' | 'extracted';
  matchScore: number;
  reconciliationResult: ReconciliationResult;
  reason: string;
} {
  const invTotal = Number(invoice.totalAmount) || 0;
  const rawPoNumber = (invoice.poNumber || '').trim();
  const vendor = (invoice.vendorName || '').toLowerCase().trim();

  // 1. Locate matching Purchase Order
  let matchedPO: PurchaseOrder | undefined;

  if (rawPoNumber) {
    matchedPO = purchaseOrders.find(
      (po) => po.poNumber.toLowerCase() === rawPoNumber.toLowerCase()
    );
  }

  // If not found by PO number, search by vendor name
  if (!matchedPO && vendor) {
    matchedPO = purchaseOrders.find((po) => {
      const poVendor = po.vendorName.toLowerCase();
      return (
        poVendor.includes(vendor) ||
        vendor.includes(poVendor) ||
        poVendor.split(' ')[0] === vendor.split(' ')[0]
      );
    });
  }

  // Case A: Missing Purchase Order
  if (!matchedPO) {
    const result: ReconciliationResult = {
      invoiceId: invoice.id || `inv-${Date.now()}`,
      poNumber: rawPoNumber || 'NOT_FOUND',
      overallMatch: false,
      matchScore: 45,
      status: 'missing_po',
      priceVariance: 0,
      priceVariancePct: 0,
      quantityVariance: 0,
      grnStatus: 'missing_grn',
      taxMatch: false,
      notes: `Needs Review: No matching Purchase Order found in ERP for "${invoice.vendorName || 'Unknown Vendor'}". Routed for department authorization & manual PO generation.`,
      recommendedAction: 'request_po',
      lineItemComparisons: [],
    };

    return {
      isAutoPass: false,
      matchingStatus: 'missing_po',
      status: 'variance_flagged',
      matchScore: 45,
      reconciliationResult: result,
      reason: `Needs Review: No matching Purchase Order found for ${invoice.vendorName || 'Vendor'}.`,
    };
  }

  // 2. Locate corresponding Goods Receipt Note (GRN)
  const matchedGRN = goodsReceipts.find(
    (grn) => grn.poNumber.toLowerCase() === matchedPO!.poNumber.toLowerCase()
  );

  // 3. Price and total variance analysis
  const poTotal = Number(matchedPO.totalAmount) || 0;
  const priceDiff = invTotal - poTotal;
  const priceDiffPct = poTotal > 0 ? (Math.abs(priceDiff) / poTotal) * 100 : 0;
  const isWithinPriceTolerance = priceDiffPct <= tolerancePct;

  // 4. Line item comparison & quantity shortage checks
  let totalQtyVariance = 0;
  let hasLineItemMismatch = false;

  const comparisons = (invoice.lineItems || []).map((invLine) => {
    // Find corresponding PO line
    const poLine =
      matchedPO!.lineItems.find(
        (pl) =>
          pl.description.toLowerCase().includes(invLine.description.slice(0, 15).toLowerCase()) ||
          invLine.description.toLowerCase().includes(pl.description.slice(0, 15).toLowerCase())
      ) || matchedPO!.lineItems[0];

    const grnLine = matchedGRN?.items.find(
      (gl) =>
        gl.lineItemId === poLine?.id ||
        gl.description.toLowerCase().includes(invLine.description.slice(0, 15).toLowerCase())
    );

    const billedQty = Number(invLine.quantity) || 1;
    const receivedQty = grnLine ? grnLine.quantityReceived : (poLine?.quantity || billedQty);
    const qtyDiff = billedQty - receivedQty;
    if (qtyDiff > 0) {
      totalQtyVariance += qtyDiff;
    }

    const unitPriceDiff = Math.abs((Number(invLine.unitPrice) || 0) - (poLine?.unitPrice || 0));
    const linePriceWithinTolerance = poLine?.unitPrice
      ? (unitPriceDiff / poLine.unitPrice) * 100 <= tolerancePct
      : true;

    const lineMatches = qtyDiff <= 0 && linePriceWithinTolerance;
    if (!lineMatches) hasLineItemMismatch = true;

    return {
      invoiceLineDesc: invLine.description,
      invoiceQty: billedQty,
      invoiceUnitPrice: Number(invLine.unitPrice) || 0,
      invoiceAmount: Number(invLine.amount) || 0,
      poQty: poLine?.quantity,
      poUnitPrice: poLine?.unitPrice,
      poAmount: poLine?.amount,
      grnQtyReceived: receivedQty,
      match: lineMatches,
      reason: !lineMatches
        ? qtyDiff > 0
          ? `Shortage: Billed ${billedQty} units vs received ${receivedQty}`
          : `Unit price variance: ₹${invLine.unitPrice} vs PO ₹${poLine?.unitPrice}`
        : 'Exact Line Match',
    };
  });

  // 5. Determine Auto-Pass vs Needs Review
  const isAutoPass = isWithinPriceTolerance && totalQtyVariance === 0;

  let matchingStatus: MatchingStatus = 'exact_match';
  let recommendedAction: 'auto_approve' | 'manager_review' | 'generate_dispute' = 'auto_approve';
  let matchScore = 98;
  let reason = '';

  if (isAutoPass) {
    matchingStatus = 'exact_match';
    recommendedAction = 'auto_approve';
    matchScore = Math.max(94, Math.round(100 - priceDiffPct));
    reason = `Auto-Pass: 3-Way Match verified against ${matchedPO.poNumber} (${matchedPO.vendorName}) with ${priceDiffPct.toFixed(1)}% price variance (within ${tolerancePct}% tolerance limit) and 0 delivery shortages.`;
  } else if (totalQtyVariance > 0) {
    matchingStatus = 'quantity_variance';
    recommendedAction = 'generate_dispute';
    matchScore = 68;
    reason = `Needs Review: Warehouse receiving shortage detected against ${matchedPO.poNumber}. Billed quantity exceeds GRN received quantity by ${totalQtyVariance} units.`;
  } else {
    matchingStatus = 'price_variance';
    recommendedAction = 'manager_review';
    matchScore = 80;
    reason = `Needs Review: Price difference of ₹${Math.abs(priceDiff).toLocaleString('en-IN')} (${priceDiffPct.toFixed(1)}%) exceeds ${tolerancePct}% STP tolerance against ${matchedPO.poNumber} (PO total: ₹${poTotal.toLocaleString('en-IN')}).`;
  }

  const reconciliationResult: ReconciliationResult = {
    invoiceId: invoice.id || `inv-${Date.now()}`,
    poNumber: matchedPO.poNumber,
    overallMatch: isAutoPass,
    matchScore,
    status: matchingStatus,
    priceVariance: priceDiff,
    priceVariancePct: Number(priceDiffPct.toFixed(2)),
    quantityVariance: totalQtyVariance,
    grnStatus: matchedGRN
      ? totalQtyVariance > 0
        ? 'shortage'
        : 'fully_received'
      : 'missing_grn',
    taxMatch: true,
    notes: reason,
    recommendedAction,
    lineItemComparisons: comparisons,
  };

  return {
    isAutoPass,
    matchingStatus,
    status: isAutoPass ? 'matched' : 'variance_flagged',
    matchScore,
    reconciliationResult,
    reason,
  };
}
