import React from 'react';
import { MinusCircle, PlusCircle, Flame, Cookie, Droplet, Hash, HeartPulse, Leaf, Sparkles } from 'lucide-react';

interface BreakdownProps {
  negative: {
    energy: number;
    sugars: number;
    sat_fat: number;
    sodium: number;
    total: number;
  };
  positive: {
    fvl: number;
    fiber: number;
    protein: number;
    effective_protein?: number;
    total: number;
  };
  nutrients: {
    energy_kcal: number;
    sugars_g: number;
    sat_fat_g: number;
    sodium_mg: number;
    fiber_g: number;
    protein_g: number;
    fvl_cocoa_percent: number;
  };
  proteinCapped?: boolean;
}

export const BreakdownCard: React.FC<BreakdownProps> = ({
  negative,
  positive,
  nutrients,
  proteinCapped,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Negative Points (Penalties) Card */}
      <div className="glass-card rounded-2xl p-5 border border-rose-900/30 bg-rose-950/10">
        <div className="flex items-center justify-between border-b border-rose-900/20 pb-3 mb-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wide">
            <MinusCircle className="h-4 w-4" />
            <span>Negative Penalties (N Points)</span>
          </div>
          <span className="text-lg font-black text-rose-400 bg-rose-950/60 px-3 py-0.5 rounded-lg border border-rose-800/40">
            +{negative.total} pts
          </span>
        </div>

        <div className="space-y-3">
          {/* Energy */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>Energy ({nutrients.energy_kcal} kcal / 100g)</span>
            </div>
            <span className="font-semibold text-rose-300">+{negative.energy} pts</span>
          </div>

          {/* Sugars */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Cookie className="h-4 w-4 text-pink-400" />
              <span>Total Sugars ({nutrients.sugars_g}g / 100g)</span>
            </div>
            <span className="font-semibold text-rose-300">+{negative.sugars} pts</span>
          </div>

          {/* Saturated Fat */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Droplet className="h-4 w-4 text-amber-400" />
              <span>Saturated Fat ({nutrients.sat_fat_g}g / 100g)</span>
            </div>
            <span className="font-semibold text-rose-300">+{negative.sat_fat} pts</span>
          </div>

          {/* Sodium */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Hash className="h-4 w-4 text-cyan-400" />
              <span>Sodium ({nutrients.sodium_mg}mg / 100g)</span>
            </div>
            <span className="font-semibold text-rose-300">+{negative.sodium} pts</span>
          </div>
        </div>
      </div>

      {/* Positive Points (Credits) Card */}
      <div className="glass-card rounded-2xl p-5 border border-emerald-900/30 bg-emerald-950/10">
        <div className="flex items-center justify-between border-b border-emerald-900/20 pb-3 mb-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wide">
            <PlusCircle className="h-4 w-4" />
            <span>Positive Credits (P Points)</span>
          </div>
          <span className="text-lg font-black text-emerald-400 bg-emerald-950/60 px-3 py-0.5 rounded-lg border border-emerald-800/40">
            -{positive.total} pts
          </span>
        </div>

        <div className="space-y-3">
          {/* Fruit/Veg/Cocoa % */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Leaf className="h-4 w-4 text-emerald-400" />
              <span>Fruit / Veg / Cocoa ({nutrients.fvl_cocoa_percent}%)</span>
            </div>
            <span className="font-semibold text-emerald-300">-{positive.fvl} pts</span>
          </div>

          {/* Dietary Fiber */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span>Dietary Fiber ({nutrients.fiber_g}g / 100g)</span>
            </div>
            <span className="font-semibold text-emerald-300">-{positive.fiber} pts</span>
          </div>

          {/* Protein */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <HeartPulse className="h-4 w-4 text-sky-400" />
              <span>Protein ({nutrients.protein_g}g / 100g)</span>
            </div>
            <span className={`font-semibold ${proteinCapped ? 'line-through text-slate-500' : 'text-emerald-300'}`}>
              -{positive.protein} pts
            </span>
          </div>

          {proteinCapped && (
            <p className="text-[11px] text-amber-400 italic pt-1 border-t border-slate-800/50">
              * Protein credit excluded because Negative Score &ge; 11 and Cocoa/Fruit content &lt; 80%.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
