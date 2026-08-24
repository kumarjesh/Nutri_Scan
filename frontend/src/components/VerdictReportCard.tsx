import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ShieldCheck,
  Flame,
  Check,
  ArrowRight,
  Info,
  Scale,
} from 'lucide-react';

interface VerdictReportCardProps {
  grade: string;
  score: number;
  productName: string;
  sugars_g: number;
  sat_fat_g: number;
  energy_kcal: number;
  additives: Array<{ name: string; description: string }>;
  recommendations: string[];
}

export const VerdictReportCard: React.FC<VerdictReportCardProps> = ({
  grade,
  score,
  productName,
  sugars_g,
  sat_fat_g,
  energy_kcal,
  additives,
  recommendations,
}) => {
  // Determine Verdict Category based on Nutri-Score Grade
  const getVerdict = () => {
    switch (grade.toUpperCase()) {
      case 'A':
      case 'B':
        return {
          title: 'GREEN LIGHT: SAFE TO EAT',
          subtitle: 'Healthy choice! High cocoa/fiber & minimal added sugars.',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          iconColor: 'text-emerald-400',
          Icon: CheckCircle2,
          decisionText: 'YES, EAT IT!',
          decisionSub: 'Great choice for snacking.',
          borderGlow: 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]',
          actionAdvice: 'Enjoy freely as part of a balanced diet.',
        };
      case 'C':
      case 'D':
        return {
          title: 'YELLOW LIGHT: EAT IN MODERATION',
          subtitle: 'Moderate nutritional quality. Consume small portions only.',
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          iconColor: 'text-amber-400',
          Icon: AlertTriangle,
          decisionText: 'LIMIT PORTION TO 1-2 SQUARES',
          decisionSub: 'Do not eat the whole bar at once.',
          borderGlow: 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]',
          actionAdvice: 'Limit consumption to 15g-20g (approx. 2 squares) to control sugar spike.',
        };
      case 'E':
      default:
        return {
          title: 'RED LIGHT: HIGH HEALTH RISK',
          subtitle: 'Very high in added sugar & saturated fats. Heavy processing.',
          badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          iconColor: 'text-rose-400',
          Icon: XCircle,
          decisionText: 'THINK TWICE BEFORE EATING',
          decisionSub: 'High sugar overload & artificial additives.',
          borderGlow: 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.15)]',
          actionAdvice: 'Consider swapping with high-cocoa dark chocolate or a whole fruit.',
        };
    }
  };

  const verdict = getVerdict();
  const IconComponent = verdict.Icon;

  // Calculate approximate percentage of 100g that is sugar
  const sugarPercent = Math.min(100, Math.round(sugars_g));

  return (
    <div className={`glass-card rounded-3xl p-6 sm:p-8 border ${verdict.borderGlow} transition-all duration-300 relative overflow-hidden`}>
      {/* Background Accent Mesh Glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${verdict.badgeColor} flex items-center justify-center`}>
            <IconComponent className={`h-7 w-7 ${verdict.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pre-Eating Decision Report</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700">
                NutriScan AI
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {verdict.title}
            </h2>
          </div>
        </div>

        {/* Big Verdict Decision Box */}
        <div className={`px-5 py-3 rounded-2xl border ${verdict.badgeColor} text-right flex flex-col items-end`}>
          <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">Recommendation</span>
          <span className={`text-base sm:text-lg font-black ${verdict.iconColor}`}>
            {verdict.decisionText}
          </span>
          <span className="text-[11px] text-slate-300">{verdict.decisionSub}</span>
        </div>
      </div>

      {/* Product Highlight Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Scanned Product</span>
          <p className="text-base font-bold text-white">{productName}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-300">
            <span className="text-slate-400">Energy:</span> <strong className="text-white">{energy_kcal} kcal</strong>/100g
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-300">
            <span className="text-slate-400">Grade:</span> <strong className={`font-black ${verdict.iconColor}`}>{grade}</strong> (Score {score})
          </div>
        </div>
      </div>

      {/* Grid Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Sugar Warning Box */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4" />
                Sugar Level
              </span>
              <span>{sugars_g}g / 100g</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sugars_g > 40 ? 'bg-rose-500' : sugars_g > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (sugars_g / 60) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {sugars_g > 40
                ? 'Over 50% of this product is pure sugar.'
                : sugars_g > 20
                ? 'Moderate sugar level per 100g serving.'
                : 'Low sugar content compared to standard snacks.'}
            </p>
          </div>
        </div>

        {/* Saturated Fat Box */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Scale className="h-4 w-4" />
                Saturated Fat
              </span>
              <span>{sat_fat_g}g / 100g</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sat_fat_g > 15 ? 'bg-rose-500' : sat_fat_g > 8 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (sat_fat_g / 25) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {sat_fat_g > 15
                ? 'High saturated fat. Check ingredients for Palm Oil or Vanaspati.'
                : 'Contains moderate fats from cocoa butter / milk.'}
            </p>
          </div>
        </div>

        {/* Additive & Emulsifier Audit */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Additives & Emulsifiers
              </span>
              <span>{additives.length} Detected</span>
            </div>
            {additives.length > 0 ? (
              <div className="space-y-1">
                {additives.map((add, idx) => (
                  <div key={idx} className="text-[11px] bg-slate-800/80 px-2 py-1 rounded text-slate-300 flex items-center justify-between">
                    <span className="font-semibold text-rose-300">{add.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{add.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-emerald-400">
                ✅ No harmful INS additives or ultra-processed emulsifiers detected!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Guidance Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-700/80 flex items-start gap-3">
        <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white block mb-0.5">Advice Before You Snack:</strong>
          {verdict.actionAdvice}
          {recommendations.length > 0 && (
            <span className="block mt-1 text-slate-400 italic">
              💡 Tip: {recommendations[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
