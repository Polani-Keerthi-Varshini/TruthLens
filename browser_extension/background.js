// Create context menu item
chrome.runtime.onInstalled.addListener(function() {
    // Set default API endpoint for development
    chrome.storage.local.set({
        'apiEndpoint': 'https://3ca07954-0922-4e21-bc41-b6f08b5b7439-00-tulse2fj8yli.worf.replit.dev/analyze'
    });

    // Create context menu
    chrome.contextMenus.create({
        id: 'factCheck',
        title: 'Fact Check with TruthLens',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === 'factCheck' && info.selectionText) {
        // Store selected text and open popup
        chrome.storage.local.set({ 
            'selectedText': info.selectionText 
        }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error storing selected text:', chrome.runtime.lastError);
            } else {
                chrome.action.openPopup();
            }
        });
    }
});

// Listen for selected text from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'textSelected' && request.text) {
        chrome.storage.local.set({ 
            'selectedText': request.text 
        }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error storing selected text:', chrome.runtime.lastError);
            }
        });
    }
});

// Cache management
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_SIZE = 100; // Maximum number of cached items

function cleanCache() {
    if (cache.size > MAX_CACHE_SIZE) {
        const now = Date.now();
        // Remove expired entries and oldest entries if still over size
        for (const [key, {timestamp}] of cache.entries()) {
            if (now - timestamp > CACHE_DURATION) {
                cache.delete(key);
            }
        }
        // If still over size, remove oldest entries
        if (cache.size > MAX_CACHE_SIZE) {
            const sortedEntries = Array.from(cache.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp);
            for (let i = 0; i < sortedEntries.length - MAX_CACHE_SIZE; i++) {
                cache.delete(sortedEntries[i][0]);
            }
        }
    }
}

async function checkFactsWithCache(text) {
    cleanCache();

    if (cache.has(text)) {
        const { result, timestamp } = cache.get(text);
        if (Date.now() - timestamp < CACHE_DURATION) {
            return result;
        }
        cache.delete(text);
    }

    try {
        const result = await checkFacts(text);
        cache.set(text, {
            result,
            timestamp: Date.now()
        });
        return result;
    } catch (error) {
        console.error('Error checking facts:', error);
        throw error;
    }
}

async function checkFacts(text) {
    const apiEndpoint = await new Promise(resolve => {
        chrome.storage.local.get('apiEndpoint', data => {
            resolve(data.apiEndpoint || 'https://3ca07954-0922-4e21-bc41-b6f08b5b7439-00-tulse2fj8yli.worf.replit.dev/analyze');
        });
    });

    console.log('Making request to:', apiEndpoint); // Debug log

    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data); // Debug log
    return data;
}