import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Additive {
  name: string;
  description: string;
}

interface AdditiveTagsProps {
  additives: Additive[];
}

export const AdditiveTags: React.FC<AdditiveTagsProps> = ({ additives }) => {
  if (!additives || additives.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        <p className="text-xs text-slate-300">
          <span className="font-semibold text-emerald-400">Clean Label:</span> No high-risk additives (Palm Oil, Vanaspati, HFCS) or synthetic dyes detected in scanned ingredients.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-amber-900/30 bg-amber-950/10">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-amber-400" />
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Indian Market Ingredient Caution Flags ({additives.length})
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {additives.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-900/80 border border-amber-800/30 flex flex-col gap-1"
          >
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {item.name}
            </span>
            <p className="text-[11px] text-slate-400 leading-snug">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
