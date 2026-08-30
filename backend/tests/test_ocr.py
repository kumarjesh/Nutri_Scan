import pytest
from ocr_engine import OCREngine


@pytest.fixture
def ocr_engine():
    return OCREngine()


def test_parse_cadbury_fssai_label(ocr_engine):
    sample_text = """
    CADBURY DAIRY MILK CHOCOLATE
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
    assert result.is_valid_chocolate_label is True
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


def test_parse_chocolate_per_serving_scaling(ocr_engine):
    sample_text = """
    NESTLE MUNCH CHOCOLATE WAFER
    Serving Size: 20g
    Per Serving:
    Energy: 100 kcal
    Sugars: 5.0 g
    Saturated Fat: 2.0 g
    Sodium: 40 mg
    Protein: 1.0 g
    Fiber: 0.5 g
    INGREDIENTS: Sugar, Wheat Flour, Palm Oil, Cocoa Solids.
    """
    result = ocr_engine.parse_fssai_text(sample_text)
    assert result.is_valid_chocolate_label is True
    assert result.is_per_serving is True
    assert result.serving_size_g == 20.0
    # Values scaled by 100/20 = 5x
    assert result.energy_kcal == 500.0
    assert result.sugars_g == 25.0
    assert result.sat_fat_g == 10.0
    assert result.sodium_mg == 200.0


def test_amul_dark_cocoa_detection(ocr_engine):
    sample_text = """
    AMUL DARK CHOCOLATE
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
    assert result.is_valid_chocolate_label is True
    assert result.fvl_cocoa_percent == 75.0
    assert result.fiber_g == 8.0


def test_reject_random_keyboard_and_desktop_objects(ocr_engine):
    """Ensure random images (e.g. mousepad shortcuts, book, screen) are rejected and not hallucinated."""
    shortcuts_text = """
    PTT SHORTCUTS
    Ctrl+I Italic
    Ctrl+U Underline
    Shift+F2
    Ctrl+K Hyperlink
    Shift+F3
    Repeatlast action
    Show or hide the guides
    Start the presentation from the current slide
    Ctrl+G
    Ctrl+;
    Ctrl+9
    Ctrl+0
    """
    result = ocr_engine.parse_fssai_text(shortcuts_text)
    assert result.is_valid_chocolate_label is False
    assert "Non-food object" in result.validation_error or "No chocolate" in result.validation_error


def test_reject_non_chocolate_kurkure_and_chips(ocr_engine):
    """Ensure Kurkure, chips, juices, and namkeen are strictly rejected."""
    kurkure_text = """
    KURKURE MASALA MUNCH
    NUTRITIONAL INFORMATION Per 100g:
    Energy: 558 kcal
    Protein: 6.0 g
    Carbohydrate: 54.2 g
    Total Sugars: 2.0 g
    Total Fat: 35.2 g
    Saturated Fat: 16.0 g
    Sodium: 870 mg
    INGREDIENTS: Rice Meal, Edible Vegetable Oil (Palmolein), Corn Meal, Gram Meal, Spices and Condiments (Chilli Powder, Onion Powder, Garlic Powder, Coriander Powder).
    """
    result = ocr_engine.parse_fssai_text(kurkure_text)
    assert result.is_valid_chocolate_label is False
    assert "Non-chocolate food detected" in result.validation_error


def test_reject_fruit_juice_beverage(ocr_engine):
    """Ensure fruit juices and soft drinks are strictly rejected."""
    juice_text = """
    REAL FRUIT JUICE MANGO
    NUTRITIONAL FACTS Per 100ml:
    Energy: 56 kcal
    Carbohydrates: 14 g
    Total Sugars: 13.5 g
    Protein: 0.1 g
    Fat: 0 g
    INGREDIENTS: Water, Mango Pulp, Sugar, Acidity Regulator (INS 330), Antioxidant (INS 300).
    """
    result = ocr_engine.parse_fssai_text(juice_text)
    assert result.is_valid_chocolate_label is False
    assert "Non-chocolate food detected" in result.validation_error
