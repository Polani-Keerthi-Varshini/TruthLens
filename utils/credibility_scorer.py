from typing import Dict, List

class CredibilityScorer:
    def __init__(self):
        self.score_weights = {
            'source_reliability': 0.4,
            'fact_check_matches': 0.3,
            'claim_confidence': 0.3
        }

    def calculate_score(self, claim_data: Dict, fact_check_results: Dict) -> Dict:
        """Calculate credibility score for a claim."""
        score = 0.0
        reasoning = []

        # Initialize with default values if data is missing
        if not fact_check_results:
            fact_check_results = {'verified': False, 'sources': [], 'matching_facts': []}

        # Source reliability score
        source_score = 0.0
        if fact_check_results.get('verified', False):
            source_score = self._evaluate_sources(fact_check_results.get('sources', []))
            score += source_score * self.score_weights['source_reliability']
            reasoning.append(f"Source reliability: {source_score:.2f}")

        # Fact check matches
        fact_score = 0.0
        matching_facts = fact_check_results.get('matching_facts', [])
        if matching_facts:
            fact_score = min(len(matching_facts) * 0.2, 1.0)
            score += fact_score * self.score_weights['fact_check_matches']
            reasoning.append(f"Fact check matches: {fact_score:.2f}")

        # Claim confidence
        confidence_score = 0.0
        if claim_data and 'confidence' in claim_data:
            confidence_score = float(claim_data.get('confidence', 0))
            score += confidence_score * self.score_weights['claim_confidence']
            reasoning.append(f"Claim confidence: {confidence_score:.2f}")

        # Ensure score is between 0 and 1
        score = max(0.0, min(1.0, score))

        return {
            'score': score,
            'reasoning': reasoning,
            'risk_level': self._get_risk_level(score),
            'source_score': source_score,
            'fact_score': fact_score,
            'confidence_score': confidence_score
        }

    def _evaluate_sources(self, sources: List[str]) -> float:
        """Evaluate reliability of sources."""
        if not sources:
            return 0.0

        # In production, this would check against a database of source reliability scores
        # For now, return a basic score based on having sources
        return min(len(sources) * 0.2, 0.8)

    def _get_risk_level(self, score: float) -> str:
        """Determine risk level based on credibility score."""
        if score >= 0.7:
            return 'low'
        elif score >= 0.4:
            return 'medium'
        else:
            return 'high'