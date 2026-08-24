import React from 'react';
import { Award, Info, AlertTriangle } from 'lucide-react';

interface NutriScoreBadgeProps {
  grade: string;
  score: number;
  colorHex: string;
  colorName: string;
  summaryMsg: str;
  proteinCapped?: boolean;
}

export const NutriScoreBadge: React.FC<NutriScoreBadgeProps> = ({
  grade,
  score,
  colorHex,
  colorName,
  summaryMsg,
  proteinCapped,
}) => {
  const grades = [
    { key: 'A', bg: 'bg-[#008b4c]', label: 'A' },
    { key: 'B', bg: 'bg-[#80bb2d]', label: 'B' },
    { key: 'C', bg: 'bg-[#fecb02]', label: 'C' },
    { key: 'D', bg: 'bg-[#ee8100]', label: 'D' },
    { key: 'E', bg: 'bg-[#e63e11]', label: 'E' },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-slate-800 shadow-2xl">
      {/* Background Accent Glow */}
      <div
        className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: colorHex }}
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Main Badge Display */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Award className="h-4 w-4 text-emerald-400" />
            <span>Front-of-Pack Nutri-Score Grade</span>
          </div>

          {/* 5-Pill Nutri-Score Bar */}
          <div className="flex items-center gap-1.5 p-2 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner">
            {grades.map((item) => {
              const isActive = item.key === grade.toUpperCase();
              return (
                <div
                  key={item.key}
                  className={`relative flex items-center justify-center font-black rounded-xl transition-all duration-300 ${
                    isActive
                      ? `${item.bg} text-white w-14 h-16 text-2xl shadow-lg scale-110 ring-2 ring-white/50 z-10`
                      : 'bg-slate-850/60 text-slate-500 w-10 h-12 text-base opacity-40 hover:opacity-70'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-white animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Score & Summary Text */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold" style={{ color: colorHex }}>
              Grade {grade}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200">
              Score: {score}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-300 mt-1 max-w-xs">
            {summaryMsg}
          </p>

          {proteinCapped && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2.5 py-1 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Protein Points Capped (N &ge; 11 Rule)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
