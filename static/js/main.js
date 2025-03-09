console.log('Loading main.js...');

async function analyzeContent() {
    const contentInput = document.getElementById('content-input');
    const loading = document.getElementById('loading');
    const results = document.getElementById('analysis-results');
    const content = contentInput.value.trim();

    if (!content) {
        alert('Please enter some content to analyze');
        return;
    }

    loading.classList.remove('hidden');
    results.classList.add('hidden');

    try {
        const countrySelect = document.getElementById('country-select');
        const selectedCountry = countrySelect ? countrySelect.value : 'United States';

        const location = {
            country: selectedCountry || 'United States',
            region: 'Global'
        };

        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                location
            }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.warning) {
                displayWarning(data.warning);
                // Show API setup tutorial if there's an API-related warning
                if (data.warning.includes('API') || data.warning.includes('authentication')) {
                    tutorialManager.showTutorial('apiSetup');
                }
            } else {
                displayResults(data.results);
                updateGeoData();
            }
        } else {
            throw new Error(data.error || 'Failed to analyze content');
        }
    } catch (error) {
        displayError(error.message);
        // Show API setup tutorial if there's an API-related error
        if (error.message.includes('API') || error.message.includes('authentication')) {
            tutorialManager.showTutorial('apiSetup');
        }
    } finally {
        loading.classList.add('hidden');
    }
}

function displayResults(results) {
    const resultsDiv = document.getElementById('analysis-results');
    resultsDiv.innerHTML = '<h2>Analysis Results</h2>';

    if (!results || !Array.isArray(results)) {
        resultsDiv.innerHTML += '<div class="error">No analysis results available</div>';
        resultsDiv.classList.remove('hidden');
        return;
    }

    results.forEach((result, index) => {
        if (!result || !result.claim) {
            console.error('Invalid result object:', result);
            return;
        }

        const claimDiv = document.createElement('div');
        claimDiv.className = 'claim-result';

        // Create claim content
        const claimContent = document.createElement('div');
        claimContent.className = 'claim-text';
        claimContent.innerHTML = `
            <h3>Claim ${index + 1}</h3>
            <p>${result.claim.text || 'No claim text available'}</p>
        `;

        if (result.claim.entities && Array.isArray(result.claim.entities) && result.claim.entities.length > 0) {
            const entitiesDiv = document.createElement('div');
            entitiesDiv.className = 'entities';
            entitiesDiv.innerHTML = `
                <h4>Key Entities:</h4>
                <ul>
                    ${result.claim.entities.map(([entity, type]) =>
                        `<li>${entity} (${type})</li>`
                    ).join('')}
                </ul>
            `;
            claimContent.appendChild(entitiesDiv);
        }

        claimDiv.appendChild(claimContent);

        // Create and add credibility score section if available
        if (result.credibility_score) {
            const scoreContainer = document.createElement('div');
            scoreContainer.className = 'credibility-score';
            claimDiv.appendChild(scoreContainer);
            updateCredibilityScore(result.credibility_score.score || 0, scoreContainer);
        }

        // Add fact check results if available
        if (result.fact_check) {
            const factCheckDiv = document.createElement('div');
            factCheckDiv.innerHTML = displayFactCheckResults(result.fact_check);
            claimDiv.appendChild(factCheckDiv);
        }

        // Add share buttons
        const shareDiv = document.createElement('div');
        shareDiv.innerHTML = generateShareButtons(index);
        claimDiv.appendChild(shareDiv);

        resultsDiv.appendChild(claimDiv);
    });

    resultsDiv.classList.remove('hidden');
}

