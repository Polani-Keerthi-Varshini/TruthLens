from typing import Dict, List
from .base import BaseFactChecker, FactCheckResult
import logging

class FactCheckAggregator:
    """Aggregates results from multiple fact checking services."""

    def __init__(self, fact_checkers: List[BaseFactChecker]):
        """Initialize with list of fact checkers."""
        self.fact_checkers = fact_checkers
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        if not fact_checkers:
            self.logger.warning("No fact checkers provided to aggregator")

    def verify_claim(self, claim_text: str) -> Dict:
        """
        Verify a claim using all available fact checking services.

        Args:
            claim_text: The text of the claim to verify

        Returns:
            Dict containing aggregated results from all fact checkers
        """
        self.logger.info(f"Starting verification of claim: {claim_text[:100]}...")

        all_results = []
        combined_sources = set()
        combined_facts = []
        overall_confidence = 0.0
        successful_checks = 0
        errors = []

        for checker in self.fact_checkers:
            try:
                self.logger.info(f"Using fact checker: {checker.__class__.__name__}")
                result = checker.verify_claim(claim_text)
                all_results.append(result)

                if result['status'] == 'success':
                    successful_checks += 1
                    combined_sources.update(result['sources'])
                    combined_facts.extend(result['matching_facts'])
                    overall_confidence += result['confidence']
                elif result['status'] == 'error':
                    errors.append(f"{checker.__class__.__name__}: {result.get('error', 'Unknown error')}")

            except Exception as e:
                self.logger.error(f"Error with fact checker {checker.__class__.__name__}: {str(e)}")
                errors.append(f"{checker.__class__.__name__}: {str(e)}")

        # Calculate aggregate confidence
        if successful_checks > 0:
            overall_confidence /= successful_checks
            self.logger.info(f"Successfully aggregated results from {successful_checks} checkers")
        else:
            self.logger.warning("No successful fact checks")
            return FactCheckResult(
                verified=False,
                status="error",
                error="All fact checkers failed: " + "; ".join(errors)
            ).to_dict()

        # Create aggregate result
        return FactCheckResult(
            verified=successful_checks > 0,
            matching_facts=self._deduplicate_facts(combined_facts),
            sources=list(combined_sources),
            confidence=overall_confidence,
            status="success" if successful_checks > 0 else "error",
            error=None if successful_checks > 0 else "; ".join(errors)
        ).to_dict()

    def _deduplicate_facts(self, facts: List[Dict]) -> List[Dict]:
        """Remove duplicate fact check results based on URL and content."""
        seen_urls = set()
        unique_facts = []

        for fact in facts:
            url = fact.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_facts.append(fact)
            elif not url and fact not in unique_facts:
                unique_facts.append(fact)

        return unique_facts

    def get_available_checkers(self) -> List[Dict]:
        """Get information about all available fact checkers."""
        return [checker.get_source_info() for checker in self.fact_checkers]