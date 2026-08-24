import React, { useState } from 'react';
import { Barcode, Search, Zap } from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeLookup: (code: string) => void;
  onSelectBenchmark: (benchmark: any) => void;
  benchmarks: any[];
  isLoading: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeLookup,
  onSelectBenchmark,
  benchmarks,
  isLoading,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      onBarcodeLookup(barcodeInput.trim());
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center gap-2 mb-3 text-slate-200 font-bold text-sm">
        <Barcode className="h-4 w-4 text-cyan-400" />
        <span>Barcode Search & Indian Benchmark Selector</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="Enter food barcode (e.g. 8901058852309)"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          className="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs font-mono"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Lookup</span>
        </button>
      </form>

      {/* Quick Benchmark Chips */}
      <div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>Instant Indian Food Benchmarks:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {benchmarks.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectBenchmark(item)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 font-medium transition-all hover:border-emerald-500/50 flex items-center gap-1.5"
            >
              <span className={`w-2 h-2 rounded-full ${
                item.nutri_score.grade === 'A' ? 'bg-[#008b4c]' :
                item.nutri_score.grade === 'B' ? 'bg-[#80bb2d]' :
                item.nutri_score.grade === 'C' ? 'bg-[#fecb02]' :
                item.nutri_score.grade === 'D' ? 'bg-[#ee8100]' : 'bg-[#e63e11]'
              }`} />
              {item.product_name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
