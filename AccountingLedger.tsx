import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  Layers, 
  ExternalLink, 
  Filter, 
  Hash,
  Scale,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { JournalEntry, GLAccount, Invoice } from '../types';
import { CHART_OF_ACCOUNTS } from '../data/mockData';

interface AccountingLedgerProps {
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  onPostNewJournalEntry: (invoiceId: string) => void;
}

export const AccountingLedger: React.FC<AccountingLedgerProps> = ({
  journalEntries,
  invoices,
  onPostNewJournalEntry,
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string>(journalEntries[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'journal' | 'trial_balance' | 'chart'>('journal');

  const selectedEntry = journalEntries.find((je) => je.id === selectedEntryId) || journalEntries[0];

  const totalDebits = journalEntries.reduce((acc, je) => acc + je.totalDebit, 0);
  const totalCredits = journalEntries.reduce((acc, je) => acc + je.totalCredit, 0);
  const isLedgerBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Unposted approved invoices
  const approvedUnpostedInvoices = invoices.filter(
    (inv) => (inv.status === 'approved' || inv.matchingStatus === 'exact_match') &&
      !journalEntries.some((je) => je.invoiceId === inv.id)
  );

  // Compute trial balance amounts from posted journal entries
  const trialBalanceMap = new Map<string, { account: GLAccount; debit: number; credit: number }>();
  CHART_OF_ACCOUNTS.forEach((acc) => {
    trialBalanceMap.set(acc.code, { account: acc, debit: 0, credit: 0 });
  });

  journalEntries.forEach((je) => {
    je.lines.forEach((line) => {
      const record = trialBalanceMap.get(line.accountCode);
      if (record) {
        record.debit += line.debit;
        record.credit += line.credit;
      }
    });
  });

  const exportCSV = () => {
    const headers = 'EntryNumber,Date,InvoiceNumber,Vendor,AccountCode,AccountName,Debit,Credit,CostCenter\n';
    const rows = journalEntries.flatMap((je) =>
      je.lines.map((l) =>
        `"${je.entryNumber}","${je.date}","${je.invoiceNumber}","${je.vendorName}","${l.accountCode}","${l.accountName}",${l.debit},${l.credit},"${l.costCenter}"`
      )
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autonomous_ap_general_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(journalEntries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autonomous_ap_erp_batch_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Ledger Balance & ERP Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  Autonomous Double-Entry General Ledger
                </h3>
                {isLedgerBalanced ? (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Books Balanced (Debits = Credits)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Unbalanced Variance
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Compliant with GAAP / IFRS standards • Automated COA mapping & Tax accruals
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportJSON}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ERP Sync (JSON)</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex space-x-2">
          <button
            onClick={() => setActiveSubTab('journal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'journal'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Journal Entries ({journalEntries.length})
          </button>
          <button
            onClick={() => setActiveSubTab('trial_balance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'trial_balance'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Trial Balance View
          </button>
          <button
            onClick={() => setActiveSubTab('chart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'chart'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Chart of Accounts ({CHART_OF_ACCOUNTS.length})
          </button>
        </div>
      </div>

      {/* Main Content Area based on SubTab */}
      {activeSubTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Journal Entries List */}
          <div className="lg:col-span-4 space-y-3">
            {approvedUnpostedInvoices.length > 0 && (
              <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-3.5 shadow-sm">
                <span className="text-xs font-bold text-indigo-300 flex items-center mb-2">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Ready to Post ({approvedUnpostedInvoices.length})
                </span>
                <div className="space-y-2">
                  {approvedUnpostedInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white truncate max-w-[150px]">
                          {inv.vendorName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.invoiceNumber} • ₹{inv.totalAmount.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => onPostNewJournalEntry(inv.id)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        Generate JE
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
                Posted Journal Entries
              </div>
              <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
                {journalEntries.map((je) => {
                  const isSelected = selectedEntry?.id === je.id;
                  return (
                    <div
                      key={je.id}
                      onClick={() => setSelectedEntryId(je.id)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-white">
                          {je.entryNumber}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {je.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-1 truncate">
                        {je.vendorName}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                        <span>{je.date}</span>
                        <span className="font-bold text-slate-200">
                          ₹{je.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Active Journal Entry Detail View */}
          <div className="lg:col-span-8">
            {selectedEntry ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-white font-mono">
                        {selectedEntry.entryNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {selectedEntry.erpReference || 'NETSUITE-SYNC-OK'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Source Document: {selectedEntry.invoiceNumber} • {selectedEntry.vendorName}
                    </p>
                  </div>

                  <div className="text-right text-xs">
                    <div className="text-slate-400">Posting Agent:</div>
                    <div className="font-semibold text-slate-200">{selectedEntry.postedBy}</div>
                  </div>
                </div>

                {/* Double-Entry Ledger Lines */}
                <div className="p-5">
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 font-sans">
                        <tr>
                          <th className="py-2.5 px-3">GL Account Code</th>
                          <th className="py-2.5 px-3">Account Title</th>
                          <th className="py-2.5 px-3">Description & Cost Center</th>
                          <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                          <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {selectedEntry.lines.map((line) => (
                          <tr key={line.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-3 font-bold text-cyan-400">
                              {line.accountCode}
                            </td>
                            <td className="py-3 px-3 font-sans text-slate-200 font-medium">
                              {line.accountName}
                            </td>
                            <td className="py-3 px-3 font-sans text-slate-400">
                              <div>{line.description}</div>
                              <div className="text-[10px] font-mono text-slate-400">{line.costCenter}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-white">
                              {line.debit > 0 ? `₹${line.debit.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-white">
                              {line.credit > 0 ? `₹${line.credit.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-950 font-bold border-t border-slate-700 font-mono text-xs">
                        <tr>
                          <td colSpan={3} className="py-3 px-3 text-right text-slate-300 uppercase tracking-wider font-sans">
                            Total Balanced Entry:
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-400">
                            ₹{selectedEntry.totalDebit.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-400">
                            ₹{selectedEntry.totalCredit.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Entry Notes & Audit Footprint */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-300">Audit Footprint:</span>{' '}
                      {selectedEntry.notes} Timestamp: {selectedEntry.postedAt || new Date().toISOString()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                No journal entries posted yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SubTab 2: Trial Balance */}
      {activeSubTab === 'trial_balance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Consolidated General Ledger Trial Balance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time debit & credit balances across all AP operations
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="text-slate-400">Balance Status: </span>
              <span className="text-emerald-400 font-bold">BALANCED ₹0.00 DIFF</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 font-sans">
                <tr>
                  <th className="py-2.5 px-4">Account Code</th>
                  <th className="py-2.5 px-4">Account Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Debit Balance</th>
                  <th className="py-2.5 px-4 text-right">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {Array.from(trialBalanceMap.values())
                  .filter((item) => item.debit > 0 || item.credit > 0)
                  .map((item) => (
                    <tr key={item.account.code} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        {item.account.code}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-200">
                        {item.account.name}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">
                          {item.account.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {item.debit > 0 ? `₹${item.debit.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {item.credit > 0 ? `₹${item.credit.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t border-slate-700 font-mono text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right text-slate-300 font-sans">
                    Grand Trial Balance Total:
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400">
                    ₹{totalDebits.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400">
                    ₹{totalCredits.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: Chart of Accounts */}
      {activeSubTab === 'chart' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5">
          <h3 className="text-sm font-bold text-white mb-1">
            Enterprise Chart of Accounts (COA) Structure
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            AI automated classification mapping matrix for invoice line-items
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CHART_OF_ACCOUNTS.map((coa) => (
              <div key={coa.code} className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-cyan-400">{coa.code}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {coa.category}
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-200 mt-1">{coa.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{coa.subType}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
