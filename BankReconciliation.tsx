import React, { useState } from 'react';
import { 
  Landmark, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles,
  Link,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { BankTransaction, Invoice } from '../types';

interface BankReconciliationProps {
  transactions: BankTransaction[];
  invoices: Invoice[];
  onReconcileTransaction: (txId: string, invoiceId?: string) => void;
  onAutoReconcileAll: () => void;
}

export const BankReconciliation: React.FC<BankReconciliationProps> = ({
  transactions,
  invoices,
  onReconcileTransaction,
  onAutoReconcileAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'unreconciled' | 'matched' | 'reconciled'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredTx = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

  const totalCleared = transactions
    .filter((tx) => tx.status === 'reconciled')
    .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  const totalUnreconciled = transactions
    .filter((tx) => tx.status === 'unreconciled' || tx.status === 'matched')
    .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  const matchedCount = transactions.filter((tx) => tx.status === 'matched').length;

  const handleRunAutoMatch = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onAutoReconcileAll();
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Bank Account Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Connected Feed
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Landmark className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-white">
            JPMorgan Chase Commercial Main
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Acct: ••••••••4012 • Live Plaid Sync</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cleared & Reconciled
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-400 font-mono">
            ₹{totalCleared.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Verified against General Ledger 1010</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ready to Match
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-cyan-400 font-mono">
            {matchedCount} Transaction(s)
          </div>
          <p className="text-xs text-slate-400 mt-0.5">High confidence AI reference match</p>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filter Status:
          </span>
          {(['all', 'unreconciled', 'matched', 'reconciled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-auto-reconcile-all"
            onClick={handleRunAutoMatch}
            disabled={isProcessing || matchedCount === 0}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>1-Click Auto-Reconcile ({matchedCount})</span>
          </button>
        </div>
      </div>

      {/* Bank Statement Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
            <Landmark className="w-4 h-4 text-indigo-400 mr-2" />
            Bank Statement Activity Feed vs AP Invoices
          </h3>
          <span className="text-xs text-slate-400">
            Real-time ACH & Wire Reconciliation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Transaction Details</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">AI Matched Invoice</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTx.map((tx) => {
                const isDeposit = tx.amount > 0;
                const matchedInvoice = invoices.find((inv) => inv.id === tx.matchedInvoiceId);

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-white flex items-center">
                        {isDeposit ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                        )}
                        <span className="truncate max-w-[280px]">{tx.description}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {tx.accountName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {tx.referenceNumber}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                      isDeposit ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {isDeposit ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      {matchedInvoice ? (
                        <div className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-indigo-950/40 border border-indigo-500/30">
                          <Link className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="font-mono font-semibold text-cyan-300 text-[11px]">
                            {matchedInvoice.invoiceNumber}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({matchedInvoice.vendorName.split(' ')[0]})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">
                          {isDeposit ? 'Customer Inflow (AR)' : 'Unidentified disbursement'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {tx.matchScore ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.matchScore >= 95
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {tx.matchScore}%
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      {tx.status === 'reconciled' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Reconciled</span>
                        </span>
                      ) : tx.status === 'matched' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Matched</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <Clock className="w-3 h-3" />
                          <span>Open Feed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      {tx.status === 'matched' ? (
                        <button
                          onClick={() => onReconcileTransaction(tx.id, tx.matchedInvoiceId)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-sm transition-colors"
                        >
                          Clear & Match
                        </button>
                      ) : tx.status === 'reconciled' ? (
                        <span className="text-emerald-400 text-[11px] font-medium flex items-center justify-end">
                          <FileCheck className="w-3.5 h-3.5 mr-1" /> Cleared
                        </span>
                      ) : (
                        <button
                          onClick={() => onReconcileTransaction(tx.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
                        >
                          Manual Match
                        </button>
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
  );
};
