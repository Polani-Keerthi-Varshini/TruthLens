// Check if we're in a Chrome extension context
const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;

// Listen for right-click (context menu) events
document.addEventListener('mouseup', function(event) {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText && isExtension) {
        try {
            // Send selected text to background script
            chrome.runtime.sendMessage({
                type: 'textSelected',
                text: selectedText
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Error sending message:', chrome.runtime.lastError);
                }
            });
        } catch (error) {
            console.error('Error in content script:', error);
        }
    }
});

// Listen for messages from popup or background script
if (isExtension) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        try {
            if (request.type === 'getSelectedText') {
                const selectedText = window.getSelection().toString().trim();
                sendResponse({ text: selectedText });
                return true; // Will respond asynchronously
            }
            if (request.type === 'highlightText') {
                try {
                    highlightText(request.text);
                    sendResponse({ success: true });
                } catch (error) {
                    console.error('Error highlighting text:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true; // Will respond asynchronously
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    });
}

// Add highlight functionality
function highlightText(text) {
    try {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.backgroundColor = 'rgba(31, 119, 180, 0.2)';
            span.style.padding = '2px';
            span.style.borderRadius = '2px';
            range.surroundContents(span);
        }
    } catch (error) {
        console.error('Error in highlightText:', error);
    }
}