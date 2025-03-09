document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('content');
    const checkButton = document.getElementById('check');
    const loadingDiv = document.querySelector('.loading');
    const resultsDiv = document.querySelector('.results');
    const scoreDiv = document.querySelector('.score');
    const detailsDiv = document.querySelector('.details');

    // Get API endpoint from storage or use default
    let apiEndpoint = 'https://3ca07954-0922-4e21-bc41-b6f08b5b7439-00-tulse2fj8yli.worf.replit.dev/analyze';

    // Verify we're in extension context
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get('apiEndpoint', function(data) {
            if (data.apiEndpoint) {
                apiEndpoint = data.apiEndpoint;
            }
        });

        // Get selected text from storage when popup opens
        chrome.storage.local.get('selectedText', function(data) {
            if (data.selectedText) {
                textarea.value = data.selectedText;
                // Clear the stored text
                chrome.storage.local.remove('selectedText');
            }
        });

        // Try to get selected text from active tab if storage is empty
        if (!textarea.value) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    try {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'getSelectedText'
                        }, function(response) {
                            if (!chrome.runtime.lastError && response && response.text) {
                                textarea.value = response.text;
                            }
                        });
                    } catch (error) {
                        console.error('Error getting selected text:', error);
                    }
                }
            });
        }
    }

    // Update the score display section
    function displayResults(data) {
        console.log('Displaying results:', data); // Debug log

        if (!data || !data.results || !data.results[0]) {
            scoreDiv.textContent = 'Error: No results available';
            detailsDiv.innerHTML = '<p>Could not analyze the content.</p>';
            return;
        }

        const result = data.results[0];
        const score = result.credibility_score ? parseFloat(result.credibility_score.score) || 0 : 0;
        scoreDiv.textContent = `Credibility Score: ${Math.round(score * 100)}%`;
        scoreDiv.style.color = score >= 0.7 ? '#28a745' : score >= 0.4 ? '#ffc107' : '#dc3545';

        let detailsHtml = '<ul class="fact-list">';

        // Add reasoning if available
        if (result.reasoning && result.reasoning.length > 0) {
            detailsHtml += '<li class="fact-item"><div class="fact-rating">Analysis:</div>';
            result.reasoning.forEach(reason => {
                detailsHtml += `<div class="fact-text">${reason}</div>`;
            });
            detailsHtml += '</li>';
        }

        // Add matching facts if available
        if (result.fact_check && result.fact_check.matching_facts && result.fact_check.matching_facts.length > 0) {
            result.fact_check.matching_facts.forEach(fact => {
                detailsHtml += `
                    <li class="fact-item">
                        <div class="fact-rating">${fact.rating || 'Rating Not Available'}</div>
                        <div class="fact-text">${fact.text || 'No text available'}</div>
                        <div class="fact-source">Source: ${fact.publisher || 'Unknown'}</div>
                        ${fact.url ? `<a href="${fact.url}" target="_blank" class="fact-link">Read more →</a>` : ''}
                    </li>
                `;
            });
        } else {
            detailsHtml += '<li class="fact-item">No direct fact-checks found for this claim.</li>';
        }
        detailsHtml += '</ul>';

        detailsDiv.innerHTML = detailsHtml;
        resultsDiv.style.display = 'block';
    }

    // Update the main event listener
    checkButton.addEventListener('click', async function() {
        const text = textarea.value.trim();
        if (!text) {
            alert('Please enter or select text to fact-check');
            return;
        }

        // Show loading state
        loadingDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
        checkButton.disabled = true;

        try {
            console.log('Sending request to:', apiEndpoint); // Debug log
            // Send to backend API
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Context': 'true',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ content: text })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Received response:', data); // Debug log

            if (data.error) {
                throw new Error(data.error);
            }

            // Display results
            displayResults(data);

            // Try to highlight the text in the webpage if in extension context
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        try {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'highlightText',
                                text: text
                            }, function(response) {
                                if (chrome.runtime.lastError) {
                                    console.log('Could not highlight text:', chrome.runtime.lastError);
                                }
                            });
                        } catch (error) {
                            console.error('Error highlighting text:', error);
                        }
                    }
                });
            }

        } catch (error) {
            detailsDiv.innerHTML = `
                <div class="error">
                    <p>Error: ${error.message}</p>
                    <p>Please try again later or check your internet connection.</p>
                </div>
            `;
            resultsDiv.style.display = 'block';
        }

        // Hide loading state
        loadingDiv.style.display = 'none';
        checkButton.disabled = false;
    });
});