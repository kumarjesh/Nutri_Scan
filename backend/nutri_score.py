"""
Nutri-Score Calculation Engine (2023/2024 Updated European Algorithm for General Solid Foods)
Localized with Indian Food Market considerations.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class NutrientData(BaseModel):
    """Nutritional metrics normalized to per 100g basis."""
    energy_kcal: float = Field(0.0, description="Energy in kcal per 100g")
    energy_kj: Optional[float] = Field(None, description="Energy in kJ per 100g (auto-computed if None)")
    sugars_g: float = Field(0.0, description="Total sugars in grams per 100g")
    added_sugars_g: Optional[float] = Field(None, description="Added sugars in grams per 100g (Indian FSSAI label)")
    sat_fat_g: float = Field(0.0, description="Saturated fatty acids in grams per 100g")
    sodium_mg: float = Field(0.0, description="Sodium in milligrams per 100g")
    salt_g: Optional[float] = Field(None, description="Salt in grams per 100g (Sodium mg = Salt g * 400)")
    fiber_g: float = Field(0.0, description="Dietary fiber in grams per 100g")
    protein_g: float = Field(0.0, description="Protein in grams per 100g")
    fvl_cocoa_percent: float = Field(0.0, description="Fruit, Vegetable, Legume, Nut & Cocoa % (0 - 100)")
    trans_fat_g: Optional[float] = Field(None, description="Trans fat in grams per 100g")


class NutriScoreResult(BaseModel):
    grade: str                       # 'A', 'B', 'C', 'D', 'E'
    score: int                       # Final integer score (N - P)
    color_hex: str                   # Badge hex color
    color_name: str                  # Human-readable color
    negative_points: Dict[str, int]  # energy, sugars, sat_fat, sodium, total
    positive_points: Dict[str, int]  # fvl, fiber, protein, total
    protein_capped: bool             # True if N >= 11 and protein was excluded
    summary_msg: str                 # Health summary text
    recommendations: list[str]       # Indian market healthier alternative recommendations


class NutriScoreCalculator:
    """
    Deterministic Nutri-Score computation engine based on updated 2023/2024 European algorithm
    for General Solid Foods.
    """

    GRADE_COLORS = {
        'A': ('#008b4c', 'Dark Green', 'Excellent nutritional quality'),
        'B': ('#80bb2d', 'Light Green', 'Good nutritional quality'),
        'C': ('#fecb02', 'Yellow', 'Moderate nutritional quality'),
        'D': ('#ee8100', 'Orange', 'Poor nutritional quality - Consume in moderation'),
        'E': ('#e63e11', 'Dark Red', 'Very poor nutritional quality - High sugar/fat/sodium'),
    }

    @staticmethod
    def get_energy_points(energy_kj: float) -> int:
        """Energy in kJ/100g: 0 to 10 points"""
        thresholds = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
        points = 0
        for t in thresholds:
            if energy_kj > t:
                points += 1
            else:
                break
        return points

    @staticmethod
    def get_sugars_points(sugars_g: float) -> int:
        """Total Sugars in g/100g: 0 to 15 points (Updated 2023 stricter table)"""
        thresholds = [3.4, 6.8, 10.0, 14.0, 17.5, 21.0, 24.5, 28.0, 31.5, 35.0, 38.5, 42.0, 45.5, 49.0, 52.5]
        points = 0
        for t in thresholds:
            if sugars_g > t:
                points += 1
            else:
                break
        return points

    @staticmethod
    def get_sat_fat_points(sat_fat_g: float) -> int:
        """Saturated Fatty Acids in g/100g: 0 to 10 points"""
        thresholds = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
        points = 0
        for t in thresholds:
            if sat_fat_g > t:
                points += 1
            else:
                break
        return points

    @staticmethod
    def get_sodium_points(sodium_mg: float) -> int:
        """Sodium in mg/100g: 0 to 10 points"""
        thresholds = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]
        points = 0
        for t in thresholds:
            if sodium_mg > t:
                points += 1
            else:
                break
        return points

    @staticmethod
    def get_fvl_points(fvl_percent: float) -> int:
        """Fruit, Vegetables, Legumes, Nuts & Cocoa %: 0 to 5 points"""
        if fvl_percent > 80.0:
            return 5
        elif fvl_percent > 60.0:
            return 2
        elif fvl_percent > 40.0:
            return 1
        return 0

    @staticmethod
    def get_fiber_points(fiber_g: float) -> int:
        """Dietary Fiber in g/100g: 0 to 5 points"""
        thresholds = [0.9, 1.9, 2.8, 3.7, 4.7]
        points = 0
        for t in thresholds:
            if fiber_g > t:
                points += 1
            else:
                break
        return points

    @staticmethod
    def get_protein_points(protein_g: float) -> int:
        """Protein in g/100g: 0 to 5 points"""
        thresholds = [1.5, 3.0, 4.5, 6.0, 8.0]
        points = 0
        for t in thresholds:
            if protein_g > t:
                points += 1
            else:
                break
        return points

    def calculate(self, data: NutrientData) -> NutriScoreResult:
        # Convert kcal to kJ if not provided (1 kcal = 4.184 kJ)
        energy_kj = data.energy_kj if data.energy_kj is not None else data.energy_kcal * 4.184

        # Convert salt to sodium if sodium not explicitly provided
        sodium_mg = data.sodium_mg
        if sodium_mg == 0.0 and data.salt_g is not None and data.salt_g > 0:
            sodium_mg = data.salt_g * 400.0

        # Calculate Negative Points (N)
        pts_energy = self.get_energy_points(energy_kj)
        pts_sugars = self.get_sugars_points(data.sugars_g)
        pts_sat_fat = self.get_sat_fat_points(data.sat_fat_g)
        pts_sodium = self.get_sodium_points(sodium_mg)

        total_n = pts_energy + pts_sugars + pts_sat_fat + pts_sodium

        # Calculate Positive Points (P)
        pts_fvl = self.get_fvl_points(data.fvl_cocoa_percent)
        pts_fiber = self.get_fiber_points(data.fiber_g)
        pts_protein = self.get_protein_points(data.protein_g)

        # Protein Capping Rule:
        # If N >= 11, do not count protein points UNLESS FVL points >= 5
        protein_capped = False
        effective_protein_pts = pts_protein

        if total_n >= 11:
            if pts_fvl < 5:
                protein_capped = True
                effective_protein_pts = 0

        total_p = pts_fvl + pts_fiber + effective_protein_pts
        final_score = total_n - total_p

        # Assign Grade A to E
        if final_score <= -1:
            grade = 'A'
        elif 0 <= final_score <= 2:
            grade = 'B'
        elif 3 <= final_score <= 10:
            grade = 'C'
        elif 11 <= final_score <= 18:
            grade = 'D'
        else:
            grade = 'E'

        hex_color, color_name, summary_text = self.GRADE_COLORS[grade]

        # Generate Healthier Alternatives for Indian Market
        recommendations = []
        if grade in ['D', 'E']:
            if data.sugars_g > 25.0:
                recommendations.append("High Sugar Penalty: Look for Amul Dark Chocolate (75%+ Cocoa) or sugar-free dark cocoa alternatives.")
            if data.sat_fat_g > 8.0:
                recommendations.append("High Saturated Fat: Check ingredients for Palm Oil or Vanaspati. Prefer snacks made with groundnut oil or cold-pressed oils.")
            if sodium_mg > 600.0:
                recommendations.append("High Sodium Content: Swap fried salty snacks (chips/namkeen) for un-salted roasted chana, almonds, or makhana.")
            if data.fiber_g < 2.0:
                recommendations.append("Low Dietary Fiber: Choose whole-grain oats or millet-based wafer snacks (ragi/jowar).")
        else:
            recommendations.append("Good choice! This product maintains a balanced nutritional score with low sugar and wholesome ingredients.")

        if data.trans_fat_g and data.trans_fat_g > 0.2:
            recommendations.append("⚠️ Contains Trans Fat (>0.2g): FSSAI recommends limiting trans fats to less than 1% of daily intake.")

        return NutriScoreResult(
            grade=grade,
            score=final_score,
            color_hex=hex_color,
            color_name=color_name,
            negative_points={
                'energy': pts_energy,
                'sugars': pts_sugars,
                'sat_fat': pts_sat_fat,
                'sodium': pts_sodium,
                'total': total_n
            },
            positive_points={
                'fvl': pts_fvl,
                'fiber': pts_fiber,
                'protein': pts_protein,
                'effective_protein': effective_protein_pts,
                'total': total_p
            },
            protein_capped=protein_capped,
            summary_msg=summary_text,
            recommendations=recommendations
        )
