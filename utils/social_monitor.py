import requests
from typing import List, Dict
from datetime import datetime
import time
import json

class SocialMediaMonitor:
    def __init__(self):
        """Initialize the social media monitor."""
        self.tracked_keywords = set()
        self.tracked_hashtags = set()
        self.last_check_time = None
        self.trend_history = []  # Store historical trend data
        self.virality_threshold = 1000  # Threshold for viral content

    def add_tracking_keyword(self, keyword: str):
        """Add a keyword to track."""
        self.tracked_keywords.add(keyword.lower())

    def add_tracking_hashtag(self, hashtag: str):
        """Add a hashtag to track."""
        hashtag = hashtag.strip('#').lower()
        self.tracked_hashtags.add(hashtag)

    def remove_tracking_keyword(self, keyword: str):
        """Remove a keyword from tracking."""
        self.tracked_keywords.discard(keyword.lower())

    def remove_tracking_hashtag(self, hashtag: str):
        """Remove a hashtag from tracking."""
        self.tracked_hashtags.discard(hashtag.strip('#').lower())

    def get_tracked_terms(self) -> Dict[str, List[str]]:
        """Get all currently tracked terms."""
        return {
            'keywords': list(self.tracked_keywords),
            'hashtags': list(self.tracked_hashtags)
        }

    def monitor_social_media(self) -> List[Dict]:
        """Monitor social media for new content matching tracked terms."""
        current_time = datetime.now()
        monitored_content = []

        # Example data - in production, this would make actual API calls
        example_posts = [
            {
                'platform': 'Twitter',
                'content': 'Recent studies show significant climate change impact',
                'author': '@climate_expert',
                'timestamp': current_time.isoformat(),
                'engagement': {
                    'likes': 1200,
                    'shares': 450,
                    'comments': 125
                },
                'matched_terms': ['climate change'],
                'potential_claim': True,
                'sentiment': 'neutral',
                'reach': 15000
            },
            {
                'platform': 'Facebook',
                'content': 'Breaking: NASA announces new findings about Mars atmosphere',
                'author': 'Space News Daily',
                'timestamp': current_time.isoformat(),
                'engagement': {
                    'likes': 3500,
                    'shares': 890,
                    'comments': 234
                },
                'matched_terms': ['NASA', 'Mars'],
                'potential_claim': True,
                'sentiment': 'positive',
                'reach': 25000
            }
        ]

        monitored_content.extend(example_posts)
        self.last_check_time = current_time
        self.update_trend_history(monitored_content)
        return monitored_content

    def analyze_social_trends(self, content: List[Dict]) -> Dict:
        """Analyze trends in monitored social media content."""
        trends = {
            'total_posts': len(content),
            'platforms': {},
            'top_terms': {},
            'engagement_levels': {
                'high': 0,
                'medium': 0,
                'low': 0
            },
            'virality': [],
            'sentiment_distribution': {
                'positive': 0,
                'neutral': 0,
                'negative': 0
            },
            'total_reach': 0
        }

        for post in content:
            # Platform statistics
            platform = post['platform']
            trends['platforms'][platform] = trends['platforms'].get(platform, 0) + 1

            # Track matched terms
            for term in post.get('matched_terms', []):
                trends['top_terms'][term] = trends['top_terms'].get(term, 0) + 1

            # Calculate engagement level
            engagement = post['engagement']
            total_engagement = engagement['likes'] + engagement['shares'] * 2 + engagement['comments'] * 3

            if total_engagement > 1000:
                trends['engagement_levels']['high'] += 1
            elif total_engagement > 100:
                trends['engagement_levels']['medium'] += 1
            else:
                trends['engagement_levels']['low'] += 1

            # Track viral content
            if total_engagement > self.virality_threshold:
                trends['virality'].append({
                    'content': post['content'],
                    'engagement': total_engagement,
                    'platform': platform
                })

            # Track sentiment
            sentiment = post.get('sentiment', 'neutral')
            trends['sentiment_distribution'][sentiment] += 1

            # Track reach
            trends['total_reach'] += post.get('reach', 0)

        return trends

    def update_trend_history(self, content: List[Dict]):
        """Update historical trend data."""
        current_trends = self.analyze_social_trends(content)
        self.trend_history.append({
            'timestamp': datetime.now().isoformat(),
            'trends': current_trends
        })
        # Keep only last 24 hours of trend data
        one_day_ago = time.time() - 86400
        self.trend_history = [
            trend for trend in self.trend_history
            if time.mktime(datetime.fromisoformat(trend['timestamp']).timetuple()) > one_day_ago
        ]

    def get_trend_history(self) -> List[Dict]:
        """Get historical trend data."""
        return self.trend_history

    def get_viral_content(self) -> List[Dict]:
        """Get list of viral content."""
        viral_content = []
        for trend_data in self.trend_history:
            viral_content.extend(trend_data['trends'].get('virality', []))
        return sorted(viral_content, key=lambda x: x['engagement'], reverse=True)[:10]