# LLM Utilities Firefox Extension

A minimal Firefox browser extension for LLM text summarization. Simple, functional, and lightweight.

## Features

- **Auto-Detection**: Automatically detects selected text or uses full page content
- **Single-Click Summarization**: One button to summarize any content
- **Minimal Configuration**: Just API URL, model, and timeout settings
- **LLM Proxy Support**: Includes simple proxy to handle LLM authentication.
- **Zero Complexity**: No view management, no over-engineering

## Installation

### Development Installation

1. **Clone and build:**
   ```bash
   git clone <repository-url>
   cd firefox-extension-llm-summary
   npm install
   npm run build
   ```

2. **Load in Firefox:**
   - Navigate to `about:debugging`
   - Click "This Firefox" → "Load Temporary Add-on"
   - Select `dist/manifest.json`

## Configuration

1. **Click extension icon** → **Settings**
2. **Configure three settings:**
   - **API URL**: `http://localhost:4000/v1/chat/completions`
   - **Model**: `openai/gpt-4o` or `claude-3-sonnet`
   - **Timeout**: `30` seconds
3. **Save**

### Using the LLM Proxy

```bash
cd llm-proxy
uv sync
uv run llm-proxy serve https://api.anthropic.com --port 4000
```

Set extension API URL to `http://localhost:4000/v1/chat/completions`

## Usage

1. **Navigate to any webpage**
2. **Optional**: Select text (extension auto-detects)
3. **Click extension icon**
4. **Optional**: Edit prompt
5. **Click "Summarize"**

The extension uses selected text if available, otherwise uses full page content.

## Architecture

### File Structure
```
popup/
├── popup.js      - Simple functions, no classes
├── popup.html    - Single view, no navigation
└── popup.css     - Essential styles only

content-scripts/
└── content.js    - Auto-detect selection vs full page

background/
└── background.js - Basic context menu only

options/
├── options.js    - Minimal 3-field settings
└── options.html  - Basic form

llm-proxy/
└── llm_proxy.py  - Simple authentication proxy
```

### Simplification Achieved
- **Before**: 1,597 lines of complex code
- **After**: 150 lines of simple functions
- **Reduction**: 90.6% code elimination
- **Approach**: Function-based, no classes, minimal UI

## Development

```bash
# Build extension
npm run build

# Run tests (comprehensive test suite maintained)
npm test

# Development with watch
npm run dev
```

## API Compatibility

Works with OpenAI-compatible APIs:

```javascript
POST /v1/chat/completions
{
  "model": "openai/gpt-4o",
  "messages": [{"role": "user", "content": "Summarize: ..."}]
}
```

## Troubleshooting

1. **No content found**: Select text manually or check page content
2. **API errors**: Verify URL and model settings
3. **Network issues**: Check proxy/firewall settings
4. **Debug**: Use browser console (F12) and llm-proxy logs

## License

MIT License
