import json
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for
from flask_cors import CORS
from utils.nlp_processor import ClaimProcessor
from utils.fact_checkers.google_fact_check import GoogleFactChecker
from utils.fact_checkers.aggregator import FactCheckAggregator
from utils.credibility_scorer import CredibilityScorer
from utils.social_monitor import SocialMediaMonitor
from utils.geo_tracker import GeoTracker
from datetime import datetime
from collections import defaultdict

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

claim_processor = ClaimProcessor()
fact_checkers = [GoogleFactChecker()]
fact_checker = FactCheckAggregator(fact_checkers)
credibility_scorer = CredibilityScorer()
social_monitor = SocialMediaMonitor()
geo_tracker = GeoTracker()

@app.route('/')
def home():
    return render_template('landing.html')

@app.route('/features')
def features():
    return redirect(url_for('home', _anchor='features'))

@app.route('/how-it-works')
def how_it_works():
    return redirect(url_for('home', _anchor='how-it-works'))

@app.route('/demo')
def demo():
    return redirect(url_for('home', _anchor='demo'))

@app.route('/about')
def about():
    return redirect(url_for('home', _anchor='about'))

@app.route('/get-started')
def get_started():
    return redirect(url_for('index'))

@app.route('/static/js/tutorial.js')
def serve_tutorial_js():
    return send_from_directory('static/js', 'tutorial.js')

@app.route('/index')
def index():
    return render_template('index.html', include_tutorial=True)

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze text content for fact-checking."""
    try:
        content = request.json.get('content', '')
        location = request.json.get('location', {})

        if not content:
            return jsonify({
                'success': True,
                'results': [{
                    'claim': {'text': 'No content provided'},
                    'credibility_score': {'score': 0.0, 'risk_level': 'high'},
                    'fact_check': None,
                    'reasoning': ['No content to analyze']
                }]
            })

        # Extract claims from the content
        claims = claim_processor.extract_claims(content)
        if not claims:
            return jsonify({
                'success': True,
                'results': [{
                    'claim': {'text': content},
                    'credibility_score': {'score': 0.0, 'risk_level': 'medium'},
                    'fact_check': None,
                    'reasoning': ['No clear claims were detected in the text']
                }]
            })

        # Process all claims
        results = []
        for claim in claims:
            fact_check = fact_checker.verify_claim(claim['text'])

            # Ensure fact_check is a dictionary with required fields
            if not isinstance(fact_check, dict):
                fact_check = {'verified': False, 'sources': [], 'matching_facts': []}

            credibility_result = credibility_scorer.calculate_score(claim, fact_check)

            # Track geographical data if provided
            if location:
                claim_data = {
                    'text': claim['text'],
                    'entities': claim.get('entities', []),
                    'credibility_score': credibility_result,
                    'sources': fact_check.get('sources', []),
                    'false_claim': credibility_result.get('risk_level') == 'high'
                }
                geo_tracker.track_claim(claim_data, location)

            results.append({
                'claim': claim,
                'credibility_score': credibility_result,
                'fact_check': fact_check,
                'reasoning': credibility_result.get('reasoning', [])
            })

        # Format response
        response = {
            'success': True,
            'results': results
        }

        print(f"Analysis response: {response}")  # Debug log
        return jsonify(response)

    except Exception as e:
        print(f"Error processing request: {str(e)}")  # Debug log
        return jsonify({
            'success': False,
            'results': [{
                'claim': {'text': content if 'content' in locals() else 'Error processing request'},
                'credibility_score': {'score': 0.0, 'risk_level': 'high'},
                'fact_check': None,
                'reasoning': [f'An error occurred during analysis: {str(e)}']
            }]
        })

@app.route('/social/tracking', methods=['GET', 'POST'])
def manage_tracking():
    if request.method == 'POST':
        data = request.json
        keyword = data.get('keyword')
        hashtag = data.get('hashtag')
        action = data.get('action', 'add')

        if action == 'add':
            if keyword:
                social_monitor.add_tracking_keyword(keyword)
            if hashtag:
                social_monitor.add_tracking_hashtag(hashtag)
        elif action == 'remove':
            if keyword:
                social_monitor.remove_tracking_keyword(keyword)
            if hashtag:
                social_monitor.remove_tracking_hashtag(hashtag)

        return jsonify({'success': True, 'tracked_terms': social_monitor.get_tracked_terms()})

    return jsonify(social_monitor.get_tracked_terms())

@app.route('/social/monitor', methods=['GET'])
def get_social_updates():
    try:
        monitored_content = social_monitor.monitor_social_media()
        trends = social_monitor.analyze_social_trends(monitored_content)

        return jsonify({
            'success': True,
            'content': monitored_content,
            'trends': trends
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/geo/country/<country>', methods=['GET'])
def get_country_trends(country):
    try:
        trends = geo_tracker.get_regional_trends(country)

        if trends:
            print(f"Country trends for {country}: {trends}")
            return jsonify({
                'success': True,
                'trends': trends
            })
        else:
            print(f"No trends found for country: {country}")
            return jsonify({
                'success': False,
                'message': 'No data available for this country',
                'trends': {
                    'country': country,
                    'total_claims': 0,
                    'false_claims': 0,
                    'risk_level': 'low',
                    'trending_topics': {},
                    'sources': {}
                }
            })
    except Exception as e:
        print(f"Error getting country trends: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/geo/hotspots', methods=['GET'])
def get_hotspots():
    """Get global misinformation hotspots data."""
    try:
        hotspots = geo_tracker.get_hotspots()
        return jsonify({
            'success': True,
            'hotspots': hotspots
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'hotspots': []  # Return empty list as fallback
        })

@app.route('/dashboard')
def dashboard():
    """Render the personal dashboard page."""
    stats = {
        'total_claims': geo_tracker.get_total_claims(),
        'accuracy_rate': geo_tracker.get_accuracy_rate(),
        'unique_countries': len(geo_tracker.get_active_countries())
    }
    claims = geo_tracker.get_recent_claims(limit=10)
    return render_template('dashboard.html', stats=stats, claims=claims)

@app.route('/dashboard/data')
def dashboard_data():
    """Get data for dashboard charts."""
    try:
        timeline_data = geo_tracker.get_timeline_data()
        topics_data = geo_tracker.get_trending_topics()
        return jsonify({
            'success': True,
            'timeline_data': timeline_data,
            'topics_data': topics_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)