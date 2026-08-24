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
import { Lightbulb, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

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

  // Load benchmarks from backend API on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/benchmarks`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBenchmarks(data);
        }
      })
      .catch(() => {
        // Fallback offline mock benchmarks
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
          }
        ]);
      });
  }, []);

  const runCalculation = (currentNutrients: NutrientInputs) => {
    fetch(`${API_BASE}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentNutrients),
    })
      .then((res) => res.json())
      .then((result) => {
        setNutriScore(result);
        addToHistory(productName, result.grade, result.score, currentNutrients.energy_kcal, currentNutrients.sugars_g);
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
            energy_kcal: d.energy_kcal || 500,
            sugars_g: d.sugars_g || 20,
            added_sugars_g: d.added_sugars_g || 15,
            sat_fat_g: d.sat_fat_g || 10,
            sodium_mg: d.sodium_mg || 50,
            fiber_g: d.fiber_g || 2,
            protein_g: d.protein_g || 5,
            fvl_cocoa_percent: d.fvl_cocoa_percent || 0,
          };
          setNutrients(updated);
          setProductName(file.name.replace(/\.[^/.]+$/, ""));
          setAdditives(d.detected_additives || []);
          setStatusMsg("✅ Wrapper label OCR parsed successfully!");
          runCalculation(updated);
        }
      })
      .catch(() => {
        setIsLoading(false);
        setStatusMsg("⚠️ Could not connect to backend OCR server. Using manual input.");
      });
  };

  const handleBarcodeLookup = (code: string) => {
    setIsLoading(true);
    setStatusMsg(`Looking up barcode ${code}...`);

    fetch(`${API_BASE}/api/barcode/${code}`)
      .then((res) => res.json())
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
          setNutrients(updated);
          setNutriScore(resData.nutri_score);
          setProductName(resData.product_info?.name || `Barcode ${code}`);
          setAdditives(resData.additives || []);
          setStatusMsg(`✅ Barcode match found: ${resData.product_info?.name}`);
          addToHistory(resData.product_info?.name, resData.nutri_score.grade, resData.nutri_score.score, n.energy_kcal, n.sugars_g);
        }
      })
      .catch(() => {
        setIsLoading(false);
        setStatusMsg(`⚠️ Barcode ${code} not found in database.`);
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
    setStatusMsg(`Loaded benchmark: ${item.product_name}`);
    addToHistory(item.product_name, item.nutri_score.grade, item.nutri_score.score, n.energy_kcal, n.sugars_g);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Status Notification Banner */}
        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center justify-between shadow-lg">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">✕</button>
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
            <span>Product Analysis:</span>
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
              <span>Healthier Indian Alternatives & Guidance Radar</span>
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
        <p>NutriScan AI &bull; Smart Front-of-Pack Nutrition Grade Calculator (India Edition)</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Algorithm: Updated 2023/2024 European General Solid Foods Standard & FSSAI Indian Label Parser.
        </p>
      </footer>
    </div>
  );
}
