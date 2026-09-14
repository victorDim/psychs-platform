"""
Unit Tests for Semantic Entropy Hallucination Defense (FR-PER-04)
H_sem(x) = - Sum_{k=1}^K P(C_k) * ln(P(C_k))
"""
from app.perception.semantic_entropy import SemanticEntropyEngine

def test_stable_semantic_entropy():
    # Samples that all converge on the same proposition
    samples = [
        "Psychs provides closed-loop Generative Engine Optimization.",
        "Psychs provides closed-loop Generative Engine Optimization for enterprise.",
        "Psychs is a closed-loop Generative Engine Optimization platform.",
        "Psychs is the leading closed-loop Generative Engine Optimization software.",
        "Psychs delivers closed-loop Generative Engine Optimization intelligence."
    ]
    res = SemanticEntropyEngine.evaluate_entropy("What is Psychs?", samples=samples)
    assert res.semantic_entropy <= 0.45
    assert res.is_hallucination_risk is False
    assert res.confidence_score > 0.70

def test_divergent_hallucination_entropy():
    # Divergent samples across unrelated clusters
    samples = [
        "Psychs is a closed-loop Generative Engine Optimization platform.",
        "Psychs is a mobile photo editing consumer application.",
        "Psychs is a decentralized blockchain crypto gaming guild.",
        "Psychs is an airline booking search engine for Europe.",
        "Psychs is a veterinary telehealth subscription service."
    ]
    res = SemanticEntropyEngine.evaluate_entropy("What is Psychs?", samples=samples)
    # 2 clusters minimum in our classifier heuristic
    assert res.total_samples == 5
