import React from 'react';
import { Sliders, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { STPConfig } from '../types';

interface STPSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: STPConfig;
  onSaveConfig: (newConfig: STPConfig) => void;
}

export const STPSettingsModal: React.FC<STPSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = React.useState<STPConfig>(config);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Straight-Through Processing (STP) Rules
              </h3>
              <p className="text-[11px] text-slate-400">
                Autonomous AI tolerance controls & approval thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* AI Confidence Threshold Slider */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-slate-200">
                Minimum AI Extraction Confidence
              </span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                {localConfig.autoApproveConfidence}%
              </span>
            </div>
            <input
              type="range"
              min="80"
              max="99"
              value={localConfig.autoApproveConfidence}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, autoApproveConfidence: Number(e.target.value) })
              }
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Invoices with field OCR confidence below this threshold are routed to human review.
            </p>
          </div>

          {/* Price Variance Tolerance Slider */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-slate-200">
                Contractual Price Variance Tolerance
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                ±{localConfig.priceVarianceTolerancePct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={localConfig.priceVarianceTolerancePct}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, priceVarianceTolerancePct: Number(e.target.value) })
              }
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Permits freight/fuel surcharges or minor penny rounding without breaking STP.
            </p>
          </div>

          {/* Toggle Flags */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-semibold text-slate-200">Auto-Post 100% Matches to GL</div>
                <div className="text-[11px] text-slate-400">
                  Immediately creates balanced double-entry journals in ERP
                </div>
              </div>
              <input
                type="checkbox"
                checked={localConfig.autoPostToGL}
                onChange={(e) => setLocalConfig({ ...localConfig, autoPostToGL: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-semibold text-slate-200">Enforce Strict Physical 3-Way Match</div>
                <div className="text-[11px] text-slate-400">
                  Blocks payment if warehouse receiving slip count is less than billed count
                </div>
              </div>
              <input
                type="checkbox"
                checked={localConfig.strictThreeWayMatch}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, strictThreeWayMatch: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-semibold text-slate-200">Early Payment Discount Optimizer</div>
                <div className="text-[11px] text-slate-400">
                  Prioritizes disbursement for invoices offering GST 18% Early Pay terms
                </div>
              </div>
              <input
                type="checkbox"
                checked={localConfig.earlyPaymentDiscountAlert}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, earlyPaymentDiscountAlert: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
          >
            Save Automation Policies
          </button>
        </div>
      </div>
    </div>
  );
};
