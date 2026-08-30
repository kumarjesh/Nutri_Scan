'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { NutriScoreBadge } from '@/components/NutriScoreBadge';
import { VerdictReportCard } from '@/components/VerdictReportCard';
import { BreakdownCard } from '@/components/BreakdownCard';
import { AdditiveTags } from '@/components/AdditiveTags';
import { VerificationForm } from '@/components/VerificationForm';
import { CameraScanner } from '@/components/CameraScanner';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { HistoryLog, ScanItem } from '@/components/HistoryLog';
import { Lightbulb, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import posthog from 'posthog-js';
import { processChocolateImage } from '@/utils/ocrService';
import { calculateNutriScore, NutrientInputs, NutriScoreResult } from '@/utils/nutriScoreService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const DEFAULT_BENCHMARKS = [
  {
    product_name: "Amul Dark Chocolate (75% Cocoa)",
    nutrients: { energy_kcal: 540, sugars_g: 26, sat_fat_g: 22, sodium_mg: 15, fiber_g: 8, protein_g: 8.5, fvl_cocoa_percent: 75 },
    nutri_score: calculateNutriScore({ energy_kcal: 540, sugars_g: 26, sat_fat_g: 22, sodium_mg: 15, fiber_g: 8, protein_g: 8.5, fvl_cocoa_percent: 75 }),
    additives: [{ name: "INS 322 (Soy Lecithin)", description: "Permitted Emulsifier" }]
  },
  {
    product_name: "Cadbury Dairy Milk Chocolate",
    nutrients: { energy_kcal: 530, sugars_g: 57, sat_fat_g: 18, sodium_mg: 150, fiber_g: 1.5, protein_g: 7.5, fvl_cocoa_percent: 15 },
    nutri_score: calculateNutriScore({ energy_kcal: 530, sugars_g: 57, sat_fat_g: 18, sodium_mg: 150, fiber_g: 1.5, protein_g: 7.5, fvl_cocoa_percent: 15 }),
    additives: [{ name: "INS 322 (Soy Lecithin)", description: "Emulsifier" }, { name: "INS 476 (PGPR)", description: "Emulsifier used to cut cocoa butter costs" }]
  },
  {
    product_name: "Nestle Munch Chocolate Wafer",
    nutrients: { energy_kcal: 480, sugars_g: 45, sat_fat_g: 16, sodium_mg: 110, fiber_g: 1.0, protein_g: 5.0, fvl_cocoa_percent: 5.0 },
    nutri_score: calculateNutriScore({ energy_kcal: 480, sugars_g: 45, sat_fat_g: 16, sodium_mg: 110, fiber_g: 1.0, protein_g: 5.0, fvl_cocoa_percent: 5.0 }),
    additives: [{ name: "INS 322 (Soy Lecithin)", description: "Emulsifier" }]
  },
  {
    product_name: "Cadbury Bournville Dark Chocolate (50% Cocoa)",
    nutrients: { energy_kcal: 535, sugars_g: 48, sat_fat_g: 19.5, sodium_mg: 20, fiber_g: 6.5, protein_g: 5.5, fvl_cocoa_percent: 50.0 },
    nutri_score: calculateNutriScore({ energy_kcal: 535, sugars_g: 48, sat_fat_g: 19.5, sodium_mg: 20, fiber_g: 6.5, protein_g: 5.5, fvl_cocoa_percent: 50.0 }),
    additives: [{ name: "INS 322 (Soy Lecithin)", description: "Emulsifier" }, { name: "INS 476 (PGPR)", description: "Emulsifier" }]
  }
];

