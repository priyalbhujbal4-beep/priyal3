import React from 'react';
import { 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  IndianRupee, 
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { Invoice } from '../types';

interface MetricCardsProps {
  invoices: Invoice[];
  onFilterExceptions?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ invoices, onFilterExceptions }) => {
  // Base volume is ₹34.5 Lakh (3,450,000 INR)
  const baseVolumeINR = 3450000;
  const seedIds = new Set(['inv-1', 'inv-2', 'inv-3', 'inv-4']);
  const newUploads = invoices.filter((inv) => !seedIds.has(inv.id));
  const newVolumeINR = newUploads.reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0);
  const currentTotalINR = baseVolumeINR + newVolumeINR;
  const formattedVolume = `${(currentTotalINR / 100000).toFixed(currentTotalINR % 100000 === 0 ? 1 : 2)} Lakh`;

  const stpEligible = invoices.filter(
    (inv) => inv.status === 'posted_to_gl' || inv.matchingStatus === 'exact_match' || inv.isAutoPass
  ).length;
  const stpRate = invoices.length > 0 ? Math.round((stpEligible / invoices.length) * 100) : 0;
  
  const exceptions = invoices.filter(
    (inv) => inv.matchingStatus !== 'exact_match' && inv.status !== 'posted_to_gl' && !inv.isAutoPass
  );

  const discountSavings = invoices
    .filter((inv) => inv.paymentTerms && (inv.paymentTerms.includes('2/10') || inv.paymentTerms.includes('Early Pay')))
    .reduce((acc, inv) => acc + inv.totalAmount * 0.02, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {/* Straight-Through Processing (STP) Rate */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            STP Auto-Pass Rate
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-white transition-all">{stpRate}%</span>
          <span className="text-xs font-medium text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> {stpEligible}/{invoices.length} Passed
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Zero touch auto-approved</p>
      </div>

      {/* Cycle Time Reduction */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Avg Cycle Time
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-white">1.8m</span>
          <span className="text-xs font-medium text-emerald-400 flex items-center">
            <TrendingDown className="w-3 h-3 mr-0.5" /> vs 4.2d manual
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Intake to GL posting</p>
      </div>

      {/* Reconciled Spend Volume */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total AP Volume
          </span>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-white transition-all">
            ₹{formattedVolume}
          </span>
          <span className="text-xs font-medium text-slate-400">INR</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          {newUploads.length > 0 
            ? `+₹${newVolumeINR.toLocaleString('en-IN')} new (${invoices.length} invoices)` 
            : `${invoices.length} active invoices`}
        </p>
      </div>

      {/* Active Exceptions */}
      <div 
        onClick={onFilterExceptions}
        className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm cursor-pointer hover:border-amber-500/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Exception Queue
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-amber-300">{exceptions.length}</span>
          <span className="text-xs font-medium text-amber-400">Needs Review</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Qty mismatch & price diffs</p>
      </div>

      {/* Early Payment Discount Capture */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Early Discounts
          </span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-white">
            ₹13,200
          </span>
          <span className="text-xs font-medium text-emerald-400">Captured</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">From GST 18% Early Pay</p>
      </div>
    </div>
  );
};
