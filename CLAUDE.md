# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## KEEP IT SIMPLE Philosophy

**CRITICAL**: This codebase follows a radical simplification philosophy. When users request changes ensure that by default it is assumed to make changes in ways that are simple, without over-engineering, and without trying to overcomplicate the codebase with elaborate classes or patterns, unless explicitly requested / required and defined in a plan.

### Examples of KEEP IT SIMPLE:
- **Good**: `print(f"Debug: {data}")` (1 line)
- **Bad**: Comprehensive logging framework with multiple levels and formatters (100+ lines)

- **Good**: `content = selection || body.innerText` (auto-detection in 1 line)
- **Bad**: Complex heuristic algorithms with scoring and multiple fallback layers

- **Good**: Three input fields for settings
- **Bad**: Comprehensive settings management with import/export, validation, categories

**Remember**: The entire codebase was reduced from 1,597 lines to 150 lines. Maintain this simplicity. The llm-proxy is a good example (87 lines); readable and simple as just a utility, but still well designed code and complexity can increase only if / when required.

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

## Current Simplified Architecture

### Component Overview (150 total lines)
The extension uses a **minimal, function-based architecture**:

- **Popup** (`popup/popup.js` - 68 lines): Simple functions, no classes, single view
- **Content Script** (`content-scripts/content.js` - 16 lines): Auto-detect selection vs full page
- **Background Script** (`background/background.js` - 22 lines): Basic context menu only
- **Options Page** (`options/options.js` - 41 lines): Minimal 3-field settings

### Simplified Communication
```javascript
// Content extraction (auto-detection)
browser.tabs.sendMessage(tabId, { action: 'getContent' })

// Simple response
{ content: selectedText || fullPageText }
```

### Minimal Storage
```javascript
// Only 3 settings stored
{ apiUrl, model, timeout }
```

### Content Extraction Strategy
**Philosophy**: Let the LLM handle content filtering instead of complex code.

```javascript
// Simple approach: try selection first, fallback to full page
let content = window.getSelection().toString() || document.body.innerText;
```

**Previous complex approach** (490 lines) was replaced with this **simple approach** (16 lines).

## Build System (Webpack)

### Entry Points & Output Structure
```javascript
entry: {
    popup: './popup/popup.js',           // → dist/popup/popup.js (68 lines)
    options: './options/options.js',     // → dist/options/options.js (41 lines)
    background: './background/background.js', // → dist/background/background.js (22 lines)
    content: './content-scripts/content.js'   // → dist/content-scripts/content.js (16 lines)
}
```

## Testing Architecture

### Browser API Mocking Strategy
Complete mock setup in `tests/setup.js` provides:
- **Storage APIs** (`browser.storage.sync`)
- **Runtime APIs** (`browser.runtime.onMessage`, `browser.tabs.sendMessage`)
- **Extension APIs** (`browser.contextMenus`)
- **Web APIs** (`fetch`, `navigator.clipboard`)

### Test Coverage
**Important**: Tests maintain comprehensive coverage despite simplified code. The test suite is the only component that retains complexity to ensure all functionality works correctly.

## Key Development Patterns

### Function-Based Architecture
```javascript
// Simple function approach (current)
async function loadSettings() { /* ... */ }
async function summarize() { /* ... */ }

// Avoid class-based approach (previous)
class PopupController { /* complex implementation */ }
```

### Minimal UI Pattern
```html
<!-- Single view, no navigation -->
<div class="container">
    <h3>LLM Utilities</h3>
    <textarea id="prompt">Summarize this content:</textarea>
    <button id="summarize-btn">Summarize</button>
    <div id="result"></div>
    <button id="options-btn">Settings</button>
</div>
```

### Simple Settings Management
```javascript
// Minimal 3-field settings
const settings = { apiUrl, model, timeout };
await browser.storage.sync.set({ llmSettings: settings });
```

## LLM Proxy Component

### Simple Authentication Proxy (87 lines)
```python
# llm-proxy/llm_proxy.py - Minimal proxy for zign authentication
@app.api_route("/{path:path}", methods=["GET", "POST", ...])
async def proxy_request(request: Request, path: str):
    headers["Authorization"] = f"Bearer {TOKEN}"
    # Forward request with auth
```

### Debug Output (Simple)
```python
# Simple debugging (2 lines maximum)
print(f"Request: {method} {target} | Body: {body[:100]}")
print(f"Response: {status} | Content: {content[:100]}")
```

## Firefox Extension Specifics

### Manifest V2 Requirements
- **Minimal Permissions**: `activeTab`, `storage`, `http://localhost/*`
- **No Complex CSP**: Simple inline restrictions only
- **Basic Icons**: Standard 16x16, 32x32, 48x48, 128x128

### Loading for Development
1. Build: `npm run build`
2. Firefox: `about:debugging` → "Load Temporary Add-on"
3. Select `dist/manifest.json`

## API Configuration

### Simple API Format
Extension expects OpenAI-compatible endpoints:
```javascript
POST /v1/chat/completions
{
  "model": "openai/gpt-4o",
  "messages": [{"role": "user", "content": "Summarize: ..."}]
}
```

### Common Configurations
- **With LLM Proxy**: `http://localhost:4000/v1/chat/completions`
- **Direct APIs**: `https://api.openai.com/v1/chat/completions`
- **Models**: `openai/gpt-4o`, `claude-3-sonnet`

## Git Commit Requirements

**CRITICAL**: KEEP IT SIMPLE applies to commits too. Be concise and precise.

### Commit Message Format
```
<type>: brief description of what was done

Optional bullet points for multiple changes only.
```

### Good Examples (Simple)
```
feat: add debug prints to llm-proxy
fix: auto-detect selection vs full page
docs: update README for simplified architecture
```

### Bad Examples (Over-Explained)
```
feat: implement comprehensive multi-layered content extraction system

Replace hardcoded selector approach with intelligent, adaptive content detection
system that handles modern web architectures and diverse site structures.

## New Multi-Layered Architecture:
[... 50 lines of explanation ...]
```

### Best Practice
- **Small commits** with single features
- **Brief descriptions** that explain what was done
- **Avoid essay-length** commit messages
- **Less is more** - let the code diff speak

