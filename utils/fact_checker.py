import requests
from typing import Dict, List, Optional
import time
import json
from datetime import datetime, timedelta
import os

class FactCheckAPI:
    def __init__(self, name: str, base_url: str, api_key: Optional[str] = None):
        self.name = name
        self.base_url = base_url
        self.api_key = api_key
        self.last_request_time = None
        self.rate_limit_delay = 1.0  # Seconds between requests

    def check_rate_limit(self):
        """Implement basic rate limiting."""
        if self.last_request_time:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.rate_limit_delay:
                time.sleep(self.rate_limit_delay - elapsed)
        self.last_request_time = time.time()

class GoogleFactCheckAPI(FactCheckAPI):
    def __init__(self):
        api_key = os.getenv('GOOGLE_FACT_CHECK_API_KEY')
        if not api_key:
            print("Warning: GOOGLE_FACT_CHECK_API_KEY not found in environment variables")

        super().__init__(
            name="Google Fact Check",
            base_url="https://factchecktools.googleapis.com/v1alpha1/claims:search",
            api_key=api_key
        )

    def verify_claim(self, claim: str) -> Dict:
        """Verify a claim using Google's Fact Check API."""
        try:
            if not self.api_key:
                return {
                    'found': False,
                    'message': 'API key not configured',
                    'source': self.name
                }

            self.check_rate_limit()

            # Clean and encode the claim text
            clean_claim = claim.strip().replace('.', '')  # Remove periods that might affect the query

            params = {
                'query': clean_claim,
                'key': self.api_key,
                'languageCode': 'en'
            }

            response = requests.get(self.base_url, params=params)

            if response.status_code == 400:
                return {
                    'found': False,
                    'message': 'Invalid request format',
                    'source': self.name
                }

            response.raise_for_status()
            data = response.json()

            if not data or not data.get('claims'):
                return {
                    'found': False,
                    'message': 'No fact checks found',
                    'source': self.name
                }

            claims = []
            for claim_review in data.get('claims', []):
                claims.append({
                    'text': claim_review.get('text', ''),
                    'rating': claim_review.get('rating', {}).get('textualRating', 'Unknown'),
                    'url': claim_review.get('claimReview', [{}])[0].get('url', ''),
                    'publisher': claim_review.get('claimReview', [{}])[0].get('publisher', {}).get('name', 'Unknown')
                })

            return {
                'found': True,
                'claims': claims,
                'source': self.name
            }

        except requests.exceptions.RequestException as e:
            print(f"Google Fact Check API error: {str(e)}")
            return {
                'found': False,
                'message': 'Service temporarily unavailable',
                'source': self.name
            }

class MockFactCheckAPI(FactCheckAPI):
    """Fallback mock API when real services are unavailable."""
    def __init__(self):
        super().__init__(
            name="Local Database",
            base_url=None
        )

    def verify_claim(self, claim: str) -> Dict:
        """Provide basic fact checking from local database."""
        # Simple keyword-based matching for demonstration
        example_facts = {
            'vaccine': {
                'text': 'Claims about vaccines containing microchips are false.',
                'rating': 'False',
                'url': 'https://www.example.com/facts/vaccines',
                'publisher': 'Fact Check Database'
            },
            'moon': {
                'text': 'While the Moon has ice deposits, there are no vast liquid oceans under its surface.',
                'rating': 'False',
                'url': 'https://www.example.com/facts/moon',
                'publisher': 'Space Facts Database'
            }
        }

        matching_facts = []
        claim_lower = claim.lower()

        for keyword, fact in example_facts.items():
            if keyword in claim_lower:
                matching_facts.append(fact)

        return {
            'found': len(matching_facts) > 0,
            'claims': matching_facts,
            'source': self.name
        }

class SnopesAPI(FactCheckAPI):
    def __init__(self):
        super().__init__(
            name="Snopes",
            base_url="https://www.snopes.com/api/search"
        )

    def verify_claim(self, claim: str) -> Dict:
        """Search Snopes for fact checks."""
        try:
            self.check_rate_limit()

            params = {
                'query': claim
            }

            response = requests.get(self.base_url, params=params)
            response.raise_for_status()

            data = response.json()

            if not data.get('posts', []):
                return {
                    'found': False,
                    'message': 'No fact checks found'
                }

            fact_checks = []
            for post in data.get('posts', []):
                fact_checks.append({
                    'title': post.get('title', ''),
                    'rating': post.get('rating', 'Unknown'),
                    'url': post.get('link', ''),
                    'publisher': 'Snopes'
                })

            return {
                'found': True,
                'claims': fact_checks,
                'source': self.name
            }

        except requests.exceptions.RequestException as e:
            return {
                'error': f"API request failed: {str(e)}",
                'found': False,
                'source': self.name
            }

class FactChecker:
    def __init__(self):
        """Initialize fact-checking services."""
        self.services = [
            GoogleFactCheckAPI(),
            MockFactCheckAPI()  # Fallback service
        ]
        self.cache = {}
        self.cache_duration = timedelta(hours=24)

    def _check_cache(self, claim: str) -> Optional[Dict]:
        """Check if we have a cached result for this claim."""
        if claim in self.cache:
            timestamp, result = self.cache[claim]
            if datetime.now() - timestamp < self.cache_duration:
                return result
            del self.cache[claim]
        return None

    def _update_cache(self, claim: str, result: Dict):
        """Update the cache with new results."""
        self.cache[claim] = (datetime.now(), result)

    def verify_claim(self, claim: str) -> Dict:
        """Verify a claim against multiple fact-checking services."""
        # Check cache first
        cached_result = self._check_cache(claim)
        if cached_result:
            return cached_result

        results = {
            'verified': False,
            'sources': [],
            'matching_facts': [],
            'status': 'unverified'
        }

        try:
            for service in self.services:
                service_result = service.verify_claim(claim)

                if service_result.get('found', False):
                    results['verified'] = True
                    results['sources'].append(service.name)
                    results['matching_facts'].extend(service_result.get('claims', []))
                    results['status'] = 'verified'

                if service_result.get('message'):
                    print(f"Message from {service.name}: {service_result['message']}")

            # Cache the results
            self._update_cache(claim, results)

            return results

        except Exception as e:
            print(f"Error in fact checking: {str(e)}")
            results['status'] = 'error'
            results['error'] = 'Error processing fact check request'
            return results