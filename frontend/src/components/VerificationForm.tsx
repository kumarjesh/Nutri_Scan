import React from 'react';
import { Sliders, RefreshCw } from 'lucide-react';

export interface NutrientInputs {
  energy_kcal: number;
  sugars_g: number;
  added_sugars_g: number;
  sat_fat_g: number;
  sodium_mg: number;
  fiber_g: number;
  protein_g: number;
  fvl_cocoa_percent: number;
}

interface VerificationFormProps {
  nutrients: NutrientInputs;
  onChange: (updated: NutrientInputs) => void;
  onRecalculate: () => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  nutrients,
  onChange,
  onRecalculate,
}) => {
  const handleInputChange = (field: keyof NutrientInputs, value: string) => {
    const num = parseFloat(value) || 0.0;
    const updated = { ...nutrients, [field]: num };
    onChange(updated);
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <Sliders className="h-4 w-4 text-emerald-400" />
          <span>FSSAI Normalized 100g Verification Form</span>
        </div>
        <button
          onClick={onRecalculate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-md shadow-emerald-950"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Recalculate</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Energy kcal */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Energy (kcal / 100g)</label>
          <input
            type="number"
            value={nutrients.energy_kcal}
            onChange={(e) => handleInputChange('energy_kcal', e.target.value)}
            className="w-full glass-input px-3 py-2 rounded-xl text-sm font-semibold"
          />
        </div>

        {/* Total Sugars */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Total Sugars (g / 100g)</label>
          <input
            type="number"
            step="0.1"
            value={nutrients.sugars_g}
            onChange={(e) => handleInputChange('sugars_g', e.target.value)}
            className="w-full glass-input px-3 py-2 rounded-xl text-sm font-semibold text-pink-300"
          />
        </div>

        {/* Added Sugars */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Added Sugars (g / 100g)</label>
          <input
            type="number"
            step="0.1"
            value={nutrients.added_sugars_g || 0}
            onChange={(e) => handleInputChange('added_sugars_g', e.target.value)}
            className="w-full glass-input px-3 py-2 rounded-xl text-sm font-semibold text-rose-300"
          />
        </div>

        {/* Saturated Fat */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Saturated Fat (g / 100g)</label>
          <input
            type="number"
            step="0.1"
            value={nutrients.sat_fat_g}
            onChange={(e) => handleInputChange('sat_fat_g', e.target.value)}
            className="w-full glass-input px-3 py-2 rounded-xl text-sm font-semibold text-amber-300"
          />
        </div>

        {/* Sodium mg */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Sodium (mg / 100g)</label>
          <input
            type="number"
            value={nutrients.sodium_mg}
            onChange={(e) => handleInputChange('sodium_mg', e.target.value)}
            className="w-full glass-input px-3 py-2 rounded-xl text-sm font-semibold text-cyan-300"
          />
        </div>

        {/* Dietary Fiber */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Dietary Fiber (g / 100g)</label>
          <input
            type="number"
            step="0.1"
            value={nutrients.fiber_g}
            onChange={(e) => handleInputChange('fiber_g', e.target.value)}
            className="w-full glass-input px-3 py-2 rounded-xl text-sm font-semibold text-emerald-300"
          />
        </div>

        {/* Protein */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Protein (g / 100g)</label>
          <input
            type="number"
            step="0.1"
            value={nutrients.protein_g}
            onChange={(e) => handleInputChange('protein_g', e.target.value)}
            className="w-full glass-input px-3 py-2 rounded-xl text-sm font-semibold text-sky-300"
          />
        </div>

        {/* Fruit / Veg / Cocoa % */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Cocoa / Fruit % (0-100)</label>
          <input
            type="number"
            step="1"
            value={nutrients.fvl_cocoa_percent}
            onChange={(e) => handleInputChange('fvl_cocoa_percent', e.target.value)}
            className="w-full glass-input px-3 py-2 rounded-xl text-sm font-semibold text-teal-300"
          />
        </div>
      </div>
    </div>
  );
};
