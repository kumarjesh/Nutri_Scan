"""
FastAPI Server Entry Point for NutriScan AI Backend API.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from nutri_score import NutriScoreCalculator, NutrientData, NutriScoreResult
from ocr_engine import OCREngine, ExtractedNutrients
from barcode_service import BarcodeService


app = FastAPI(
    title="NutriScan AI API (India Market Edition)",
    description="Smart Front-of-Pack Nutrition Grade & Nutri-Score Calculator API",
    version="1.0.0"
)

# Enable CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js local dev server (http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

calculator = NutriScoreCalculator()
ocr_engine = OCREngine()


class OCRResponse(BaseModel):
    success: bool
    data: ExtractedNutrients
    message: str


class CalculationRequest(BaseModel):
    energy_kcal: float = 0.0
    energy_kj: Optional[float] = None
    sugars_g: float = 0.0
    added_sugars_g: Optional[float] = None
    sat_fat_g: float = 0.0
    sodium_mg: float = 0.0
    salt_g: Optional[float] = None
    fiber_g: float = 0.0
    protein_g: float = 0.0
    fvl_cocoa_percent: float = 0.0
    trans_fat_g: Optional[float] = None
    ingredients_text: Optional[str] = ""


class FullScanResponse(BaseModel):
    nutrients: NutrientData
    nutri_score: NutriScoreResult
    additives: List[Dict[str, str]]
    source: str


@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "NutriScan AI API (India Market Edition)",
        "version": "1.0.0"
    }


@app.post("/api/ocr", response_model=OCRResponse)
async def process_ocr_image(file: UploadFile = File(...)):
    """Upload packaging label image, preprocess with OpenCV, run PyTesseract OCR, and parse FSSAI label."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid JPG/PNG image.")

    try:
        contents = await file.read()
        extracted_text = ocr_engine.extract_text_from_bytes(contents)
        parsed_nutrients = ocr_engine.parse_fssai_text(extracted_text)

        return OCRResponse(
            success=True,
            data=parsed_nutrients,
            message="FSSAI label successfully extracted and normalized."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")


@app.post("/api/calculate", response_model=NutriScoreResult)
def calculate_nutri_score(payload: CalculationRequest):
    """Compute deterministic 2023 Nutri-Score calculation for general solid food."""
    data = NutrientData(
        energy_kcal=payload.energy_kcal,
        energy_kj=payload.energy_kj,
        sugars_g=payload.sugars_g,
        added_sugars_g=payload.added_sugars_g,
        sat_fat_g=payload.sat_fat_g,
        sodium_mg=payload.sodium_mg,
        salt_g=payload.salt_g,
        fiber_g=payload.fiber_g,
        protein_g=payload.protein_g,
        fvl_cocoa_percent=payload.fvl_cocoa_percent,
        trans_fat_g=payload.trans_fat_g
    )
    return calculator.calculate(data)


@app.get("/api/barcode/{barcode_number}")
def get_product_by_barcode(barcode_number: str):
    """Lookup product nutritional specs by barcode and calculate Nutri-Score."""
    product = BarcodeService.lookup_barcode(barcode_number)
    if not product:
        raise HTTPException(status_code=444, detail=f"Barcode '{barcode_number}' not found in database.")

    data = NutrientData(
        energy_kcal=product["energy_kcal"],
        sugars_g=product["sugars_g"],
        added_sugars_g=product.get("added_sugars_g"),
        sat_fat_g=product["sat_fat_g"],
        sodium_mg=product["sodium_mg"],
        fiber_g=product["fiber_g"],
        protein_g=product["protein_g"],
        fvl_cocoa_percent=product["fvl_cocoa_percent"]
    )

    nutri_result = calculator.calculate(data)

    # Scan additives if ingredients text is available
    additives = []
    if product.get("ingredients_text"):
        parsed = ocr_engine.parse_fssai_text(product["ingredients_text"])
        additives = parsed.detected_additives

    return {
        "product_info": {
            "name": product["product_name"],
            "brand": product["brand"],
            "image_url": product.get("image_url", ""),
            "ingredients_text": product.get("ingredients_text", ""),
            "barcode": barcode_number
        },
        "nutrients": data,
        "nutri_score": nutri_result,
        "additives": additives,
        "source": product.get("source", "external")
    }


@app.get("/api/benchmarks")
def get_indian_benchmarks():
    """Return pre-configured Indian brand benchmark products for rapid UI testing."""
    benchmarks = []
    for code, prod in BarcodeService.LOCAL_INDIAN_PRODUCTS.items():
        data = NutrientData(
            energy_kcal=prod["energy_kcal"],
            sugars_g=prod["sugars_g"],
            added_sugars_g=prod.get("added_sugars_g"),
            sat_fat_g=prod["sat_fat_g"],
            sodium_mg=prod["sodium_mg"],
            fiber_g=prod["fiber_g"],
            protein_g=prod["protein_g"],
            fvl_cocoa_percent=prod["fvl_cocoa_percent"]
        )
        score = calculator.calculate(data)
        additives = ocr_engine.parse_fssai_text(prod["ingredients_text"]).detected_additives
        benchmarks.append({
            "barcode": code,
            "product_name": prod["product_name"],
            "brand": prod["brand"],
            "nutrients": data,
            "nutri_score": score,
            "additives": additives,
            "ingredients": prod["ingredients_text"]
        })
    return benchmarks
