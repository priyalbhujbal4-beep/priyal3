import React, { useState } from 'react';
import { 
  GitMerge, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  PackageCheck, 
  Truck, 
  Send, 
  Sparkles, 
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { Invoice, PurchaseOrder, GoodsReceivedNote, ReconciliationResult } from '../types';

interface ReconciliationArenaProps {
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceivedNote[];
  selectedInvoice: Invoice;
  onSelectInvoice: (invoice: Invoice) => void;
  onApproveInvoice: (invoiceId: string) => void;
  onPostToGL: (invoiceId: string) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: any, matchingStatus: any) => void;
}

export const ReconciliationArena: React.FC<ReconciliationArenaProps> = ({
  invoices,
  purchaseOrders,
  goodsReceipts,
  selectedInvoice,
  onSelectInvoice,
  onApproveInvoice,
  onPostToGL,
  onUpdateInvoiceStatus,
}) => {
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeDraft, setDisputeDraft] = useState('');
  const [copied, setCopied] = useState(false);

  // Find linked PO and GRN
  const linkedPO = purchaseOrders.find((po) => po.poNumber === selectedInvoice.poNumber);
  const linkedGRN = goodsReceipts.find((grn) => grn.poNumber === selectedInvoice.poNumber);

  // Run AI 3-Way match evaluation
  const handleRunReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch('/api/reconcile-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: selectedInvoice,
          purchaseOrder: linkedPO,
          goodsReceipt: linkedGRN,
          tolerancePct: 2.5,
        }),
      });
      const data = await res.json();
      setReconciliationResult(data);
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setIsReconciling(false);
    }
  };

  const openDisputeGenerator = async () => {
    setDisputeModalOpen(true);
    try {
      const res = await fetch('/api/ai-audit-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Draft a formal enterprise vendor dispute notice for invoice ${selectedInvoice.invoiceNumber} from ${selectedInvoice.vendorName}. The invoice billed for ₹${selectedInvoice.totalAmount} under PO ${selectedInvoice.poNumber}. Explain the shortage/variance and request an official credit memo.`,
          context: { selectedInvoice },
        }),
      });
      const data = await res.json();
      setDisputeDraft(data.answer || 'Dispute notice generated.');
    } catch (e) {
      setDisputeDraft(`Attention Accounts Receivable at ${selectedInvoice.vendorName}:\n\nOur 3-way matching system has placed payment hold on Invoice ${selectedInvoice.invoiceNumber} due to a quantity discrepancy between the invoice and warehouse dock receipt ${linkedGRN?.grnNumber || 'GRN-2025'}.\n\nPlease issue an amended credit memo for the unfulfilled units.\n\nAccounts Payable Operations`);
    }
  };

  const copyDispute = () => {
    navigator.clipboard.writeText(disputeDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Invoice Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 overflow-x-auto py-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Select Target Invoice:
          </span>
          {invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => {
                onSelectInvoice(inv);
                setReconciliationResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                selectedInvoice.id === inv.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span>{inv.vendorName.split(' ')[0]}</span>
              <span className="font-mono text-[11px] opacity-80">
                ₹{inv.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              {inv.matchingStatus === 'exact_match' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        <button
          id="btn-re-eval-match"
          onClick={handleRunReconcile}
          disabled={isReconciling}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isReconciling ? 'Evaluating...' : 'Re-Run 3-Way Match Check'}</span>
        </button>
      </div>

      {/* 3 Pillars of 3-Way Matching: Document Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Vendor Invoice */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  1. Vendor Invoice
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-white">
              ₹{selectedInvoice.totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Vendor:</span>
              <span className="text-slate-200 font-medium truncate max-w-[150px]">
                {selectedInvoice.vendorName}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Payment Terms:</span>
              <span className="text-slate-200">{selectedInvoice.paymentTerms}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>PO Stated:</span>
              <span className="font-mono text-cyan-400">
                {selectedInvoice.poNumber || 'None (Non-PO)'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">Billed Items:</span>
              {selectedInvoice.lineItems.map((li) => (
                <div key={li.id} className="flex justify-between font-mono text-[11px] py-0.5">
                  <span className="truncate max-w-[160px] text-slate-300">
                    {li.quantity}x {li.description}
                  </span>
                  <span className="text-slate-200">₹{li.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 2: Purchase Order (Authorized) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <PackageCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  2. Purchase Order
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {linkedPO ? linkedPO.poNumber : 'No PO Matched'}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-white">
              {linkedPO ? `₹${linkedPO.totalAmount.toFixed(2)}` : '₹0.00'}
            </span>
          </div>

          {linkedPO ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Department:</span>
                <span className="text-slate-200 font-medium">{linkedPO.department}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Authorized By:</span>
                <span className="text-slate-200">{linkedPO.approver}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>PO Status:</span>
                <span className="text-emerald-400 uppercase font-semibold text-[10px]">
                  {linkedPO.status}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">Authorized Items:</span>
                {linkedPO.lineItems.map((pli) => (
                  <div key={pli.id} className="flex justify-between font-mono text-[11px] py-0.5">
                    <span className="truncate max-w-[160px] text-slate-300">
                      {pli.quantity}x {pli.description}
                    </span>
                    <span className="text-slate-200">₹{pli.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              No matching authorized PO found in ERP system. Requires Department Head manual sign-off.
            </div>
          )}
        </div>

        {/* Pillar 3: Goods Received Note (GRN) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Truck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  3. Warehouse Receiving (GRN)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {linkedGRN ? linkedGRN.grnNumber : 'N/A (Digital / Pending)'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300">
              {linkedGRN ? 'Logged' : 'Pending'}
            </span>
          </div>

          {linkedGRN ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Received By:</span>
                <span className="text-slate-200 font-medium truncate max-w-[140px]">
                  {linkedGRN.receivedBy}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dock Location:</span>
                <span className="text-slate-200 truncate max-w-[140px]">
                  {linkedGRN.warehouseLocation}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Received Date:</span>
                <span className="font-mono text-slate-200">{linkedGRN.receivedDate}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">Physical Receipt Count:</span>
                {linkedGRN.items.map((gri, idx) => (
                  <div key={idx} className="flex justify-between font-mono text-[11px] py-0.5">
                    <span className="truncate max-w-[160px] text-slate-300">
                      {gri.quantityReceived} of {gri.quantityOrdered} rec'd
                    </span>
                    <span
                      className={`font-semibold text-[10px] uppercase px-1 rounded ${
                        gri.condition === 'shortage'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {gri.condition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              <HelpCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              Direct service or digital SaaS consumption. Physical receiving slip not applicable.
            </div>
          )}
        </div>
      </div>

      {/* 3-Way Matching Engine Verdict Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">
                Reconciliation Analysis & Variance Detection
              </h3>
              {selectedInvoice.matchingStatus === 'exact_match' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Exact 3-Way Match (100%)
                </span>
              ) : selectedInvoice.matchingStatus === 'price_variance' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Price Variance (+2.0%)
                </span>
              ) : selectedInvoice.matchingStatus === 'quantity_variance' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  Quantity Shortage (5 Units)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Non-PO Route
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous matching algorithm comparing line-level quantities, unit costs, and warehouse intake logs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {selectedInvoice.matchingStatus === 'exact_match' ? (
              <button
                id="btn-auto-post-gl"
                onClick={() => onPostToGL(selectedInvoice.id)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Auto-Post to GL</span>
              </button>
            ) : selectedInvoice.matchingStatus === 'quantity_variance' ? (
              <div className="flex items-center space-x-2">
                <button
                  id="btn-dispute-vendor"
                  onClick={openDisputeGenerator}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Draft Vendor Dispute</span>
                </button>
                <button
                  onClick={() => onApproveInvoice(selectedInvoice.id)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  Manager Override
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="btn-approve-variance"
                  onClick={() => onApproveInvoice(selectedInvoice.id)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                >
                  <span>Accept Tolerance & Approve</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Audit Explanations */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start space-x-3">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">AI Auditor Insight:</span>{' '}
            {reconciliationResult?.notes || selectedInvoice.notes}
          </div>
        </div>

        {/* Detailed Line Item Comparison Grid */}
        <div className="mt-5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            3-Way Line-by-Line Discrepancy Matrix
          </h4>
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Billed Qty</th>
                  <th className="py-2.5 px-3 text-center">PO Authorized</th>
                  <th className="py-2.5 px-3 text-center">Dock Rec'd</th>
                  <th className="py-2.5 px-3 text-right">Invoice Unit ₹</th>
                  <th className="py-2.5 px-3 text-right">PO Unit ₹</th>
                  <th className="py-2.5 px-3 text-center">Match Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {selectedInvoice.lineItems.map((li, idx) => {
                  const poLine = linkedPO?.lineItems[idx] || linkedPO?.lineItems[0];
                  const grnLine = linkedGRN?.items[idx] || linkedGRN?.items[0];

                  const qtyMismatch = grnLine && grnLine.quantityReceived < li.quantity;
                  const priceMismatch = poLine && Math.abs(poLine.unitPrice - li.unitPrice) > 0.01;

                  return (
                    <tr key={li.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-sans text-slate-200">
                        {li.description}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-white">
                        {li.quantity}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300">
                        {poLine ? poLine.quantity : '-'}
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${qtyMismatch ? 'text-rose-400' : 'text-slate-300'}`}>
                        {grnLine ? grnLine.quantityReceived : (linkedPO ? poLine?.quantity : '-')}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-200">
                        ₹{li.unitPrice.toFixed(2)}
                      </td>
                      <td className={`py-3 px-3 text-right ${priceMismatch ? 'text-amber-400' : 'text-slate-300'}`}>
                        {poLine ? `₹${poLine.unitPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        {qtyMismatch ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Shortage (-5 units)
                          </span>
                        ) : priceMismatch ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Price Diff (+₹{(li.unitPrice - (poLine?.unitPrice || 0)).toFixed(2)})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Match
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: AI Vendor Dispute Draft Notice */}
      {disputeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                  <Send className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    AI-Generated Vendor Dispute & Credit Memo Request
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    To: {selectedInvoice.vendorEmail || 'receivables@vendor.com'} • Ref: {selectedInvoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
              {disputeDraft}
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400">
                A formal partial payment hold of <span className="font-mono text-rose-400 font-bold">₹1,995.00</span> has been enacted on ERP ledger.
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyDispute}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={() => {
                    setDisputeModalOpen(false);
                    onUpdateInvoiceStatus(selectedInvoice.id, 'variance_flagged', 'quantity_variance');
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <span>Dispatch & Enforce Hold</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
