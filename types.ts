export type InvoiceStatus =
  | 'draft'
  | 'extracted'
  | 'matching_in_progress'
  | 'matched'
  | 'variance_flagged'
  | 'approved'
  | 'posted_to_gl'
  | 'rejected';

export type MatchingStatus =
  | 'exact_match'
  | 'price_variance'
  | 'quantity_variance'
  | 'missing_po'
  | 'bank_variance'
  | 'pending';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glCode: string;
  glAccountName: string;
  costCenter: string;
  confidence: number;
}

export interface InvoiceAnomaly {
  type:
    | 'price_increase'
    | 'qty_mismatch'
    | 'duplicate_hash'
    | 'bank_detail_change'
    | 'tax_calculation'
    | 'high_amount'
    | 'po_missing';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface BankDetails {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  verified: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  vendorEmail: string;
  vendorTaxId: string;
  vendorAddress: string;
  bankDetails: BankDetails;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  poNumber: string;
  lineItems: InvoiceLineItem[];
  extractionConfidence: number;
  status: InvoiceStatus;
  matchingStatus: MatchingStatus;
  matchingConfidence: number;
  anomalies: InvoiceAnomaly[];
  journalEntryId?: string;
  sampleCategory?: 'cloud_saas' | 'logistics' | 'hardware' | 'consulting' | 'facilities';
  notes?: string;
  rawTextPreview?: string;
  isAutoPass?: boolean;
  reconciliationResult?: ReconciliationResult;
  gstRate?: number;
  gstAmount?: number;
}

export interface POLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glCode: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  issueDate: string;
  deliveryDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'open' | 'partially_received' | 'fulfilled' | 'closed';
  department: string;
  costCenter: string;
  approver: string;
  lineItems: POLineItem[];
}

export interface GoodsReceiptItem {
  lineItemId: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  condition: 'accepted' | 'damaged' | 'shortage';
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  poNumber: string;
  receivedDate: string;
  receivedBy: string;
  warehouseLocation: string;
  items: GoodsReceiptItem[];
  notes?: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  referenceNumber: string;
  amount: number; // negative for payment out
  accountName: string;
  status: 'unreconciled' | 'matched' | 'reconciled' | 'variance';
  matchedInvoiceId?: string;
  matchedInvoiceNumber?: string;
  matchedVendor?: string;
  matchScore?: number;
  varianceAmount?: number;
  reconciledAt?: string;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  costCenter: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  vendorName: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: 'draft' | 'posted';
  postedAt?: string;
  postedBy: string;
  erpReference?: string;
  notes?: string;
}

export interface GLAccount {
  code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Expense' | 'Equity' | 'Revenue';
  subType: string;
}

export interface ReconciliationResult {
  invoiceId: string;
  poNumber: string;
  overallMatch: boolean;
  matchScore: number;
  status: MatchingStatus;
  priceVariance: number;
  priceVariancePct: number;
  quantityVariance: number;
  grnStatus: 'fully_received' | 'shortage' | 'missing_grn' | 'not_applicable';
  taxMatch: boolean;
  notes: string;
  recommendedAction: 'auto_approve' | 'manager_review' | 'generate_dispute' | 'request_po';
  lineItemComparisons: Array<{
    invoiceLineDesc: string;
    invoiceQty: number;
    invoiceUnitPrice: number;
    invoiceAmount: number;
    poQty?: number;
    poUnitPrice?: number;
    poAmount?: number;
    grnQtyReceived?: number;
    match: boolean;
    reason?: string;
  }>;
}

export interface STPConfig {
  autoApproveConfidence: number; // default 92
  priceVarianceTolerancePct: number; // default 2.0%
  autoPostToGL: boolean;
  duplicateHashCheck: boolean;
  strictThreeWayMatch: boolean;
  earlyPaymentDiscountAlert: boolean;
}
