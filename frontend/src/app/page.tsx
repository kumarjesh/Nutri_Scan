'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { NutriScoreBadge } from '@/components/NutriScoreBadge';
import { VerdictReportCard } from '@/components/VerdictReportCard';
import { BreakdownCard } from '@/components/BreakdownCard';
import { AdditiveTags } from '@/components/AdditiveTags';
import { VerificationForm, NutrientInputs } from '@/components/VerificationForm';
import { CameraScanner } from '@/components/CameraScanner';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { HistoryLog, ScanItem } from '@/components/HistoryLog';
import { Lightbulb, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import posthog from 'posthog-js';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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

  const [nutriScore, setNutriScore] = useState<any>({
    grade: 'D',
    score: 16,
    color_hex: '#ee8100',
    color_name: 'Orange',
    negative_points: { energy: 6, sugars: 7, sat_fat: 10, sodium: 0, total: 23 },
    positive_points: { fvl: 2, fiber: 5, protein: 5, effective_protein: 0, total: 7 },
    protein_capped: true,
    summary_msg: 'Moderate/Poor nutritional quality - Consume in moderation',
    recommendations: [
      "High Saturated Fat: Check ingredients for Palm Oil or Vanaspati. Prefer snacks made with groundnut oil or cold-pressed oils."
    ]
  });

  const [productName, setProductName] = useState('Amul Dark Chocolate (75% Cocoa)');
  const [additives, setAdditives] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [history, setHistory] = useState<ScanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | null>(null);

  // Load benchmark chocolates from backend API on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/benchmarks`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBenchmarks(data);
        }
      })
      .catch(() => {
        // Fallback offline mock benchmarks (strictly chocolates only)
        setBenchmarks([
          {
            product_name: "Amul Dark Chocolate (75% Cocoa)",
            nutrients: { energy_kcal: 540, sugars_g: 26, sat_fat_g: 22, sodium_mg: 15, fiber_g: 8, protein_g: 8.5, fvl_cocoa_percent: 75 },
            nutri_score: { grade: 'D', score: 16, color_hex: '#ee8100', color_name: 'Orange', negative_points: { energy: 6, sugars: 7, sat_fat: 10, sodium: 0, total: 23 }, positive_points: { fvl: 2, fiber: 5, protein: 5, effective_protein: 0, total: 7 }, protein_capped: true, summary_msg: 'Consume in moderation', recommendations: [] },
            additives: []
          },
          {
            product_name: "Cadbury Dairy Milk Chocolate",
            nutrients: { energy_kcal: 530, sugars_g: 57, sat_fat_g: 18, sodium_mg: 150, fiber_g: 1.5, protein_g: 7.5, fvl_cocoa_percent: 15 },
            nutri_score: { grade: 'E', score: 32, color_hex: '#e63e11', color_name: 'Dark Red', negative_points: { energy: 6, sugars: 15, sat_fat: 10, sodium: 1, total: 32 }, positive_points: { fvl: 0, fiber: 0, protein: 4, effective_protein: 0, total: 0 }, protein_capped: true, summary_msg: 'Very high sugar & saturated fat', recommendations: ["High Sugar Penalty: 57g sugar per 100g."] },
            additives: [{ name: "INS 322 (Soy Lecithin)", description: "Emulsifier" }, { name: "INS 476 (PGPR)", description: "Emulsifier used to cut cocoa butter costs" }]
          },
          {
            product_name: "Nestle Munch Chocolate Wafer",
            nutrients: { energy_kcal: 480, sugars_g: 45, sat_fat_g: 16, sodium_mg: 110, fiber_g: 1.0, protein_g: 5.0, fvl_cocoa_percent: 5.0 },
            nutri_score: { grade: 'E', score: 26, color_hex: '#e63e11', color_name: 'Dark Red', negative_points: { energy: 5, sugars: 12, sat_fat: 9, sodium: 0, total: 26 }, positive_points: { fvl: 0, fiber: 0, protein: 3, effective_protein: 0, total: 0 }, protein_capped: true, summary_msg: 'High sugar & saturated fat', recommendations: [] },
            additives: [{ name: "INS 322 (Soy Lecithin)", description: "Emulsifier" }]
          },
          {
            product_name: "Cadbury Bournville Dark Chocolate (50% Cocoa)",
            nutrients: { energy_kcal: 535, sugars_g: 48, sat_fat_g: 19.5, sodium_mg: 20, fiber_g: 6.5, protein_g: 5.5, fvl_cocoa_percent: 50.0 },
            nutri_score: { grade: 'D', score: 20, color_hex: '#ee8100', color_name: 'Orange', negative_points: { energy: 6, sugars: 13, sat_fat: 10, sodium: 0, total: 29 }, positive_points: { fvl: 2, fiber: 4, protein: 3, effective_protein: 0, total: 9 }, protein_capped: true, summary_msg: 'Consume in moderation', recommendations: [] },
            additives: [{ name: "INS 322 (Soy Lecithin)", description: "Emulsifier" }, { name: "INS 476 (PGPR)", description: "Emulsifier" }]
          }
        ]);
      });
  }, []);

  const runCalculation = (currentNutrients: NutrientInputs, nameToSave?: string) => {
    fetch(`${API_BASE}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentNutrients),
    })
      .then((res) => res.json())
      .then((result) => {
        setNutriScore(result);
        addToHistory(nameToSave || productName, result.grade, result.score, currentNutrients.energy_kcal, currentNutrients.sugars_g);
      })
      .catch((err) => {
        console.error("Calculation error:", err);
      });
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

  const handleImageUpload = (file: File) => {
    setIsLoading(true);
    setStatusType('info');
    setStatusMsg("Preprocessing OpenCV wrapper image & PyTesseract FSSAI OCR...");

    const formData = new FormData();
    formData.append("file", file);

    fetch(`${API_BASE}/api/ocr`, {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((resData) => {
        setIsLoading(false);
        if (resData.success && resData.data) {
          const d = resData.data;
          const updated: NutrientInputs = {
            energy_kcal: d.energy_kcal || 0,
            sugars_g: d.sugars_g || 0,
            added_sugars_g: d.added_sugars_g || 0,
            sat_fat_g: d.sat_fat_g || 0,
            sodium_mg: d.sodium_mg || 0,
            fiber_g: d.fiber_g || 0,
            protein_g: d.protein_g || 0,
            fvl_cocoa_percent: d.fvl_cocoa_percent || 0,
          };
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
          setNutrients(updated);
          setProductName(cleanName);
          setAdditives(d.detected_additives || []);
          setStatusType('success');
          setStatusMsg(resData.message || "✅ Chocolate wrapper label parsed successfully!");
          if (typeof window !== 'undefined' && posthog) {
            posthog.capture('ocr_scan_success', { fileName: file.name });
          }
          runCalculation(updated, cleanName);
        } else {
          // Reject invalid / random / non-chocolate images
          setStatusType('error');
          setStatusMsg(
            resData.message ||
            "⚠️ Invalid picture: Please give me a proper pic of a chocolate wrapper or nutrition facts table. NutriScan AI is strictly restricted to chocolates."
          );
        }
      })
      .catch(() => {
        setIsLoading(false);
        setStatusType('error');
        setStatusMsg("⚠️ Could not connect to backend OCR server. Please check your connection.");
      });
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
          setNutriScore(resData.nutri_score);
          setProductName(name);
          setAdditives(resData.additives || []);
          setStatusType('success');
          setStatusMsg(`✅ Chocolate match found: ${name}`);
          if (typeof window !== 'undefined' && posthog) {
            posthog.capture('barcode_lookup_success', { barcode: code, productName: name });
          }
          addToHistory(name, resData.nutri_score.grade, resData.nutri_score.score, n.energy_kcal, n.sugars_g);
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
    setNutriScore(item.nutri_score);
    setAdditives(item.additives || []);
    setStatusType('success');
    setStatusMsg(`Loaded benchmark chocolate: ${item.product_name}`);
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('benchmark_selected', { productName: item.product_name, grade: item.nutri_score.grade });
    }
    addToHistory(item.product_name, item.nutri_score.grade, item.nutri_score.score, n.energy_kcal, n.sugars_g);
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
