# TruthLens Browser Extension

This Chrome extension allows you to fact-check content directly from your web browser using TruthLens AI-powered fact-checking tools.

## Installation Instructions

Since this extension is in development mode, you'll need to install it manually:

1. Download the Extension
   - Download the `browser_extension` folder from this repository
   - Save it to your computer in a location you can easily find

2. Install in Chrome
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar and press Enter
   - Enable "Developer mode" using the toggle switch in the top right corner
   - Click "Load unpacked" button in the top left
   - Navigate to and select the `browser_extension` folder you downloaded
   - The TruthLens extension icon should appear in your browser toolbar

## Using the Extension

1. Right-click Menu
   - Select any text on a webpage
   - Right-click and choose "Fact Check with TruthLens"
   - The extension will analyze the selected text

2. Extension Popup
   - Click the TruthLens icon in your browser toolbar
   - Enter or paste text into the text box
   - Click "Check Facts" to analyze

3. View Results
   - See the credibility score
   - Review matching fact-checks
   - Click source links for more information

## Features

- Real-time credibility scoring
- Direct text input in popup
- Right-click context menu integration
- Highlighted results on webpage
- Source verification
- Cached results for faster repeated checks

## Troubleshooting

If you encounter any issues:
1. Make sure you're connected to the internet
2. Check that the extension is enabled in chrome://extensions
3. Try reloading the webpage
4. If problems persist, try removing and reinstalling the extension

## API Configuration
The extension connects to the TruthLens API endpoint. Update the API URL in:
- `popup.js`
- `background.js`

## Note

This extension is currently in development mode. Future updates will be available through the Chrome Web Store.