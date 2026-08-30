"""
OpenCV Image Preprocessing, PyTesseract OCR, FSSAI Regex NLP Label Parser,
and Indian Additive Scanner Engine.
Strictly restricted to Chocolate & Cocoa Confectionery products.
"""

import re
import cv2
import numpy as np
import pytesseract
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel


class ExtractedNutrients(BaseModel):
    raw_ocr_text: str
    is_valid_chocolate_label: bool = False
    validation_error: Optional[str] = None
    detected_chocolate_markers: List[str] = []
    is_per_serving: bool = False
    serving_size_g: float = 100.0
    energy_kcal: float = 0.0
    energy_kj: float = 0.0
    sugars_g: float = 0.0
    added_sugars_g: Optional[float] = None
    sat_fat_g: float = 0.0
    sodium_mg: float = 0.0
    salt_g: Optional[float] = None
    fiber_g: float = 0.0
    protein_g: float = 0.0
    fvl_cocoa_percent: float = 0.0
    trans_fat_g: Optional[float] = None
    detected_additives: List[Dict[str, str]] = []


class OCREngine:
    """
    Computer Vision + OCR pipeline tailored exclusively for Chocolate & Cocoa Confectionery.
    Strictly validates that scanned images belong to chocolate products and contain authentic nutrition tables.
    Rejects random objects (books, keyboards, screens, mobile phones) and non-chocolate food items (Kurkure, juices, chips, etc.).
    """

    CHOCOLATE_MARKERS = [
        r'\bchocolates?\b', r'\bchocolaty\b', r'\bchoco\b', r'\bchocobar\b',
        r'\bcocoa\b', r'\bcacao\b', r'\bcocoa\s*solids?\b', r'\bcocoa\s*butter\b',
        r'\bcocoa\s*powder\b', r'\bcocoa\s*mass\b', r'\bdark\s*chocolate\b',
        r'\bmilk\s*chocolate\b', r'\bwhite\s*chocolate\b', r'\bcompound\s*chocolate\b',
        r'\bmilk\s*compound\b', r'\bdark\s*compound\b', r'\bchocolate\s*wafer\b',
        r'\bwafer\s*chocolate\b', r'\bconfectionery\b',
        # Recognized Chocolate Brands & Product Lines
        r'\bcadbury\b', r'\bdairy\s*milk\b', r'\bbournville\b', r'\b5\s*star\b',
        r'\bperk\b', r'\bfuse\b', r'\bgems\b', r'\bamul\b',
        r'\bkit\s*kat\b', r'\bmunch\b', r'\bbar\s*one\b', r'\bmilkybar\b',
        r'\bhershey(?:\'s)?\b', r'\bferrero\b', r'\brocher\b', r'\bkinder\b',
        r'\btoblerone\b', r'\blindt\b', r'\bgalaxy\b', r'\bsnickers\b',
        r'\bmars\b', r'\btwix\b', r'\bbounty\b', r'\bdairymilk\b'
    ]

    NON_CHOCOLATE_MARKERS = [
        r'\bkurkure\b', r'\bmasala\s*munch\b', r'\bchips\b', r'\bpotato\s*chips\b',
        r'\bnamkeen\b', r'\bbhujia\b', r'\bsev\b', r'\bmixture\b', r'\blays\b',
        r'\bdoritos\b', r'\bpringles\b', r'\bcheetos\b', r'\bcorn\s*puffs?\b',
        r'\bjuice\b', r'\bfruit\s*juice\b', r'\bfrooti\b', r'\bmaaza\b', r'\bslice\b',
        r'\btropicana\b', r'\breal\s*fruit\b', r'\bsoft\s*drink\b', r'\bcarbonated\b',
        r'\bcoca[\s-]*cola\b', r'\bpepsi\b', r'\bsprite\b', r'\bthums\s*up\b',
        r'\bfanta\b', r'\b7up\b', r'\bmirinda\b', r'\bsting\b', r'\bred\s*bull\b',
        r'\benergy\s*drink\b', r'\bnoodles?\b', r'\bmaggi\b', r'\byippee\b',
        r'\bramen\b', r'\bpasta\b', r'\bpickle\b', r'\bketchup\b', r'\bsauce\b',
        r'\bsoup\b', r'\bmayonnaise\b', r'\bchutney\b', r'\bshampoo\b', r'\bsoap\b'
    ]

    NON_FOOD_MARKERS = [
        r'\bctrl\b', r'\balt\b', r'\bshift\b', r'\bshortcuts?\b', r'\bitalic\b',
        r'\bunderline\b', r'\bhyperlink\b', r'\bpresentation\b', r'\bslide\b',
        r'\bkeyboard\b', r'\bmouse\b', r'\bwindows?\b', r'\bbrowser\b',
        r'\bchapter\b', r'\bisbn\b', r'\bauthor\b', r'\bpublisher\b',
        r'\bcopyright\b', r'\bsoftware\b', r'\bjavascript\b', r'\bpython\b'
    ]

    NUTRITION_TABLE_MARKERS = [
        r'\b(?:nutrition|nutritional|nutrition\s*information|nutrition\s*facts)\b',
        r'\b(?:per\s*100\s*g|per\s*100g|approx\s*values?)\b',
        r'\b(?:carbohydrates?|total\s*sugars?|saturated\s*fat|energy|calories)\b'
    ]

    INDIAN_ADDITIVE_PATTERNS = [
        (r'palm\s*oil|palmolein', 'Palm Oil', 'High in saturated fat, linked to environmental concerns and high LDL cholesterol.'),
        (r'vanaspati|hydrogenated\s*vegetable\s*oil|hydrogenated\s*oil|interesterified\s*fat', 'Hydrogenated Fat (Vanaspati)', 'Contains trans fatty acids which significantly raise heart disease risk.'),
        (r'high\s*fructose\s*corn\s*syrup|hfcs|liquid\s*glucose|invert\s*sugar\s*syrup', 'Liquid Glucose / HFCS', 'Concentrated simple sugar linked to insulin resistance and rapid blood sugar spikes.'),
        (r'ins\s*322|e322|soy\s*lecithin', 'INS 322 (Soy Lecithin)', 'Common emulsifier derived from soy; safe for most but caution for soy allergies.'),
        (r'ins\s*476|e476|pgpr', 'INS 476 (PGPR)', 'Polyglycerol polyricinoleate emulsifier used to reduce cocoa butter cost in cheap chocolates.'),
        (r'ins\s*102|tartrazine|yellow\s*5', 'INS 102 (Tartrazine)', 'Artificial food dye linked to hyperactivity in children and mild allergic reactions.'),
        (r'ins\s*110|sunset\s*yellow', 'INS 110 (Sunset Yellow)', 'Synthetic azo dye restricted in certain European countries.'),
        (r'artificial\s*flavour|nature\s*identical\s*flavour', 'Artificial / Nature Identical Flavors', 'Synthetic flavor enhancers commonly added to processed confectionery.')
    ]

    def __init__(self, tesseract_cmd: Optional[str] = None):
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def preprocess_image(self, image_bytes: bytes) -> Tuple[np.ndarray, np.ndarray]:
        """
        OpenCV Preprocessing:
        1. Grayscale conversion.
        2. Bilateral filtering (preserves text edges while eliminating noise).
        3. CLAHE Contrast enhancement (attenuates glossy glare on foil wrappers).
        4. Adaptive thresholding.
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image from provided bytes.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(filtered)
        thresh = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        return enhanced, thresh

    def extract_text_from_bytes(self, image_bytes: bytes) -> str:
        """Runs PyTesseract OCR on image variants and combines extracted text."""
        try:
            enhanced, thresh = self.preprocess_image(image_bytes)
            text_enhanced = pytesseract.image_to_string(enhanced)
            text_thresh = pytesseract.image_to_string(thresh)
            combined_text = f"{text_enhanced}\n{text_thresh}"
            return combined_text
        except pytesseract.TesseractNotFoundError:
            return ""
        except Exception as e:
            return f"[OCR ERROR: {str(e)}]"

    def parse_fssai_text(self, text: str) -> ExtractedNutrients:
        """
        Regex NLP Parser strictly restricted to Chocolate & Cocoa Packaging.
        Rejects random objects (books, keyboards, screens) and non-chocolate food items (Kurkure, juices, chips).
        """
        lower_text = text.lower()

        # Step 1: Detect non-food markers (keyboards, books, code, desktop)
        detected_non_food = [
            m for m in self.NON_FOOD_MARKERS if re.search(m, lower_text)
        ]
        if len(detected_non_food) >= 2:
            return ExtractedNutrients(
                raw_ocr_text=text[:500],
                is_valid_chocolate_label=False,
                validation_error="⚠️ Non-food object or document detected. Please provide a proper picture of a chocolate wrapper or its nutrition facts table."
            )

        # Step 2: Detect non-chocolate food markers (Kurkure, chips, juices, sodas, etc.)
        detected_non_choc = [
            m for m in self.NON_CHOCOLATE_MARKERS if re.search(m, lower_text)
        ]
        # Check chocolate markers
        detected_choc_markers = [
            m for m in self.CHOCOLATE_MARKERS if re.search(m, lower_text)
        ]

        # If explicit non-chocolate food is detected and not dominated by chocolate
        if detected_non_choc and len(detected_non_choc) >= len(detected_choc_markers):
            return ExtractedNutrients(
                raw_ocr_text=text[:500],
                is_valid_chocolate_label=False,
                validation_error="⚠️ Non-chocolate food detected. NutriScan AI is strictly restricted to chocolates, chocolate wafers, and cocoa confectionery."
            )

        # Step 3: Check nutrition table headers
        detected_nutrition_markers = [
            m for m in self.NUTRITION_TABLE_MARKERS if re.search(m, lower_text)
        ]

        # Step 4: Parse Serving Size
        is_per_serving = False
        serving_size_g = 100.0
        serv_match = re.search(r'(?:serving\s*size|per\s*serving|pack\s*size|per\s*pack)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*(g|ml)', lower_text)
        if serv_match:
            is_per_serving = True
            serving_size_g = float(serv_match.group(1))

        # Helper bounded regex solver (searches within tight character window on lines)
        def find_value(patterns: List[str], default: float = 0.0) -> float:
            for pat in patterns:
                m = re.search(pat, lower_text)
                if m:
                    try:
                        return float(m.group(1))
                    except (ValueError, IndexError):
                        continue
            return default

        # Energy (kcal or kJ)
        energy_kcal = find_value([
            r'(?:energy|calories)\s*(?:\(kcal\))?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*(?:kcal)?',
            r'\b(\d+(?:\.\d+)?)\s*kcal\b',
            r'kcal[^\d\n\r]{0,20}(\d+(?:\.\d+)?)'
        ])

        energy_kj = find_value([
            r'energy[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*kj',
            r'\b(\d+(?:\.\d+)?)\s*kj\b'
        ])

        if energy_kcal > 0 and energy_kj == 0:
            energy_kj = energy_kcal * 4.184
        elif energy_kj > 0 and energy_kcal == 0:
            energy_kcal = energy_kj / 4.184

        # Total Sugars
        sugars_g = find_value([
            r'(?:total\s*)?sugars?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?',
            r'sugars?[^\d\n\r]{0,20}(\d+(?:\.\d+)?)'
        ])

        # Added Sugars
        added_sugars = find_value([
            r'added\s*sugars?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?',
            r'of\s*which\s*added\s*sugars?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)'
        ], default=-1.0)
        added_sugars_g = added_sugars if added_sugars >= 0 else None

        # Saturated Fat
        sat_fat_g = find_value([
            r'(?:saturated\s*(?:fatty\s*acids|fat)?|sat\s*fat)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?',
            r'sat\.\s*fat[^\d\n\r]{0,20}(\d+(?:\.\d+)?)'
        ])

        # Trans Fat
        trans_fat = find_value([
            r'trans\s*(?:fatty\s*acids|fat)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?',
            r'trans\s*fat[^\d\n\r]{0,20}(\d+(?:\.\d+)?)'
        ], default=-1.0)
        trans_fat_g = trans_fat if trans_fat >= 0 else None

        # Sodium (mg or g) or Salt (g)
        sodium_mg = find_value([
            r'sodium\s*(?:\(mg\))?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*mg?',
            r'sodium[^\d\n\r]{0,20}(\d+(?:\.\d+)?)'
        ])

        if sodium_mg == 0.0:
            sodium_g = find_value([r'sodium[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g\b'])
            if sodium_g > 0:
                sodium_mg = sodium_g * 1000.0

        salt_g = find_value([
            r'salt\s*(?:\(g\))?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?',
            r'salt[^\d\n\r]{0,20}(\d+(?:\.\d+)?)'
        ], default=-1.0)
        salt_val = salt_g if salt_g >= 0 else None

        if sodium_mg == 0.0 and salt_val is not None and salt_val > 0:
            sodium_mg = salt_val * 400.0

        # Dietary Fiber
        fiber_g = find_value([
            r'(?:dietary\s*)?fib(?:re|er)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?',
            r'fib(?:re|er)[^\d\n\r]{0,20}(\d+(?:\.\d+)?)'
        ])

        # Protein
        protein_g = find_value([
            r'proteins?[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*g?',
            r'protein[^\d\n\r]{0,20}(\d+(?:\.\d+)?)'
        ])

        # Cocoa %
        fvl_cocoa_percent = find_value([
            r'(\d+(?:\.\d+)?)\s*%\s*(?:cocoa|cacao)',
            r'(?:cocoa|cacao)[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*%',
            r'cocoa\s*solids[^\d\n\r]{0,25}(\d+(?:\.\d+)?)\s*%'
        ])

        # Scan for Indian Additives
        additives_found = []
        for pattern, name, desc in self.INDIAN_ADDITIVE_PATTERNS:
            if re.search(pattern, lower_text):
                additives_found.append({
                    'name': name,
                    'description': desc
                })

        # Count extracted distinct nutrient metrics
        nutrient_count = sum([
            1 if energy_kcal > 0 else 0,
            1 if sugars_g > 0 else 0,
            1 if sat_fat_g > 0 else 0,
            1 if protein_g > 0 else 0,
            1 if fiber_g > 0 else 0,
            1 if sodium_mg > 0 else 0,
        ])

        # Strict Chocolate-Only Validation Logic:
        # 1. Must have recognizable chocolate markers or cocoa keywords.
        # 2. Must not be empty or random text.
        # 3. Must have at least 2 real extracted nutrient values.
        has_chocolate_context = len(detected_choc_markers) >= 1 or fvl_cocoa_percent > 0
        has_nutrition_table = len(detected_nutrition_markers) >= 1 and nutrient_count >= 2

        is_valid = False
        validation_error = None

        if not text.strip():
            validation_error = "⚠️ No readable text detected. Please ensure the chocolate wrapper is well-lit, held steady, and clearly visible."
        elif not has_chocolate_context and not (has_nutrition_table and (sugars_g > 15 and sat_fat_g > 5)):
            validation_error = "⚠️ No chocolate wrapper or cocoa confectionery detected. Please provide a clear, proper photo of a chocolate wrapper."
        elif nutrient_count < 2:
            validation_error = "⚠️ Could not read nutrition values (Energy, Sugar, Saturated Fat). Please align the nutrition facts table directly inside the camera frame."
        else:
            is_valid = True

        # Scale to 100g if detected values were per serving
        if is_valid and is_per_serving and serving_size_g > 0 and serving_size_g != 100.0:
            factor = 100.0 / serving_size_g
            energy_kcal *= factor
            energy_kj *= factor
            sugars_g *= factor
            if added_sugars_g is not None:
                added_sugars_g *= factor
            sat_fat_g *= factor
            if trans_fat_g is not None:
                trans_fat_g *= factor
            sodium_mg *= factor
            fiber_g *= factor
            protein_g *= factor

        return ExtractedNutrients(
            raw_ocr_text=text[:1000],
            is_valid_chocolate_label=is_valid,
            validation_error=validation_error,
            detected_chocolate_markers=detected_choc_markers,
            is_per_serving=is_per_serving,
            serving_size_g=serving_size_g,
            energy_kcal=round(energy_kcal, 1),
            energy_kj=round(energy_kj, 1),
            sugars_g=round(sugars_g, 1),
            added_sugars_g=round(added_sugars_g, 1) if added_sugars_g else None,
            sat_fat_g=round(sat_fat_g, 1),
            sodium_mg=round(sodium_mg, 1),
            salt_g=round(salt_val, 2) if salt_val else None,
            fiber_g=round(fiber_g, 1),
            protein_g=round(protein_g, 1),
            fvl_cocoa_percent=round(fvl_cocoa_percent, 1),
            trans_fat_g=round(trans_fat_g, 2) if trans_fat_g else None,
            detected_additives=additives_found
        )
