import pytest
from nutri_score import NutriScoreCalculator, NutrientData


@pytest.fixture
def calculator():
    return NutriScoreCalculator()


def test_amul_dark_chocolate_75_cocoa(calculator):
    # Amul Dark Chocolate 75% Cocoa typical 100g values:
    # Energy ~540 kcal (2259 kJ), Sugars ~26g, Sat Fat ~22g, Sodium ~15mg, Fiber ~8g, Protein ~8.5g, Cocoa 75%
    data = NutrientData(
        energy_kcal=540.0,
        sugars_g=26.0,
        sat_fat_g=22.0,
        sodium_mg=15.0,
        fiber_g=8.0,
        protein_g=8.5,
        fvl_cocoa_percent=75.0
    )
    result = calculator.calculate(data)
    # High FVL (75% cocoa gives 2 pts), High Fiber (8g gives 5 pts), High Protein (8.5g gives 5 pts)
    # Even though sat fat & sugar have negative points, positive score balances it significantly better than milk chocolate
    # Under updated Nutri-Score 2023 rules, 75% cocoa receives 2 FVL pts, so N >= 11 (23) caps protein.
    # Score is 16 (Grade D), which is still far healthier than Milk Chocolate's score of 32 (Grade E).
    assert result.grade in ['C', 'D']
    assert result.score < 25
    assert result.score < 30  # Significantly better than milk chocolate (score 32)
    assert result.positive_points['fiber'] == 5
    assert result.positive_points['fvl'] == 2


def test_cadbury_dairy_milk(calculator):
    # Cadbury Dairy Milk typical 100g values:
    # Energy ~530 kcal (2217 kJ), Sugars ~57g, Sat Fat ~18g, Sodium ~150mg, Fiber ~1.5g, Protein ~7.5g, Cocoa ~15%
    data = NutrientData(
        energy_kcal=530.0,
        sugars_g=57.0,
        sat_fat_g=18.0,
        sodium_mg=150.0,
        fiber_g=1.5,
        protein_g=7.5,
        fvl_cocoa_percent=15.0
    )
    result = calculator.calculate(data)
    # Extreme sugar penalty (57g > 52.5g -> 15 pts N), Energy (6 pts), Sat Fat (10 pts)
    # Total N = 6 + 15 + 10 + 1 = 32 (>= 11). Since FVL < 40%, FVL pts = 0. Protein is CAPPED (0 pts count).
    assert result.grade == 'E'
    assert result.protein_capped is True
    assert result.negative_points['sugars'] == 15
    assert result.negative_points['sat_fat'] == 10


def test_plain_rolled_oats(calculator):
    # Plain Rolled Oats typical 100g values:
    # Energy ~370 kcal (1548 kJ), Sugars ~1g, Sat Fat ~1.2g, Sodium ~5mg, Fiber ~10g, Protein ~12g
    data = NutrientData(
        energy_kcal=370.0,
        sugars_g=1.0,
        sat_fat_g=1.2,
        sodium_mg=5.0,
        fiber_g=10.0,
        protein_g=12.0,
        fvl_cocoa_percent=0.0
    )
    result = calculator.calculate(data)
    assert result.grade == 'A'
    assert result.score <= -1


def test_kurkure_masala_munch(calculator):
    # Kurkure Masala Munch typical 100g values:
    # Energy ~510 kcal (2133 kJ), Sugars ~3g, Sat Fat ~10g, Sodium ~850mg, Fiber ~2g, Protein ~6g
    data = NutrientData(
        energy_kcal=510.0,
        sugars_g=3.0,
        sat_fat_g=10.0,
        sodium_mg=850.0,
        fiber_g=2.0,
        protein_g=6.0,
        fvl_cocoa_percent=0.0
    )
    result = calculator.calculate(data)
    assert result.grade in ['D', 'E']
    assert result.negative_points['sodium'] >= 9
