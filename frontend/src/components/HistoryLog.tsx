import React from 'react';
import { History, Trash2, ArrowRight } from 'lucide-react';

export interface ScanItem {
  id: string;
  timestamp: string;
  name: string;
  grade: string;
  score: number;
  energy_kcal: number;
  sugars_g: number;
}

interface HistoryLogProps {
  history: ScanItem[];
  onSelectHistory: (item: ScanItem) => void;
  onClearHistory: () => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <History className="h-4 w-4 text-emerald-400" />
          <span>Recent Scans History ({history.length})</span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 flex items-center justify-between cursor-pointer transition-all hover:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center ${
                  item.grade === 'A' ? 'bg-[#008b4c]' :
                  item.grade === 'B' ? 'bg-[#80bb2d]' :
                  item.grade === 'C' ? 'bg-[#fecb02]' :
                  item.grade === 'D' ? 'bg-[#ee8100]' : 'bg-[#e63e11]'
                }`}
              >
                {item.grade}
              </span>
              <div>
                <h5 className="text-xs font-bold text-slate-200">{item.name}</h5>
                <p className="text-[11px] text-slate-400">
                  {item.energy_kcal} kcal &bull; {item.sugars_g}g Sugar &bull; {item.timestamp}
                </p>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-slate-500" />
          </div>
        ))}
      </div>
    </div>
  );
};
