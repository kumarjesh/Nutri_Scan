import pytest
from ocr_engine import OCREngine


@pytest.fixture
def ocr_engine():
    return OCREngine()


def test_parse_cadbury_fssai_label(ocr_engine):
    sample_text = """
    NUTRITIONAL INFORMATION (Per 100g)
    Energy : 530 kcal
    Protein : 7.5 g
    Carbohydrates : 60.0 g
    Total Sugars : 57.0 g
    Added Sugars : 47.5 g
    Total Fat : 30.0 g
    Saturated Fat : 18.0 g
    Trans Fat : 0.1 g
    Sodium : 150 mg
    Dietary Fibre : 1.5 g
    INGREDIENTS: Sugar, Milk Solids, Cocoa Butter, Cocoa Solids, Emulsifiers (INS 322, INS 476), Contains Added Flavours (Artificial Flavouring Substances - Ethyl Vanillin).
    """
    result = ocr_engine.parse_fssai_text(sample_text)
    assert result.energy_kcal == 530.0
    assert result.sugars_g == 57.0
    assert result.added_sugars_g == 47.5
    assert result.sat_fat_g == 18.0
    assert result.sodium_mg == 150.0
    assert result.protein_g == 7.5
    assert result.fiber_g == 1.5

    # Check additive detection
    additive_names = [a['name'] for a in result.detected_additives]
    assert 'INS 322 (Soy Lecithin)' in additive_names
    assert 'INS 476 (PGPR)' in additive_names


def test_parse_per_serving_scaling(ocr_engine):
    sample_text = """
    Serving Size: 20g
    Per Serving:
    Energy: 100 kcal
    Sugars: 5.0 g
    Saturated Fat: 2.0 g
    Sodium: 40 mg
    Protein: 1.0 g
    Fiber: 0.5 g
    """
    result = ocr_engine.parse_fssai_text(sample_text)
    assert result.is_per_serving is True
    assert result.serving_size_g == 20.0
    # Values scaled by 100/20 = 5x
    assert result.energy_kcal == 500.0
    assert result.sugars_g == 25.0
    assert result.sat_fat_g == 10.0
    assert result.sodium_mg == 200.0


def test_amul_dark_cocoa_detection(ocr_engine):
    sample_text = """
    NUTRITION FACTS (Per 100g)
    Energy: 540 kcal
    Total Sugars: 26.0 g
    Saturated Fat: 22.0 g
    Sodium: 15 mg
    Dietary Fibre: 8.0 g
    Protein: 8.5 g
    INGREDIENTS: Cocoa Solids (75%), Sugar, Cocoa Butter, Permitted Emulsifiers (INS 322).
    """
    result = ocr_engine.parse_fssai_text(sample_text)
    assert result.fvl_cocoa_percent == 75.0
    assert result.fiber_g == 8.0
