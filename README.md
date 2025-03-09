#TruthLens - AI Fact Checker
##Overview
TruthLens is an AI-powered fact-checking tool that helps users verify claims in real-time by leveraging natural language processing (NLP), multi-source cross-verification, and credibility scoring. It aims to combat misinformation by providing transparent, data-backed insights into online content.

#Core Features
1. Real-Time Claim Detection & Extraction

Extracts key claims and facts from social media posts, news articles, and online content
Uses NLP techniques like Named Entity Recognition (NER) and ClaimSpotting

2. Credibility Score Generation

Assigns a credibility score based on:

Source trustworthiness
Cross-verification results
Historical accuracy of the source
Displays verified fact-check links, sources, and AI reasoning behind the score

3. Evidence Dashboard

Side-by-side comparison: Claim vs Verified Data
Links to verified sources
Visual credibility indicators (color-coded risk levels: Green, Yellow, Red)

4. Claim Timeline Tracking

Tracks the evolution of claims over time
Shows how claims started, spread, and how narratives shifted
Helps expose manipulated trends and fake campaigns

5. Trend Analysis & Misinformation Heatmap

Analyzes which topics/categories attract the most fake news (elections, health, finance, etc.)
Provides geographical heat maps of misinformation spread

6. Browser Extension

Chrome extension for fact-checking claims directly from the browser
Automatically alerts users when they encounter suspicious content

Installation & Setup
Prerequisites

Python 3.x
Chrome Extension API (if using the browser extension)

#Steps to Run Locally

Clone the repository:
Copygit clone https://github.com/your-username/TruthLens.git
cd TruthLens

Install dependencies:
Copypip install -r requirements.txt

Run the application:
Copypython app.py

#License
TruthLens is licensed under the MIT License.