function displayFactCheckResults(factCheck) {
    if (!factCheck) {
        return '<div class="warning">⚠️ No fact-check results available</div>';
    }

    let html = '<h4>Fact Check Results</h4>';

    if (factCheck.status === 'error') {
        return html + `<div class="error">Error during fact-checking: ${factCheck.error || 'Unknown error'}</div>`;
    }

    if (factCheck.verified) {
        html += '<div class="verified">✅ Claim has been fact-checked</div>';

        if (factCheck.matching_facts && Array.isArray(factCheck.matching_facts) && factCheck.matching_facts.length > 0) {
            html += `
                <div class="matching-facts">
                    <h5>Related Fact Checks:</h5>
                    <ul class="fact-list">
                        ${factCheck.matching_facts.map(fact => `
                            <li class="fact-item">
                                <div class="fact-text">${fact.text || fact.title || 'No text available'}</div>
                                <div class="fact-rating">Rating: ${fact.rating || 'Unknown'}</div>
                                <div class="fact-source">Source: ${fact.publisher || 'Unknown'}</div>
                                ${fact.url ? `<a href="${fact.url}" target="_blank" class="fact-link">Read More</a>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        if (factCheck.sources && Array.isArray(factCheck.sources) && factCheck.sources.length > 0) {
            html += `
                <div class="sources">
                    <h5>Checked by:</h5>
                    <ul>
                        ${factCheck.sources.map(source => `<li>${source}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    } else {
        html += '<div class="warning">⚠️ No direct fact-checks found for this claim</div>';
    }

    return html;
}

function updateCredibilityScore(score, element) {
    const scoreValue = score * 100;
    const gaugeRotation = (scoreValue / 100) * 180;

    element.innerHTML = `
        <div class="score-gauge-container">
            <div class="score-gauge">
                <div class="gauge-background"></div>
                <div class="gauge-fill" style="transform: rotate(${gaugeRotation}deg)"></div>
                <div class="gauge-center">
                    <div class="score-value">${scoreValue.toFixed(1)}%</div>
                    <div class="score-label">Credibility</div>
                </div>
            </div>
            <div class="score-indicator" style="color: ${getScoreColor(score)}">
                ${getScoreLabel(score)}
            </div>
        </div>
        <div class="score-analysis">
            ${generateScoreFactors(score)}
        </div>
    `;

    animateScore(element);
}

function getScoreLabel(score) {
    if (score >= 0.8) return 'Highly Credible';
    if (score >= 0.6) return 'Mostly Credible';
    if (score >= 0.4) return 'Somewhat Credible';
    if (score >= 0.2) return 'Low Credibility';
    return 'Not Credible';
}

function getScoreColor(score) {
    if (score >= 0.7) return '#28a745';  // Green
    if (score >= 0.4) return '#ffc107';  // Yellow
    return '#dc3545';  // Red
}

function generateScoreFactors(score) {
    const factors = [
        {
            label: 'Source Reliability',
            value: score >= 0.7 ? 'High' : 'Low',
            positive: score >= 0.7
        },
        {
            label: 'Fact Check Matches',
            value: score >= 0.5 ? 'Found' : 'None',
            positive: score >= 0.5
        },
        {
            label: 'Content Analysis',
            value: score >= 0.6 ? 'Valid' : 'Suspicious',
            positive: score >= 0.6
        }
    ];

    return `
        <h4>Analysis Factors</h4>
        ${factors.map(factor => `
            <div class="score-factor">
                <span class="factor-label">${factor.label}</span>
                <span class="factor-value ${factor.positive ? 'positive' : 'negative'}">
                    ${factor.value}
                </span>
            </div>
        `).join('')}
    `;
}

function animateScore(element) {
    const gauge = element.querySelector('.gauge-fill');
    gauge.style.transition = 'transform 1s ease-in-out';
}

function generateShareButtons(index) {
    return `
        <div class="share-section">
            <h4>Share this Fact Check</h4>
            <div class="share-buttons">
                <button onclick="shareResult('twitter', ${index})" class="share-btn twitter">
                    <span>Share on Twitter</span>
                </button>
                <button onclick="shareResult('facebook', ${index})" class="share-btn facebook">
                    <span>Share on Facebook</span>
                </button>
                <button onclick="shareResult('linkedin', ${index})" class="share-btn linkedin">
                    <span>Share on LinkedIn</span>
                </button>
                <button onclick="copyShareLink(${index})" class="share-btn copy-link">
                    <span>Copy Link</span>
                </button>
            </div>
        </div>
    `;
}

function shareResult(platform, resultIndex) {
    const results = document.querySelectorAll('.claim-result');
    const result = results[resultIndex];
    const claimText = result.querySelector('.claim-text p').textContent;
    const credibilityScore = result.querySelector('.score-value').textContent;
    const riskLevel = result.querySelector('.score-indicator').textContent;

    const shareText = `Fact Check Result:\n${claimText}\nCredibility: ${credibilityScore}\n${riskLevel}\nVerified by TruthLens`;
    const shareUrl = window.location.href;

    let shareLink;
    switch (platform) {
        case 'twitter':
            shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            break;
        case 'facebook':
            shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
            break;
        case 'linkedin':
            shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
            break;
    }

    if (shareLink) {
        window.open(shareLink, '_blank', 'width=600,height=400');
    }
}

function copyShareLink(resultIndex) {
    const results = document.querySelectorAll('.claim-result');
    const result = results[resultIndex];
    const claimText = result.querySelector('.claim-text p').textContent;
    const credibilityScore = result.querySelector('.score-value').textContent;
    const riskLevel = result.querySelector('.score-indicator').textContent;

    const shareText = `Fact Check Result:\n${claimText}\nCredibility: ${credibilityScore}\n${riskLevel}\nVerified by TruthLens\n${window.location.href}`;

    navigator.clipboard.writeText(shareText).then(() => {
        const copyButton = result.querySelector('.copy-link');
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<span>Copied!</span>';
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    });
}

function displayWarning(message) {
    const results = document.getElementById('analysis-results');
    results.innerHTML = `<div class="warning">${message}</div>`;
    results.classList.remove('hidden');
}

function displayError(message) {
    const results = document.getElementById('analysis-results');
    results.innerHTML = `<div class="error">Error: ${message}</div>`;
    results.classList.remove('hidden');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');

    // Initialize UI elements
    const analyzeButton = document.getElementById('analyze-btn');
    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeContent);
    }

    // Create analysis results container if it doesn't exist
    let analysisResults = document.getElementById('analysis-results');
    if (!analysisResults) {
        analysisResults = document.createElement('div');
        analysisResults.id = 'analysis-results';
        analysisResults.className = 'hidden';
        document.querySelector('.results-section').appendChild(analysisResults);
    }

    // Initialize monitoring and data updates
    initializeSocialMonitoring();
    updateGeoData();

    // Ensure tutorial manager exists
    console.log('Checking tutorial manager...');
    if (typeof tutorialManager === 'undefined') {
        console.error('Tutorial manager not found! Creating new instance...');
        window.tutorialManager = new TutorialManager();
    }

    // Start tutorials with a slight delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Starting tutorials...');
        // Show fact check tutorial by default
        if (document.getElementById('content-input')) {
            console.log('Showing fact check tutorial...');
            tutorialManager.resetTutorials(); // Clear any previous tutorial states
            tutorialManager.showTutorial('factCheck');
        }
    }, 500);

    // Update geo data periodically
    setInterval(updateGeoData, 60000); // Update every minute

    // Add event listeners for country selection
    const countrySelect = document.getElementById('country-select');
    const analysisCountrySelect = document.getElementById('analysis-country-select');

    if (countrySelect) {
        countrySelect.addEventListener('change', updateCountryView);
    }

    if (analysisCountrySelect) {
        analysisCountrySelect.addEventListener('change', updateRegionalAnalysis);
    }
});

// Social Media Monitoring Functions
async function initializeSocialMonitoring() {
    const monitoringTab = document.getElementById('monitoring-tab');
    if (!monitoringTab) return;

    // Load current tracking terms
    await updateTrackingTerms();

    // Start periodic monitoring
    setInterval(fetchSocialUpdates, 30000); // Check every 30 seconds
}

async function updateTrackingTerms() {
    try {
        const response = await fetch('/social/tracking');
        const data = await response.json();
        displayTrackingTerms(data);
    } catch (error) {
        console.error('Failed to load tracking terms:', error);
    }
}

async function addTrackingTerm(event) {
    event.preventDefault();
    const form = event.target;
    const termType = form.termType.value;
    const termValue = form.termValue.value.trim();

    if (!termValue) return;

    try {
        const response = await fetch('/social/tracking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                [termType]: termValue,
                action: 'add'
            }),
        });

        const data = await response.json();
        if (data.success) {
            displayTrackingTerms(data.tracked_terms);
            form.reset();
        }
    } catch (error) {
        console.error('Failed to add tracking term:', error);
    }
}

async function removeTrackingTerm(type, term) {
    try {
        const response = await fetch('/social/tracking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                [type]: term,
                action: 'remove'
            }),
        });

        const data = await response.json();
        if (data.success) {
            displayTrackingTerms(data.tracked_terms);
        }
    } catch (error) {
        console.error('Failed to remove tracking term:', error);
    }
}

function displayTrackingTerms(terms) {
    const trackingList = document.getElementById('tracking-list');
    if (!trackingList) return;

    trackingList.innerHTML = '';

    if (terms.keywords.length > 0) {
        const keywordSection = document.createElement('div');
        keywordSection.innerHTML = `
            <h4>Keywords</h4>
            <ul>
                ${terms.keywords.map(keyword => `
                    <li>
                        ${keyword}
                        <button onclick="removeTrackingTerm('keyword', '${keyword}')" class="remove-btn">×</button>
                    </li>
                `).join('')}
            </ul>
        `;
        trackingList.appendChild(keywordSection);
    }

    if (terms.hashtags.length > 0) {
        const hashtagSection = document.createElement('div');
        hashtagSection.innerHTML = `
            <h4>Hashtags</h4>
            <ul>
                ${terms.hashtags.map(hashtag => `
                    <li>
                        #${hashtag}
                        <button onclick="removeTrackingTerm('hashtag', '${hashtag}')" class="remove-btn">×</button>
                    </li>
                `).join('')}
            </ul>
        `;
        trackingList.appendChild(hashtagSection);
    }
}

async function fetchSocialUpdates() {
    try {
        const response = await fetch('/social/monitor');
        const data = await response.json();

        if (data.success) {
            displaySocialUpdates(data.content);
            updateTrends(data.trends);
        }
    } catch (error) {
        console.error('Failed to fetch social updates:', error);
    }
}

function displaySocialUpdates(content) {
    const updatesContainer = document.getElementById('social-updates');
    if (!updatesContainer) return;

    content.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'social-post';
        postElement.innerHTML = `
            <div class="post-header">
                <span class="platform">${post.platform}</span>
                <span class="author">${post.author}</span>
                <span class="timestamp">${new Date(post.timestamp).toLocaleString()}</span>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-engagement">
                <span>👍 ${post.engagement.likes}</span>
                <span>🔄 ${post.engagement.shares}</span>
                <span>💬 ${post.engagement.comments}</span>
            </div>
        `;
        updatesContainer.prepend(postElement);
    });

    // Keep only the last 50 posts
    while (updatesContainer.children.length > 50) {
        updatesContainer.removeChild(updatesContainer.lastChild);
    }
}

function updateTrends(trends) {
    const trendsContainer = document.getElementById('social-trends');
    if (!trendsContainer) return;

    trendsContainer.innerHTML = `
        <div class="trend-section">
            <h4>Platform Activity</h4>
            <ul>
                ${Object.entries(trends.platforms).map(([platform, count]) => `
                    <li>${platform}: ${count} posts</li>
                `).join('')}
            </ul>
        </div>
        <div class="trend-section">
            <h4>Top Terms</h4>
            <ul>
                ${Object.entries(trends.top_terms)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([term, count]) => `
                        <li>${term}: ${count} mentions</li>
                    `).join('')}
            </ul>
        </div>
        <div class="trend-section">
            <h4>Engagement Levels</h4>
            <ul>
                <li>High: ${trends.engagement_levels.high}</li>
                <li>Medium: ${trends.engagement_levels.medium}</li>
                <li>Low: ${trends.engagement_levels.low}</li>
            </ul>
        </div>
    `;
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`${tabName}-tab`).classList.add('active');

    const activeButton = Array.from(document.querySelectorAll('.tab-btn')).find(btn =>
        btn.textContent.toLowerCase().includes(tabName.toLowerCase())
    );
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Geographical Data Functions
async function updateCountryView() {
    const countrySelect = document.getElementById('country-select');
    const selectedCountry = countrySelect.value;

    if (!selectedCountry) {
        updateGeoData();
        return;
    }

    try {
        const response = await fetch(`/geo/country/${selectedCountry}`);
        const data = await response.json();

        if (data.success) {
            displayHotspots([data.trends], selectedCountry);
            displayRegionalAnalysis(data.trends);

            const analysisCountrySelect = document.getElementById('analysis-country-select');
            if (analysisCountrySelect) {
                analysisCountrySelect.value = selectedCountry;
            }
        }
    } catch (error) {
        console.error('Failed to fetch country data:', error);
    }
}

async function updateRegionalAnalysis() {
    const countrySelect = document.getElementById('analysis-country-select');
    const selectedCountry = countrySelect.value;

    if (!selectedCountry) {
        const trendsContainer = document.getElementById('regional-trends');
        trendsContainer.innerHTML = '<p>Please select a country for detailed analysis</p>';
        return;
    }

    try {
        const response = await fetch(`/geo/country/${selectedCountry}`);
        const data = await response.json();

        if (data.success) {
            displayRegionalAnalysis(data.trends);
            displayHotspots([data.trends], selectedCountry);

            const mapCountrySelect = document.getElementById('country-select');
            if (mapCountrySelect) {
                mapCountrySelect.value = selectedCountry;
            }
        }
    } catch (error) {
        console.error('Failed to fetch regional analysis:', error);
        const trendsContainer = document.getElementById('regional-trends');
        trendsContainer.innerHTML = '<p>Error loading analysis data</p>';
    }
}

function displayRegionalAnalysis(countryData) {
    const trendsContainer = document.getElementById('regional-trends');

    if (!countryData) {
        trendsContainer.innerHTML = '<p>No data available for selected country</p>';
        return;
    }

    const truthRatio = countryData.total_claims > 0
        ? ((countryData.total_claims - countryData.false_claims) / countryData.total_claims * 100).toFixed(1)
        : 0;

    trendsContainer.innerHTML = `
        <div class="region-stat">
            <div class="stat-group">
                <div class="stat-item">
                    <strong>Total Claims:</strong> ${countryData.total_claims}
                </div>
                <div class="stat-item">
                    <strong>False Claims:</strong> ${countryData.false_claims}
                </div>
                <div class="stat-item">
                    <strong>Truth Ratio:</strong> ${truthRatio}%
                </div>
                <div class="stat-item">
                    <strong>Risk Level:</strong> ${countryData.risk_level.toUpperCase()}
                </div>
            </div>
            ${countryData.trending_topics && Object.keys(countryData.trending_topics).length > 0 ? `
                <div class="trending">
                    <h5>Trending Topics</h5>
                    <div class="topic-list">
                        ${Object.entries(countryData.trending_topics)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([topic, count]) => `
                                <div class="topic-item">
                                    <span class="topic-name">${topic}</span>
                                    <span class="topic-count">${count} mentions</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
            ` : ''}
            ${countryData.sources && Object.keys(countryData.sources).length > 0 ? `
                <div class="sources">
                    <h5>Top Fact-Checking Sources</h5>
                    <div class="source-list">
                        ${Object.entries(countryData.sources)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([source, count]) => `
                                <div class="source-item">
                                    <span class="source-name">${source}</span>
                                    <span class="source-count">${count} verifications</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

async function updateGeoData() {
    try {
        const response = await fetch('/geo/hotspots');
        const data = await response.json();

        if (data.success) {
            displayHotspots(data.hotspots);
        }
    } catch (error) {
        console.error('Failed to fetch geographical data:', error);
    }
}

function displayHotspots(hotspots, focusCountry = null) {
    const mapContainer = document.getElementById('world-map');

    if (!hotspots || hotspots.length === 0) {
        mapContainer.innerHTML = '<p>No geographical data available yet. Try analyzing some claims first.</p>';
        return;
    }


    const mapData = [{
        type: 'choropleth',
        locations: hotspots.map(h => h.country),
        z: hotspots.map(h => h.false_claims),
        text: hotspots.map(h =>
            `${h.country}<br>` +
            `Total Claims: ${h.total_claims}<br>` +
            `False Claims: ${h.false_claims}<br>` +
            `Risk Level: ${h.risk_level.toUpperCase()}`
        ),
        colorscale: 'Reds',
        colorbar: {
            title: 'False Claims',
            thickness: 20
        },
        locationmode: 'ISO-3'
    }];

    const layout = {
        title: focusCountry ? `Misinformation Analysis - ${focusCountry}` : 'Global Misinformation Hotspots',
        geo: {
            showframe: false,
            showcoastlines: true,
            projection: {
                type: 'equirectangular'
            },
            showland: true,
            landcolor: 'rgb(243, 243, 243)',
            showocean: true,
            oceancolor: 'rgb(204, 229, 255)',
            showcountries: true,
            countrycolor: 'rgb(204, 204, 204)'
        },
        margin: {
            l: 0,
            r: 0,
            t: 30,
            b: 0
        }
    };

    if (focusCountry) {
        const zoomSettings = {
            'USA': { center: { lat: 37.0902, lon: -95.7129 }, zoom: 3 },
            'GBR': { center: { lat: 55.3781, lon: -3.4360 }, zoom: 4 },
            'CAN': { center: { lat: 56.1304, lon: -106.3468 }, zoom: 3 },
            'AUS': { center: { lat: -25.2744, lon: 133.7751 }, zoom: 3 },
            'IND': { center: { lat: 20.5937, lon: 78.9629 }, zoom: 3 },
            'CHN': { center: { lat: 35.8617, lon: 104.1954 }, zoom: 3 },
            'JPN': { center: { lat: 36.2048, lon: 138.2529 }, zoom: 4 },
            'DEU': { center: { lat: 51.1657, lon: 10.4515 }, zoom: 4 },
            'FRA': { center: { lat: 46.2276, lon: 2.2137 }, zoom: 4 },
            'BRA': { center: { lat: -14.2350, lon: -51.9253 }, zoom: 3 }
        };

        if (zoomSettings[focusCountry]) {
            layout.geo.center = zoomSettings[focusCountry].center;
            layout.geo.projection.scale = zoomSettings[focusCountry].zoom;
        }
    }

    Plotly.newPlot('world-map', mapData, layout);
}