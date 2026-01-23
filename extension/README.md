# Second Brain Browser Extension

Browser extension for capturing thoughts and ideas from any webpage to your Second Brain.

## Installation

### Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` directory

### Firefox
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file in the `extension` directory

## Setup

1. Open the extension options page (right-click extension icon → Options)
2. Enter your Second Brain API base URL (default: http://localhost:3000)
3. Enter your auth token (get this from your Second Brain account settings)
4. Save settings

## Usage

### Quick Capture
1. Click the extension icon in your browser toolbar
2. Type your thought in the popup
3. Click "Capture"

### Capture Selected Text
1. Select text on any webpage
2. Right-click and select "Capture to Second Brain"
3. The selected text will be captured with page context

## Features

- Quick capture popup
- Context-aware capture (includes page URL and title)
- Selected text capture via context menu
- Settings page for configuration

## Development

To build for production:
1. Update version in `manifest.json`
2. Create icons in `icons/` directory (16x16, 48x48, 128x128)
3. Package extension for Chrome Web Store or Firefox Add-ons