export default function Home() {
  const [nutrients, setNutrients] = useState<NutrientInputs>({
    energy_kcal: 540.0,
    sugars_g: 26.0,
    added_sugars_g: 20.0,
    sat_fat_g: 22.0,
    sodium_mg: 15.0,
    fiber_g: 8.0,
    protein_g: 8.5,
    fvl_cocoa_percent: 75.0,
  });

  const [nutriScore, setNutriScore] = useState<NutriScoreResult>(() =>
    calculateNutriScore({
      energy_kcal: 540.0,
      sugars_g: 26.0,
      added_sugars_g: 20.0,
      sat_fat_g: 22.0,
      sodium_mg: 15.0,
      fiber_g: 8.0,
      protein_g: 8.5,
      fvl_cocoa_percent: 75.0,
    })
  );

  const [productName, setProductName] = useState('Amul Dark Chocolate (75% Cocoa)');
  const [additives, setAdditives] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>(DEFAULT_BENCHMARKS);
  const [history, setHistory] = useState<ScanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | null>(null);

  // Load benchmark chocolates
  useEffect(() => {
    fetch(`${API_BASE}/api/benchmarks`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBenchmarks(data);
        }
      })
      .catch(() => {
        // Fallback to embedded chocolate benchmarks
        setBenchmarks(DEFAULT_BENCHMARKS);
      });
  }, []);

  const runCalculation = (currentNutrients: NutrientInputs, nameToSave?: string) => {
    const result = calculateNutriScore(currentNutrients);
    setNutriScore(result);
    addToHistory(nameToSave || productName, result.grade, result.score, currentNutrients.energy_kcal, currentNutrients.sugars_g);
  };

  const addToHistory = (name: string, grade: string, score: number, energy: number, sugar: number) => {
    const newItem: ScanItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name,
      grade,
      score,
      energy_kcal: energy,
      sugars_g: sugar,
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 9)]);
  };

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setStatusType('info');
    setStatusMsg("Scanning chocolate label with high-accuracy OCR engine...");

    try {
      // In-browser client-side OCR for guaranteed reliability on phone / Vercel
      const parsed = await processChocolateImage(file, (_progress, status) => {
        setStatusMsg(status);
      });

      setIsLoading(false);

      if (parsed.isValidChocolate) {
        setNutrients(parsed.nutrients);
        setProductName(parsed.productName);
        setAdditives(parsed.additives);
        setStatusType('success');
        setStatusMsg(`✅ ${parsed.productName} label OCR parsed successfully!`);

        if (typeof window !== 'undefined' && posthog) {
          posthog.capture('ocr_scan_success', { productName: parsed.productName });
        }

        runCalculation(parsed.nutrients, parsed.productName);
      } else {
        setStatusType('error');
        setStatusMsg(
          parsed.errorMessage ||
          "⚠️ Please provide a proper picture of a chocolate wrapper or its nutrition facts table. NutriScan AI is strictly restricted to chocolates."
        );
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatusType('error');
      setStatusMsg("⚠️ Could not process image. Please try holding the chocolate wrapper steady with good lighting.");
    }
  };

  const handleBarcodeLookup = (code: string) => {
    setIsLoading(true);
    setStatusType('info');
    setStatusMsg(`Looking up barcode ${code}...`);

    fetch(`${API_BASE}/api/barcode/${code}`)
      .then(async (res) => {
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.detail || `Barcode ${code} not found or not a chocolate item.`);
        }
        return resData;
      })
      .then((resData) => {
        setIsLoading(false);
        if (resData.nutrients) {
          const n = resData.nutrients;
          const updated: NutrientInputs = {
            energy_kcal: n.energy_kcal,
            sugars_g: n.sugars_g,
            added_sugars_g: n.added_sugars_g || 0,
            sat_fat_g: n.sat_fat_g,
            sodium_mg: n.sodium_mg,
            fiber_g: n.fiber_g,
            protein_g: n.protein_g,
            fvl_cocoa_percent: n.fvl_cocoa_percent,
          };
          const name = resData.product_info?.name || `Barcode ${code}`;
          setNutrients(updated);
          setNutriScore(resData.nutri_score || calculateNutriScore(updated));
          setProductName(name);
          setAdditives(resData.additives || []);
          setStatusType('success');
          setStatusMsg(`✅ Chocolate match found: ${name}`);
          if (typeof window !== 'undefined' && posthog) {
            posthog.capture('barcode_lookup_success', { barcode: code, productName: name });
          }
          addToHistory(name, resData.nutri_score?.grade || 'D', resData.nutri_score?.score || 16, n.energy_kcal, n.sugars_g);
        }
      })
      .catch((err: any) => {
        setIsLoading(false);
        setStatusType('error');
        setStatusMsg(`⚠️ ${err.message || `Barcode ${code} not found or not a chocolate item.`}`);
      });
  };

  const handleSelectBenchmark = (item: any) => {
    setProductName(item.product_name);
    const n = item.nutrients;
    const updated: NutrientInputs = {
      energy_kcal: n.energy_kcal,
      sugars_g: n.sugars_g,
      added_sugars_g: n.added_sugars_g || 0,
      sat_fat_g: n.sat_fat_g,
      sodium_mg: n.sodium_mg,
      fiber_g: n.fiber_g,
      protein_g: n.protein_g,
      fvl_cocoa_percent: n.fvl_cocoa_percent,
    };
    setNutrients(updated);
    const score = item.nutri_score || calculateNutriScore(updated);
    setNutriScore(score);
    setAdditives(item.additives || []);
    setStatusType('success');
    setStatusMsg(`Loaded benchmark chocolate: ${item.product_name}`);
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('benchmark_selected', { productName: item.product_name, grade: score.grade });
    }
    addToHistory(item.product_name, score.grade, score.score, n.energy_kcal, n.sugars_g);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Prominent Status Notification Banner */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl transition-all animate-in fade-in duration-200 ${
              statusType === 'error'
                ? 'bg-rose-950/80 border-rose-600/60 text-rose-200 shadow-rose-950/40'
                : statusType === 'success'
                ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200 shadow-emerald-950/40'
                : 'bg-slate-900/90 border-cyan-600/50 text-cyan-200 shadow-cyan-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusType === 'error' && <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />}
              {statusType === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />}
              {statusType === 'info' && <Info className="h-5 w-5 text-cyan-400 shrink-0" />}
              <span>{statusMsg}</span>
            </div>
            <button
              onClick={() => {
                setStatusMsg(null);
                setStatusType(null);
              }}
              className="ml-3 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Grid: Scanner & Barcode Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CameraScanner onImageSelected={handleImageUpload} isLoading={isLoading} />
          <BarcodeScanner
            onBarcodeLookup={handleBarcodeLookup}
            onSelectBenchmark={handleSelectBenchmark}
            benchmarks={benchmarks}
            isLoading={isLoading}
          />
        </div>

        {/* Product Scanned Header Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Chocolate Analysis:</span>
            <span className="text-emerald-400 underline decoration-emerald-500/50 underline-offset-4">
              {productName}
            </span>
          </h2>
        </div>

        {/* Pre-Eating Verdict Decision Report */}
        <VerdictReportCard
          grade={nutriScore.grade}
          score={nutriScore.score}
          productName={productName}
          sugars_g={nutrients.sugars_g}
          sat_fat_g={nutrients.sat_fat_g}
          energy_kcal={nutrients.energy_kcal}
          additives={additives}
          recommendations={nutriScore.recommendations || []}
        />

        {/* Nutri-Score Prominent Badge */}
        <NutriScoreBadge
          grade={nutriScore.grade}
          score={nutriScore.score}
          colorHex={nutriScore.color_hex}
          colorName={nutriScore.color_name}
          summaryMsg={nutriScore.summary_msg}
          proteinCapped={nutriScore.protein_capped}
        />

        {/* Explainability Breakdown Card */}
        <BreakdownCard
          negative={nutriScore.negative_points}
          positive={nutriScore.positive_points}
          nutrients={nutrients}
          proteinCapped={nutriScore.protein_capped}
        />

        {/* Additive Caution Flags */}
        <AdditiveTags additives={additives} />

        {/* Healthier Alternatives Radar */}
        {nutriScore.recommendations && nutriScore.recommendations.length > 0 && (
          <div className="glass-card rounded-2xl p-5 border border-cyan-900/30 bg-cyan-950/10">
            <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>Healthier Indian Chocolate Alternatives & Guidance Radar</span>
            </div>
            <ul className="space-y-2">
              {nutriScore.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Editable FSSAI Verification Form */}
        <VerificationForm
          nutrients={nutrients}
          onChange={setNutrients}
          onRecalculate={() => runCalculation(nutrients)}
        />

        {/* Scan History Log */}
        <HistoryLog
          history={history}
          onSelectHistory={(item) => {
            setProductName(item.name);
          }}
          onClearHistory={() => setHistory([])}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>NutriScan AI &bull; Smart Front-of-Pack Chocolate Nutrition Grade Calculator</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Algorithm: Updated 2023/2024 European Nutri-Score & FSSAI Chocolate Label Parser.
        </p>
      </footer>
    </div>
  );
}
