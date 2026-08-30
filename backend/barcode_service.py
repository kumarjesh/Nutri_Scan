"""
Barcode Lookup Service integrating Open Food Facts API with fallback Indian product database.
Exclusively restricted to Chocolate & Cocoa Confectionery products.
"""

import re
import requests
from typing import Dict, Any, Optional


class BarcodeService:
    """Queries Open Food Facts API for food products by barcode number with strict chocolate validation."""

    OFF_API_URL = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"

    # Built-in local fallback database for common Indian benchmark products (Strictly Chocolates Only)
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
            "product_name": "Nestle Munch Chocolate Wafer",
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
        "8901058852446": {
            "product_name": "Cadbury Bournville Dark Chocolate (50% Cocoa)",
            "brand": "Cadbury",
            "energy_kcal": 535.0,
            "sugars_g": 48.0,
            "added_sugars_g": 42.0,
            "sat_fat_g": 19.5,
            "sodium_mg": 20.0,
            "fiber_g": 6.5,
            "protein_g": 5.5,
            "fvl_cocoa_percent": 50.0,
            "ingredients_text": "Sugar, Cocoa Solids (50%), Cocoa Butter, Milk Solids, Emulsifiers (INS 322, INS 476), Flavours.",
            "image_url": "https://images.openfoodfacts.org/images/products/890/105/885/2446/front_en.jpg"
        }
    }

    CHOCOLATE_KEYWORDS = [
        r'chocolate', r'cocoa', r'cacao', r'choc', r'cadbury', r'amul',
        r'bournville', r'munch', r'kit\s*kat', r'perk', r'5\s*star',
        r'bar\s*one', r'milkybar', r'toblerone', r'ferrero', r'lindt',
        r'galaxy', r'snickers', r'mars', r'twix', r'praline', r'truffle'
    ]

    NON_CHOCOLATE_KEYWORDS = [
        r'kurkure', r'chips', r'namkeen', r'bhujia', r'juice', r'beverage',
        r'soda', r'cola', r'pepsi', r'sprite', r'noodles', r'pasta',
        r'pickle', r'sauce', r'soup', r'lays', r'doritos', r'pringles'
    ]

    @classmethod
    def is_chocolate_product(cls, name: str, categories: str, ingredients: str) -> bool:
        full_text = f"{name} {categories} {ingredients}".lower()

        has_choc = any(re.search(pat, full_text) for pat in cls.CHOCOLATE_KEYWORDS)
        has_non_choc = any(re.search(pat, full_text) for pat in cls.NON_CHOCOLATE_KEYWORDS)

        if has_non_choc and not has_choc:
            return False
        return has_choc

    @classmethod
    def lookup_barcode(cls, barcode: str) -> Optional[Dict[str, Any]]:
        clean_code = barcode.strip()

        # Check local fallback database first for instant response on Indian benchmark items
        if clean_code in cls.LOCAL_INDIAN_PRODUCTS:
            prod = cls.LOCAL_INDIAN_PRODUCTS[clean_code].copy()
            prod['source'] = 'local_indian_db'
            prod['is_chocolate'] = True
            return prod

        # Query Open Food Facts API
        try:
            url = cls.OFF_API_URL.format(barcode=clean_code)
            resp = requests.get(url, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == 1:
                    product = data.get("product", {})
                    product_name = product.get("product_name", f"Product {clean_code}")
                    categories = product.get("categories", "")
                    ingredients_text = product.get("ingredients_text", "")

                    # Strict Chocolate Validation
                    if not cls.is_chocolate_product(product_name, categories, ingredients_text):
                        return {
                            "is_chocolate": False,
                            "product_name": product_name,
                            "error": f"Product '{product_name}' is not a chocolate item. NutriScan AI is strictly restricted to chocolates."
                        }

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
                        "is_chocolate": True,
                        "product_name": product_name,
                        "brand": product.get("brands", "Unknown Brand"),
                        "energy_kcal": energy_kcal,
                        "sugars_g": sugars_g,
                        "added_sugars_g": None,
                        "sat_fat_g": sat_fat_g,
                        "sodium_mg": sodium_mg,
                        "fiber_g": fiber_g,
                        "protein_g": protein_g,
                        "fvl_cocoa_percent": float(product.get("cocoa_100g") or 0.0),
                        "ingredients_text": ingredients_text,
                        "image_url": product.get("image_url", ""),
                        "source": "open_food_facts"
                    }
        except Exception:
            pass

        return None
