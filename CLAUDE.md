# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Workflow
```bash
npm install              # Install dependencies
npm run build           # Production build to dist/
npm run dev             # Development build with watch mode
npm test                # Run all tests
npm run lint            # ESLint code quality check
npm run clean           # Remove dist/ directory
```

### Testing Commands
```bash
npm test -- tests/unit/structure.test.js    # Run specific test file
npm run test:watch                          # Watch mode for tests
npm test -- --coverage                     # Run with coverage report
```

## Firefox Extension Architecture

### Component Communication Flow
The extension uses a multi-component architecture where each component has specific responsibilities:

- **Background Script** (`background/background.js`): Extension lifecycle, context menus, message routing
- **Popup** (`popup/popup.js`): Main UI controller with view management (main → summarise/options)
- **Options Page** (`options/options.js`): Settings management with import/export and validation
- **Content Script** (`content-scripts/content.js`): Web page content extraction with smart filtering

### Inter-Component Communication
Components communicate via `browser.runtime.sendMessage()` patterns:
```javascript
// Popup → Content Script (via tabs.sendMessage)
browser.tabs.sendMessage(tabId, { action: 'getContent', type: 'selected' })

// Background handles message routing and storage operations
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Message routing logic
})
```

### Storage Architecture
Uses `browser.storage.sync` for cross-device settings persistence:
- **Settings Object**: `{ apiUrl, model, headers, defaultSummaryPrompt, requestTimeout, autoCopyResults }`
- **Saved Prompts**: Stored separately as `savedPrompt` key
- **Storage requires explicit addon ID** in manifest for temporary extensions

### Content Extraction Strategy
Smart content extraction prioritizes:
1. Article containers (`article`, `[role="main"]`, `main`)
2. Content-specific selectors (`.content`, `.post-content`, etc.)
3. Fallback to filtered body content
4. Removes navigation, ads, scripts, styles automatically

## Build System (Webpack)

### Entry Points & Output Structure
```javascript
entry: {
    popup: './popup/popup.js',      // → dist/popup/popup.js
    options: './options/options.js', // → dist/options/options.js
    background: './background/background.js', // → dist/background/background.js
    content: './content-scripts/content.js'   // → dist/content-scripts/content.js
}
```

### Extension-Specific Configuration
- **No code splitting** (`splitChunks: false`) for extension compatibility
- **Copy static assets** (HTML, CSS, manifest.json, icons) to dist/
- **Browser API externals** (`'webextension-polyfill': 'browser'`)
- **Source maps** in development, minification in production

## Testing Architecture

### Browser API Mocking Strategy
Complete mock setup in `tests/setup.js` provides:
- **Storage APIs** (`browser.storage.sync`, `browser.storage.local`)
- **Runtime APIs** (`browser.runtime.onMessage`, `browser.tabs.sendMessage`)
- **Extension APIs** (`browser.contextMenus`, `browser.notifications`)
- **Web APIs** (`fetch`, `navigator.clipboard`, `TextEncoder/TextDecoder`)

### Test Helper Patterns
```javascript
// Mock settings creation
const settings = createMockSettings({ model: 'custom-model' });

// Mock API responses
fetch.mockImplementation(() => createMockAPIResponse('Summary text'));

// Browser storage mocking
browser.storage.sync.get.mockResolvedValue({ llmSettings: settings });
```

### Testing Limitations
Unit tests cover logic and API interactions, but **manual testing required** for:
- Firefox extension loading and permissions
- Browser integration and UI interactions
- End-to-end workflows with real LLM APIs
- Content extraction across different websites

## Key Development Patterns

### Class-Based Component Architecture
Each major component uses a class-based pattern:
```javascript
class PopupController {
    constructor() {
        this.settings = { /* defaults */ };
        this.initializeElements();  // DOM binding
        this.bindEvents();         // Event handlers
        this.loadSettings();       // Async initialization
    }
}
```

### View Management Pattern (Popup)
Single-page application pattern with view switching:
```javascript
showView(viewName) {
    // Hide all views, show target view
    // Update currentView state
}
```

### Settings Management Pattern
Consistent pattern across components:
1. **Load** settings from `browser.storage.sync`
2. **Validate** input with proper error handling
3. **Save** with user feedback
4. **Export/Import** for backup functionality

### API Integration Pattern
OpenAI-compatible request format:
```javascript
{
    model: settings.model,
    messages: [{ role: 'user', content: `${prompt}\n\n${content}` }]
}
```

## Firefox Extension Specifics

### Manifest V2 Requirements
- **Explicit addon ID needed** for storage API in temporary extensions
- **Content Security Policy** prevents inline scripts
- **Permissions**: `activeTab`, `storage`, `http://localhost/*` for local APIs

### Loading for Development
1. Build extension: `npm run build`
2. Firefox: `about:debugging` → "This Firefox" → "Load Temporary Add-on"
3. Select `dist/manifest.json`
4. **Add explicit gecko ID** to manifest if storage errors occur

### Icon Requirements
Extension references PNG icons that must be created from `popup/icons/icon.svg`:
- 16x16, 32x32, 48x48, 128x128 pixel versions
- See `create-icons.md` for conversion instructions

## API Configuration

### Required API Format
Extension expects OpenAI-compatible endpoints:
```bash
POST /v1/chat/completions
Content-Type: application/json
{ "model": "...", "messages": [...] }
```

### Common API Configurations
- **Local OpenAI-compatible**: `http://localhost:4000/v1/chat/completions`
- **Authentication**: Set via Custom Headers in options page
- **Model names**: `gpt-4o`, `claude-3-sonnet`, or custom model identifiers

## Manual Testing Workflow

Essential testing steps due to browser extension environment:
1. **Build and load** extension in Firefox
2. **Configure API** endpoint in options page
3. **Test content extraction** on various websites
4. **Verify summarization** with real API endpoints
5. **Test error handling** (network failures, API errors)
6. **Check context menu integration**
7. **Validate settings persistence** across browser sessions

The extension includes comprehensive manual testing workflows in `README.md` with specific test cases and expected behaviors.