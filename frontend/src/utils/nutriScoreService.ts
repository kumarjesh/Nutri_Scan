/**
 * Deterministic 2023/2024 European Nutri-Score calculation for general solid foods.
 */

export interface NutrientInputs {
  energy_kcal: number;
  energy_kj?: number;
  sugars_g: number;
  added_sugars_g?: number;
  sat_fat_g: number;
  sodium_mg: number;
  salt_g?: number;
  fiber_g: number;
  protein_g: number;
  fvl_cocoa_percent: number;
  trans_fat_g?: number;
}

export interface NutriScoreResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  score: number;
  color_hex: string;
  color_name: string;
  negative_points: {
    energy: number;
    sugars: number;
    sat_fat: number;
    sodium: number;
    total: number;
  };
  positive_points: {
    fvl: number;
    fiber: number;
    protein: number;
    effective_protein: number;
    total: number;
  };
  protein_capped: boolean;
  summary_msg: string;
  recommendations: string[];
}

const GRADE_COLORS: Record<string, [string, string, string]> = {
  A: ['#008b4c', 'Dark Green', 'Excellent nutritional quality'],
  B: ['#80bb2d', 'Light Green', 'Good nutritional quality'],
  C: ['#fecb02', 'Yellow', 'Moderate nutritional quality'],
  D: ['#ee8100', 'Orange', 'Poor nutritional quality - Consume in moderation'],
  E: ['#e63e11', 'Dark Red', 'Very poor nutritional quality - High sugar & saturated fat'],
};

export function calculateNutriScore(data: NutrientInputs): NutriScoreResult {
  const energy_kj = data.energy_kj ?? data.energy_kcal * 4.184;

  let sodium_mg = data.sodium_mg;
  if (sodium_mg === 0 && data.salt_g && data.salt_g > 0) {
    sodium_mg = data.salt_g * 400.0;
  }

  // Negative Points (N)
  const energyThresholds = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
  let pts_energy = 0;
  for (const t of energyThresholds) {
    if (energy_kj > t) pts_energy++;
    else break;
  }

  const sugarsThresholds = [3.4, 6.8, 10.0, 14.0, 17.5, 21.0, 24.5, 28.0, 31.5, 35.0, 38.5, 42.0, 45.5, 49.0, 52.5];
  let pts_sugars = 0;
  for (const t of sugarsThresholds) {
    if (data.sugars_g > t) pts_sugars++;
    else break;
  }

  const satFatThresholds = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
  let pts_sat_fat = 0;
  for (const t of satFatThresholds) {
    if (data.sat_fat_g > t) pts_sat_fat++;
    else break;
  }

  const sodiumThresholds = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900];
  let pts_sodium = 0;
  for (const t of sodiumThresholds) {
    if (sodium_mg > t) pts_sodium++;
    else break;
  }

  const total_n = pts_energy + pts_sugars + pts_sat_fat + pts_sodium;

  // Positive Points (P)
  let pts_fvl = 0;
  if (data.fvl_cocoa_percent > 80.0) pts_fvl = 5;
  else if (data.fvl_cocoa_percent > 60.0) pts_fvl = 2;
  else if (data.fvl_cocoa_percent > 40.0) pts_fvl = 1;

  const fiberThresholds = [0.9, 1.9, 2.8, 3.7, 4.7];
  let pts_fiber = 0;
  for (const t of fiberThresholds) {
    if (data.fiber_g > t) pts_fiber++;
    else break;
  }

  const proteinThresholds = [1.5, 3.0, 4.5, 6.0, 8.0];
  let pts_protein = 0;
  for (const t of proteinThresholds) {
    if (data.protein_g > t) pts_protein++;
    else break;
  }

  // Protein Capping Rule
  let protein_capped = false;
  let effective_protein_pts = pts_protein;
  if (total_n >= 11 && pts_fvl < 5) {
    protein_capped = true;
    effective_protein_pts = 0;
  }

  const total_p = pts_fvl + pts_fiber + effective_protein_pts;
  const final_score = total_n - total_p;

  let grade: 'A' | 'B' | 'C' | 'D' | 'E' = 'E';
  if (final_score <= -1) grade = 'A';
  else if (final_score <= 2) grade = 'B';
  else if (final_score <= 10) grade = 'C';
  else if (final_score <= 18) grade = 'D';
  else grade = 'E';

  const [hex_color, color_name, summary_text] = GRADE_COLORS[grade];

  const recommendations: string[] = [];
  if (grade === 'D' || grade === 'E') {
    if (data.sugars_g > 25.0) {
      recommendations.append
        ? recommendations.push("High Sugar Penalty: Look for Amul Dark Chocolate (75%+ Cocoa) or sugar-free dark cocoa alternatives.")
        : recommendations.push("High Sugar Penalty: Look for Amul Dark Chocolate (75%+ Cocoa) or sugar-free dark cocoa alternatives.");
    }
    if (data.sat_fat_g > 8.0) {
      recommendations.push("High Saturated Fat: Check ingredients for Palm Oil or Vanaspati. Prefer chocolates made with pure cocoa butter.");
    }
    if (data.fiber_g < 2.0) {
      recommendations.push("Low Dietary Fiber: Choose dark chocolates with higher cocoa percentages (50% - 85% cocoa).");
    }
  } else {
    recommendations.push("Good choice! This chocolate product maintains a balanced nutritional score with higher cocoa solids.");
  }

  if (data.trans_fat_g && data.trans_fat_g > 0.2) {
    recommendations.push("⚠️ Contains Trans Fat (>0.2g): FSSAI recommends avoiding hydrogenated fats/vanaspati in chocolates.");
  }

  return {
    grade,
    score: final_score,
    color_hex: hex_color,
    color_name: color_name,
    negative_points: {
      energy: pts_energy,
      sugars: pts_sugars,
      sat_fat: pts_sat_fat,
      sodium: pts_sodium,
      total: total_n,
    },
    positive_points: {
      fvl: pts_fvl,
      fiber: pts_fiber,
      protein: pts_protein,
      effective_protein: effective_protein_pts,
      total: total_p,
    },
    protein_capped,
    summary_msg: summary_text,
    recommendations,
  };
}
