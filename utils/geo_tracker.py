import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

class GeoTracker:
    def __init__(self):
        """Initialize the geographical tracking system."""
        self.country_mapping = {
            'USA': 'United States',
            'GBR': 'United Kingdom',
            'CAN': 'Canada',
            'AUS': 'Australia',
            'IND': 'India',
            # Add more mappings as needed
        }
        self.geo_data = defaultdict(lambda: {
            'total_claims': 0,
            'false_claims': 0,
            'trending_topics': defaultdict(int),
            'sources': defaultdict(int)
        })
        self.claim_history = []  # Store claim history

    def track_claim(self, claim: Dict, location: Dict) -> None:
        """Track a claim with its geographical information."""
        country_code = location.get('country', 'Unknown')
        country = self.country_mapping.get(country_code, country_code)

        # Update statistics
        self.geo_data[country]['total_claims'] += 1

        # Track if it's a false claim
        is_false = claim.get('false_claim', False)
        if is_false:
            self.geo_data[country]['false_claims'] += 1

        # Track entities
        for entity, entity_type in claim.get('entities', []):
            self.geo_data[country]['trending_topics'][entity] += 1

        # Track sources
        for source in claim.get('sources', []):
            self.geo_data[country]['sources'][source] += 1

        # Add to claim history
        self.claim_history.append({
            'text': claim['text'],
            'timestamp': datetime.now().isoformat(),
            'location': country,
            'risk_level': claim.get('credibility_score', {}).get('risk_level', 'unknown').upper(),
            'sources': claim.get('sources', []),
            'is_false': is_false
        })

    def get_hotspots(self) -> List[Dict]:
        """Get misinformation hotspots based on tracked data."""
        hotspots = []
        for country, data in self.geo_data.items():
            if data['total_claims'] > 0:
                false_claim_ratio = data['false_claims'] / data['total_claims']
                hotspots.append({
                    'country': country,
                    'total_claims': data['total_claims'],
                    'false_claims': data['false_claims'],
                    'risk_level': self._calculate_risk_level(false_claim_ratio),
                    'trending_topics': dict(data['trending_topics']),
                    'sources': dict(data['sources'])
                })

        return sorted(hotspots, key=lambda x: x['false_claims'], reverse=True)

    def _calculate_risk_level(self, ratio: float) -> str:
        """Calculate risk level based on false claims ratio."""
        if ratio >= 0.7:
            return 'high'
        elif ratio >= 0.4:
            return 'medium'
        return 'low'

    def get_regional_trends(self, country_code: str) -> Optional[Dict]:
        """Get detailed trends for a specific country."""
        # Convert country code to country name
        country = self.country_mapping.get(country_code, country_code)

        data = self.geo_data[country]
        total_claims = data['total_claims']

        # Calculate statistics
        stats = {
            'country': country,
            'total_claims': total_claims,
            'false_claims': data['false_claims'],
            'risk_level': self._calculate_risk_level(
                data['false_claims'] / total_claims if total_claims > 0 else 0
            ),
            'trending_topics': dict(data['trending_topics']),
            'sources': dict(data['sources'])
        }

        return stats

    def get_total_claims(self) -> int:
        """Get total number of claims checked."""
        return len(self.claim_history)

    def get_accuracy_rate(self) -> float:
        """Calculate the accuracy rate of checked claims."""
        if not self.claim_history:
            return 100.0
        false_claims = sum(1 for claim in self.claim_history if claim['is_false'])
        return round((1 - false_claims / len(self.claim_history)) * 100, 1)

    def get_active_countries(self) -> List[str]:
        """Get list of countries with recorded claims."""
        return [country for country, data in self.geo_data.items() 
                if data['total_claims'] > 0]

    def get_recent_claims(self, limit: int = 10) -> List[Dict]:
        """Get the most recent claims."""
        return sorted(self.claim_history, 
                     key=lambda x: x['timestamp'], 
                     reverse=True)[:limit]

    def get_timeline_data(self) -> List[Dict]:
        """Get claims data over time."""
        timeline_data = []
        if not self.claim_history:
            return timeline_data

        # Group claims by date
        daily_claims = defaultdict(lambda: {'true_claims': 0, 'false_claims': 0})
        for claim in self.claim_history:
            date = datetime.fromisoformat(claim['timestamp']).date().isoformat()
            if claim['is_false']:
                daily_claims[date]['false_claims'] += 1
            else:
                daily_claims[date]['true_claims'] += 1

        # Convert to list format
        for date, counts in sorted(daily_claims.items()):
            timeline_data.append({
                'date': date,
                'true_claims': counts['true_claims'],
                'false_claims': counts['false_claims']
            })

        return timeline_data

    def get_trending_topics(self) -> Dict[str, int]:
        """Get overall trending topics."""
        all_topics = defaultdict(int)
        for country_data in self.geo_data.values():
            for topic, count in country_data['trending_topics'].items():
                all_topics[topic] += count

        # Return top 5 topics
        return dict(sorted(all_topics.items(), 
                         key=lambda x: x[1], 
                         reverse=True)[:5])