"""
Unit Tests for Composite Perception Score Formulation (FR-PER-03)
S_perception = Sum_{i=1}^7 w_i * s_i * (1 - U_i)
"""
from app.perception.composite_score import PerceptionScoringEngine

def test_composite_scoring_calculation():
    res = PerceptionScoringEngine.calculate(
        entity_raw=88.0,
        sov_raw=84.5,
        citation_raw=79.0,
        category_raw=91.0,
        fact_raw=86.0,
        sentiment_raw=92.0,
        trust_raw=95.0
    )
    assert len(res.dimensions) == 7
    assert 80.0 <= res.aggregate_score <= 92.0
    assert res.grade in ["A+", "A", "B"]
    
    # Check that dimensional weights sum to 1.0
    total_weights = sum(d.weight for d in res.dimensions)
    assert abs(total_weights - 1.0) < 1e-4

    # Check uncertainty penalty decreases score
    for d in res.dimensions:
        assert d.penalized_score <= d.raw_score

def test_severe_uncertainty_degrades_score():
    high_uncertainty = {
        "entity_authority": 0.50,
        "generative_sov": 0.50,
        "citation_attributability": 0.50,
        "category_positioning": 0.50,
        "fact_density": 0.50,
        "sentiment_framing": 0.50,
        "trust_compliance": 0.50
    }
    res = PerceptionScoringEngine.calculate(
        entity_raw=100.0,
        sov_raw=100.0,
        citation_raw=100.0,
        category_raw=100.0,
        fact_raw=100.0,
        sentiment_raw=100.0,
        trust_raw=100.0,
        uncertainty_coefficients=high_uncertainty
    )
    # Expected aggregate = 100 * (1 - 0.5) = 50.0
    assert abs(res.aggregate_score - 50.0) < 1.0
    assert res.grade in ["C", "D"]
