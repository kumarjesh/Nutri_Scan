"""
OpenCV Image Preprocessing, PyTesseract OCR, FSSAI Regex NLP Label Parser,
and Indian Additive Scanner Engine.
"""

import re
import cv2
import numpy as np
import pytesseract
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel


class ExtractedNutrients(BaseModel):
    raw_ocr_text: str
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
    Computer Vision + OCR pipeline tailored for Indian packaged foods (FSSAI mandatory formats).
    """

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
        2. Bilateral filtering (preserves text edges while eliminating surface noise/wrinkles).
        3. CLAHE Contrast enhancement (attenuates glossy glare on foil wrappers).
        4. Adaptive Otsu thresholding.
        Returns (preprocessed_gray, binary_threshold).
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image from provided bytes.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Bilateral filter to reduce noise while maintaining sharp text edges
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)

        # CLAHE (Contrast Limited Adaptive Histogram Equalization) for reflection attenuation
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(filtered)

        # Adaptive thresholding
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
            # Fallback if tesseract binary is not installed on system
            return "[OCR WARNING: Tesseract OCR engine binary not detected on host system. Please input numbers manually or configure Tesseract path.]"
        except Exception as e:
            return f"[OCR ERROR: {str(e)}]"

    def parse_fssai_text(self, text: str) -> ExtractedNutrients:
        """
        Regex NLP Parser for Indian FSSAI Label Standards.
        Converts text into normalized ExtractedNutrients object.
        """
        lower_text = text.lower()

        # Check per serving vs per 100g
        is_per_serving = False
        serving_size_g = 100.0

        serv_match = re.search(r'(?:serving\s*size|per\s*serving|pack\s*size|per\s*pack|size)[^\d]*(\d+(?:\.\d+)?)\s*(g|ml)', lower_text)
        if serv_match:
            is_per_serving = True
            serving_size_g = float(serv_match.group(1))

        # Helper regex solver
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
            r'energy[^\d]*(\d+(?:\.\d+)?)\s*kcal',
            r'calories[^\d]*(\d+(?:\.\d+)?)',
            r'energy\s*(?:\(kcal\))?[^\d]*(\d+(?:\.\d+)?)',
            r'kcal[^\d]*(\d+(?:\.\d+)?)'
        ])

        energy_kj = find_value([
            r'energy[^\d]*(\d+(?:\.\d+)?)\s*kj',
            r'kj[^\d]*(\d+(?:\.\d+)?)'
        ])

        if energy_kcal > 0 and energy_kj == 0:
            energy_kj = energy_kcal * 4.184
        elif energy_kj > 0 and energy_kcal == 0:
            energy_kcal = energy_kj / 4.184

        # Total Sugars
        sugars_g = find_value([
            r'total\s*sugars?[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'sugars?[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'sugars?[^\d]*(\d+(?:\.\d+)?)'
        ])

        # Added Sugars
        added_sugars = find_value([
            r'added\s*sugars?[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'of\s*which\s*added\s*sugars?[^\d]*(\d+(?:\.\d+)?)'
        ], default=-1.0)
        added_sugars_g = added_sugars if added_sugars >= 0 else None

        # Saturated Fat
        sat_fat_g = find_value([
            r'saturated\s*(?:fatty\s*acids|fat)?[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'sat\s*fat[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'sat\.\s*fat[^\d]*(\d+(?:\.\d+)?)'
        ])

        # Trans Fat
        trans_fat = find_value([
            r'trans\s*(?:fatty\s*acids|fat)[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'trans\s*fat[^\d]*(\d+(?:\.\d+)?)'
        ], default=-1.0)
        trans_fat_g = trans_fat if trans_fat >= 0 else None

        # Sodium (mg or g) or Salt (g)
        sodium_mg = find_value([
            r'sodium[^\d]*(\d+(?:\.\d+)?)\s*mg',
            r'sodium\s*(?:\(mg\))?[^\d]*(\d+(?:\.\d+)?)'
        ])

        if sodium_mg == 0.0:
            sodium_g = find_value([r'sodium[^\d]*(\d+(?:\.\d+)?)\s*g'])
            if sodium_g > 0:
                sodium_mg = sodium_g * 1000.0

        salt_g = find_value([
            r'salt[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'salt\s*(?:\(g\))?[^\d]*(\d+(?:\.\d+)?)'
        ], default=-1.0)
        salt_val = salt_g if salt_g >= 0 else None

        if sodium_mg == 0.0 and salt_val is not None and salt_val > 0:
            sodium_mg = salt_val * 400.0

        # Dietary Fiber
        fiber_g = find_value([
            r'dietary\s*fibre?[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'fibre?[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'fiber[^\d]*(\d+(?:\.\d+)?)'
        ])

        # Protein
        protein_g = find_value([
            r'proteins?[^\d]*(\d+(?:\.\d+)?)\s*g',
            r'protein[^\d]*(\d+(?:\.\d+)?)'
        ])

        # Cocoa / Fruit / Veg %
        fvl_cocoa_percent = find_value([
            r'(\d+(?:\.\d+)?)\%\s*cocoa',
            r'cocoa[^\d]*(\d+(?:\.\d+)?)\%',
            r'cocoa\s*solids[^\d]*(\d+(?:\.\d+)?)\%',
            r'fruits?[^\d]*(\d+(?:\.\d+)?)\%'
        ])

        # Scan for Indian Additives
        additives_found = []
        for pattern, name, desc in self.INDIAN_ADDITIVE_PATTERNS:
            if re.search(pattern, lower_text):
                additives_found.append({
                    'name': name,
                    'description': desc
                })

        # Scale to 100g if detected values were per serving
        if is_per_serving and serving_size_g > 0 and serving_size_g != 100.0:
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
            raw_ocr_text=text,
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
