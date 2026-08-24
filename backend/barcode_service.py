"""
Barcode Lookup Service integrating Open Food Facts API with fallback Indian product database.
"""

import requests
from typing import Dict, Any, Optional


class BarcodeService:
    """Queries Open Food Facts API for food products by barcode number."""

    OFF_API_URL = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"

    # Built-in local fallback database for common Indian benchmark products
    LOCAL_INDIAN_PRODUCTS: Dict[str, Dict[str, Any]] = {
        "8901058852309": {
            "product_name": "Cadbury Dairy Milk Chocolate (India)",
            "brand": "Cadbury",
            "energy_kcal": 530.0,
            "sugars_g": 57.0,
            "added_sugars_g": 47.5,
            "sat_fat_g": 18.0,
            "sodium_mg": 150.0,
            "fiber_g": 1.5,
            "protein_g": 7.5,
            "fvl_cocoa_percent": 15.0,
            "ingredients_text": "Sugar, Milk Solids, Cocoa Butter, Cocoa Solids, Emulsifiers (INS 322, INS 476), Flavours.",
            "image_url": "https://images.openfoodfacts.org/images/products/890/105/885/2309/front_en.jpg"
        },
        "8901262010065": {
            "product_name": "Amul Dark Chocolate (75% Cocoa)",
            "brand": "Amul",
            "energy_kcal": 540.0,
            "sugars_g": 26.0,
            "added_sugars_g": 20.0,
            "sat_fat_g": 22.0,
            "sodium_mg": 15.0,
            "fiber_g": 8.0,
            "protein_g": 8.5,
            "fvl_cocoa_percent": 75.0,
            "ingredients_text": "Cocoa Solids (75%), Sugar, Cocoa Butter, Permitted Emulsifiers (INS 322).",
            "image_url": "https://images.openfoodfacts.org/images/products/890/126/201/0065/front_en.jpg"
        },
        "8901058863619": {
            "product_name": "Nestle Munch Wafer",
            "brand": "Nestle",
            "energy_kcal": 480.0,
            "sugars_g": 45.0,
            "sat_fat_g": 16.0,
            "sodium_mg": 110.0,
            "fiber_g": 1.0,
            "protein_g": 5.0,
            "fvl_cocoa_percent": 5.0,
            "ingredients_text": "Sugar, Wheat Flour, Palm Oil, Hydrogenated Fat, Cocoa Solids, INS 322, INS 500.",
            "image_url": "https://images.openfoodfacts.org/images/products/890/105/886/3619/front_en.jpg"
        },
        "8901491100052": {
            "product_name": "Kurkure Masala Munch",
            "brand": "Kurkure",
            "energy_kcal": 510.0,
            "sugars_g": 3.0,
            "sat_fat_g": 10.0,
            "sodium_mg": 850.0,
            "fiber_g": 2.0,
            "protein_g": 6.0,
            "fvl_cocoa_percent": 0.0,
            "ingredients_text": "Rice Meal, Corn Meal, Palmolein Oil, Seasoning (Spices, Salt, Acidity Regulators INS 330).",
            "image_url": "https://images.openfoodfacts.org/images/products/890/149/110/0052/front_en.jpg"
        }
    }

    @classmethod
    def lookup_barcode(cls, barcode: str) -> Optional[Dict[str, Any]]:
        clean_code = barcode.strip()

        # Check local fallback database first for instant response on Indian benchmark items
        if clean_code in cls.LOCAL_INDIAN_PRODUCTS:
            prod = cls.LOCAL_INDIAN_PRODUCTS[clean_code].copy()
            prod['source'] = 'local_indian_db'
            return prod

        # Query Open Food Facts API
        try:
            url = cls.OFF_API_URL.format(barcode=clean_code)
            resp = requests.get(url, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == 1:
                    product = data.get("product", {})
                    nutriments = product.get("nutriments", {})

                    energy_kcal = float(nutriments.get("energy-kcal_100g") or nutriments.get("energy-kcal") or 0.0)
                    sugars_g = float(nutriments.get("sugars_100g") or nutriments.get("sugars") or 0.0)
                    sat_fat_g = float(nutriments.get("saturated-fat_100g") or nutriments.get("saturated-fat") or 0.0)
                    sodium_mg = float(nutriments.get("sodium_100g") or 0.0) * 1000.0 if "sodium_100g" in nutriments else float(nutriments.get("sodium") or 0.0)
                    if sodium_mg == 0 and "salt_100g" in nutriments:
                        sodium_mg = float(nutriments.get("salt_100g") or 0.0) * 400.0

                    fiber_g = float(nutriments.get("fiber_100g") or nutriments.get("fiber") or 0.0)
                    protein_g = float(nutriments.get("proteins_100g") or nutriments.get("proteins") or 0.0)

                    return {
                        "product_name": product.get("product_name", f"Product {clean_code}"),
                        "brand": product.get("brands", "Unknown Brand"),
                        "energy_kcal": energy_kcal,
                        "sugars_g": sugars_g,
                        "added_sugars_g": None,
                        "sat_fat_g": sat_fat_g,
                        "sodium_mg": sodium_mg,
                        "fiber_g": fiber_g,
                        "protein_g": protein_g,
                        "fvl_cocoa_percent": float(product.get("cocoa_100g") or 0.0),
                        "ingredients_text": product.get("ingredients_text", ""),
                        "image_url": product.get("image_url", ""),
                        "source": "open_food_facts"
                    }
        except Exception:
            pass

        return None
