import { createWorker } from 'tesseract.js';
import { NutrientInputs } from './nutriScoreService';

export interface ExtractedLabelData {
  isValidChocolate: boolean;
  errorMessage?: string;
  nutrients: NutrientInputs;
  productName: string;
  additives: Array<{ name: string; description: string }>;
  rawOcrText: string;
}

const CHOCOLATE_MARKERS = [
  /\bchocolates?\b/i, /\bchocolaty\b/i, /\bchoco\b/i, /\bchocobar\b/i,
  /\bcocoa\b/i, /\bcacao\b/i, /\bcocoa\s*solids?\b/i, /\bcocoa\s*butter\b/i,
  /\bcocoa\s*powder\b/i, /\bcocoa\s*mass\b/i, /\bdark\s*chocolate\b/i,
  /\bmilk\s*chocolate\b/i, /\bwhite\s*chocolate\b/i, /\bcompound\s*chocolate\b/i,
  /\bmilk\s*compound\b/i, /\bdark\s*compound\b/i, /\bchocolate\s*wafer\b/i,
  /\bwafer\s*chocolate\b/i, /\bconfectionery\b/i,
  /\bcadbury\b/i, /\bdairy\s*milk\b/i, /\bbournville\b/i, /\b5\s*star\b/i,
  /\bperk\b/i, /\bfuse\b/i, /\bgems\b/i, /\bamul\b/i,
  /\bkit\s*kat\b/i, /\bmunch\b/i, /\bbar\s*one\b/i, /\bmilkybar\b/i,
  /\bhershey(?:'s)?\b/i, /\bferrero\b/i, /\brocher\b/i, /\bkinder\b/i,
  /\btoblerone\b/i, /\blindt\b/i, /\bgalaxy\b/i, /\bsnickers\b/i,
  /\bmars\b/i, /\btwix\b/i, /\bbounty\b/i, /\bdairymilk\b/i
];

const NON_CHOCOLATE_MARKERS = [
  /\bkurkure\b/i, /\bmasala\s*munch\b/i, /\bchips\b/i, /\bpotato\s*chips\b/i,
  /\bnamkeen\b/i, /\bbhujia\b/i, /\bsev\b/i, /\bmixture\b/i, /\blays\b/i,
  /\bdoritos\b/i, /\bpringles\b/i, /\bcheetos\b/i, /\bcorn\s*puffs?\b/i,
  /\bjuice\b/i, /\bfruit\s*juice\b/i, /\bfrooti\b/i, /\bmaaza\b/i, /\bslice\b/i,
  /\btropicana\b/i, /\breal\s*fruit\b/i, /\bsoft\s*drink\b/i, /\bcarbonated\b/i,
  /\bcoca[\s-]*cola\b/i, /\bpepsi\b/i, /\bsprite\b/i, /\bthums\s*up\b/i,
  /\bfanta\b/i, /\b7up\b/i, /\bmirinda\b/i, /\bsting\b/i, /\bred\s*bull\b/i,
  /\benergy\s*drink\b/i, /\bnoodles?\b/i, /\bmaggi\b/i, /\byippee\b/i,
  /\bramen\b/i, /\bpasta\b/i, /\bpickle\b/i, /\bketchup\b/i, /\bsauce\b/i,
  /\bsoup\b/i, /\bmayonnaise\b/i, /\bchutney\b/i
];

const NON_FOOD_MARKERS = [
  /\bctrl\b/i, /\balt\b/i, /\bshift\b/i, /\bshortcuts?\b/i, /\bitalic\b/i,
  /\bunderline\b/i, /\bhyperlink\b/i, /\bpresentation\b/i, /\bslide\b/i,
  /\bkeyboard\b/i, /\bmouse\b/i, /\bwindows?\b/i, /\bbrowser\b/i,
  /\bchapter\b/i, /\bisbn\b/i, /\bauthor\b/i, /\bpublisher\b/i,
  /\bcopyright\b/i, /\bsoftware\b/i, /\bjavascript\b/i, /\bpython\b/i
];

const NUTRITION_TABLE_MARKERS = [
  /\b(?:nutrition|nutritional|nutrition\s*information|nutrition\s*facts)\b/i,
  /\b(?:per\s*100\s*g|per\s*100g|approx\s*values?)\b/i,
  /\b(?:carbohydrates?|total\s*sugars?|saturated\s*fat|energy|calories)\b/i
];

const INDIAN_ADDITIVES = [
  { pattern: /palm\s*oil|palmolein/i, name: 'Palm Oil', description: 'High in saturated fat, linked to LDL cholesterol elevation.' },
  { pattern: /vanaspati|hydrogenated\s*vegetable\s*oil|hydrogenated\s*oil|interesterified\s*fat/i, name: 'Hydrogenated Fat (Vanaspati)', description: 'Contains trans fatty acids which significantly raise heart disease risk.' },
  { pattern: /high\s*fructose\s*corn\s*syrup|hfcs|liquid\s*glucose|invert\s*sugar/i, name: 'Liquid Glucose / HFCS', description: 'Concentrated simple sugar linked to insulin resistance and blood sugar spikes.' },
  { pattern: /ins\s*322|e322|soy\s*lecithin/i, name: 'INS 322 (Soy Lecithin)', description: 'Common emulsifier derived from soy.' },
  { pattern: /ins\s*476|e476|pgpr/i, name: 'INS 476 (PGPR)', description: 'Polyglycerol polyricinoleate emulsifier used to cut cocoa butter costs.' },
  { pattern: /artificial\s*flavour|nature\s*identical\s*flavour/i, name: 'Artificial / Nature Identical Flavors', description: 'Synthetic flavor enhancers commonly added to confectionery.' }
];

export async function processChocolateImage(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedLabelData> {
  let worker: any = null;

  try {
    if (onProgress) onProgress(0.2, "Initializing OCR engine...");
    worker = await createWorker('eng');

    if (onProgress) onProgress(0.5, "Scanning packaging text & nutrition table...");
    const ret = await worker.recognize(imageFile);
    const text = ret.data.text || "";

    if (onProgress) onProgress(0.9, "Parsing FSSAI nutrients & validating chocolate...");
    const parsed = parseChocolateText(text, imageFile.name);
    return parsed;
  } catch (err: any) {
    console.error("Tesseract.js OCR Error:", err);
    return {
      isValidChocolate: false,
      errorMessage: "⚠️ Could not read text from image. Please ensure the chocolate wrapper is well-lit, held steady, and clearly visible.",
      nutrients: { energy_kcal: 0, sugars_g: 0, sat_fat_g: 0, sodium_mg: 0, fiber_g: 0, protein_g: 0, fvl_cocoa_percent: 0 },
      productName: imageFile.name.replace(/\.[^/.]+$/, ""),
      additives: [],
      rawOcrText: ""
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

export function parseChocolateText(text: string, filenameFallback?: string): ExtractedLabelData {
  const lower = text.toLowerCase();

  // Non-food check
  const nonFoodMatches = NON_FOOD_MARKERS.filter(p => p.test(lower));
  if (nonFoodMatches.length >= 2) {
    return {
      isValidChocolate: false,
      errorMessage: "⚠️ Non-food object or document detected. Please provide a proper picture of a chocolate wrapper or its nutrition facts table.",
      nutrients: { energy_kcal: 0, sugars_g: 0, sat_fat_g: 0, sodium_mg: 0, fiber_g: 0, protein_g: 0, fvl_cocoa_percent: 0 },
      productName: "Non-Food Object",
      additives: [],
      rawOcrText: text.slice(0, 500)
    };
  }

  // Non-chocolate check
  const nonChocMatches = NON_CHOCOLATE_MARKERS.filter(p => p.test(lower));
  const chocMatches = CHOCOLATE_MARKERS.filter(p => p.test(lower));

  if (nonChocMatches.length > 0 && nonChocMatches.length >= chocMatches.length) {
    return {
      isValidChocolate: false,
      errorMessage: "⚠️ Non-chocolate food detected. NutriScan AI is strictly restricted to chocolates, chocolate wafers, and cocoa confectionery.",
      nutrients: { energy_kcal: 0, sugars_g: 0, sat_fat_g: 0, sodium_mg: 0, fiber_g: 0, protein_g: 0, fvl_cocoa_percent: 0 },
      productName: "Non-Chocolate Food",
      additives: [],
      rawOcrText: text.slice(0, 500)
    };
  }

  // Bounded regex helper
  const findValue = (patterns: RegExp[], def = 0): number => {
    for (const pat of patterns) {
      const m = lower.match(pat);
      if (m && m[1]) {
        const n = parseFloat(m[1]);
        if (!isNaN(n)) return n;
      }
    }
    return def;
  };

  // Per serving check
  let isPerServing = false;
  let servingSize = 100.0;
  const servMatch = lower.match(/(?:serving\s*size|per\s*serving|pack\s*size|per\s*pack)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
  if (servMatch && servMatch[1]) {
    const s = parseFloat(servMatch[1]);
    if (!isNaN(s) && s > 0) {
      isPerServing = true;
      servingSize = s;
    }
  }

  // Extract Nutrients
  let energy_kcal = findValue([
    /(?:energy|calories)\s*(?:\(kcal\))?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*(?:kcal)?/i,
    /\b(\d+(?:\.\d+)?)\s*kcal\b/i,
    /kcal[^\d\n\r]{0,20}(\d+(?:\.\d+)?)/i
  ]);

  let sugars_g = findValue([
    /(?:total\s*)?sugars?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?/i,
    /sugars?[^\d\n\r]{0,20}(\d+(?:\.\d+)?)/i
  ]);

  let added_sugars_g: number | undefined = findValue([
    /added\s*sugars?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?/i,
    /of\s*which\s*added\s*sugars?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)/i
  ], -1);
  if (added_sugars_g < 0) added_sugars_g = undefined;

  let sat_fat_g = findValue([
    /(?:saturated\s*(?:fatty\s*acids|fat)?|sat\s*fat)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?/i,
    /sat\.\s*fat[^\d\n\r]{0,20}(\d+(?:\.\d+)?)/i
  ]);

  let sodium_mg = findValue([
    /sodium\s*(?:\(mg\))?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*mg?/i,
    /sodium[^\d\n\r]{0,20}(\d+(?:\.\d+)?)/i
  ]);

  let fiber_g = findValue([
    /(?:dietary\s*)?fib(?:re|er)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?/i,
    /fib(?:re|er)[^\d\n\r]{0,20}(\d+(?:\.\d+)?)/i
  ]);

  let protein_g = findValue([
    /proteins?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?/i,
    /protein[^\d\n\r]{0,20}(\d+(?:\.\d+)?)/i
  ]);

  let fvl_cocoa_percent = findValue([
    /(\d+(?:\.\d+)?)\s*%\s*(?:cocoa|cacao)/i,
    /(?:cocoa|cacao)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*%/i,
    /cocoa\s*solids[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*%/i
  ]);

  // Detected additives
  const additivesFound: Array<{ name: string; description: string }> = [];
  for (const item of INDIAN_ADDITIVES) {
    if (item.pattern.test(lower)) {
      additivesFound.push({ name: item.name, description: item.description });
    }
  }

  // Count distinct metrics
  const nutrientCount = (energy_kcal > 0 ? 1 : 0) +
    (sugars_g > 0 ? 1 : 0) +
    (sat_fat_g > 0 ? 1 : 0) +
    (protein_g > 0 ? 1 : 0) +
    (fiber_g > 0 ? 1 : 0) +
    (sodium_mg > 0 ? 1 : 0);

  const hasChocContext = chocMatches.length >= 1 || fvl_cocoa_percent > 0;
  const hasNutritionTable = NUTRITION_TABLE_MARKERS.some(p => p.test(lower)) && nutrientCount >= 2;

  if (!text.trim()) {
    return {
      isValidChocolate: false,
      errorMessage: "⚠️ No readable text detected. Please ensure the chocolate wrapper is well-lit, held steady, and clearly visible.",
      nutrients: { energy_kcal: 0, sugars_g: 0, sat_fat_g: 0, sodium_mg: 0, fiber_g: 0, protein_g: 0, fvl_cocoa_percent: 0 },
      productName: "Unreadable",
      additives: [],
      rawOcrText: ""
    };
  }

  if (!hasChocContext && !(hasNutritionTable && sugars_g > 15 && sat_fat_g > 5)) {
    return {
      isValidChocolate: false,
      errorMessage: "⚠️ No chocolate wrapper or cocoa confectionery detected. Please provide a clear, proper photo of a chocolate wrapper.",
      nutrients: { energy_kcal: 0, sugars_g: 0, sat_fat_g: 0, sodium_mg: 0, fiber_g: 0, protein_g: 0, fvl_cocoa_percent: 0 },
      productName: "Non-Chocolate Item",
      additives: [],
      rawOcrText: text.slice(0, 500)
    };
  }

  if (nutrientCount < 2) {
    return {
      isValidChocolate: false,
      errorMessage: "⚠️ Could not read nutrition values (Energy, Sugar, Saturated Fat). Please align the nutrition facts table directly inside the camera frame.",
      nutrients: { energy_kcal: 0, sugars_g: 0, sat_fat_g: 0, sodium_mg: 0, fiber_g: 0, protein_g: 0, fvl_cocoa_percent: 0 },
      productName: "Chocolate Wrapper (Unreadable Table)",
      additives: [],
      rawOcrText: text.slice(0, 500)
    };
  }

  // Scale if per-serving
  if (isPerServing && servingSize > 0 && servingSize !== 100.0) {
    const factor = 100.0 / servingSize;
    energy_kcal = Math.round(energy_kcal * factor * 10) / 10;
    sugars_g = Math.round(sugars_g * factor * 10) / 10;
    if (added_sugars_g !== undefined) added_sugars_g = Math.round(added_sugars_g * factor * 10) / 10;
    sat_fat_g = Math.round(sat_fat_g * factor * 10) / 10;
    sodium_mg = Math.round(sodium_mg * factor * 10) / 10;
    fiber_g = Math.round(fiber_g * factor * 10) / 10;
    protein_g = Math.round(protein_g * factor * 10) / 10;
  }

  // Detect product brand/name in text
  let detectedName = "Chocolate Product";
  if (/cadbury\s*dairy\s*milk/i.test(lower)) detectedName = "Cadbury Dairy Milk Chocolate";
  else if (/bournville/i.test(lower)) detectedName = "Cadbury Bournville Dark Chocolate";
  else if (/amul\s*dark/i.test(lower) || (/amul/i.test(lower) && /cocoa/i.test(lower))) detectedName = "Amul Dark Chocolate (75% Cocoa)";
  else if (/nestle\s*munch|munch/i.test(lower)) detectedName = "Nestle Munch Chocolate Wafer";
  else if (/kit\s*kat/i.test(lower)) detectedName = "Nestle KitKat Chocolate Wafer";
  else if (/5\s*star/i.test(lower)) detectedName = "Cadbury 5 Star Chocolate";
  else if (/perk/i.test(lower)) detectedName = "Cadbury Perk Chocolate Wafer";
  else if (/snickers/i.test(lower)) detectedName = "Snickers Chocolate Bar";
  else if (/toblerone/i.test(lower)) detectedName = "Toblerone Chocolate";
  else if (/galaxy/i.test(lower)) detectedName = "Galaxy Chocolate Bar";
  else if (filenameFallback) {
    detectedName = filenameFallback.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
  }

  return {
    isValidChocolate: true,
    nutrients: {
      energy_kcal,
      sugars_g,
      added_sugars_g,
      sat_fat_g,
      sodium_mg,
      fiber_g,
      protein_g,
      fvl_cocoa_percent,
    },
    productName: detectedName,
    additives: additivesFound,
    rawOcrText: text.slice(0, 1000)
  };
}
