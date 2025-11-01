# LLM Utilities Firefox Extension

A Firefox browser extension that provides utilities for LLM (Large Language Model) interactions, including text summarization and AI-powered content analysis.

## Features

- **Content Summarization**: Summarize selected text or entire web pages using your local LLM API
- **Flexible Content Selection**: Choose between selected text or full page content extraction
- **Customizable Prompts**: Edit and save custom prompts for different use cases
- **API Configuration**: Configure your LLM API endpoint, model, and authentication headers
- **Clipboard Integration**: One-click copying of generated summaries
- **Context Menu Integration**: Right-click to quickly access summarization features
- **Persistent Settings**: All configuration is saved and synced across browser instances

## Prerequisites

- Firefox 109 or later
- A compatible LLM API endpoint (OpenAI-compatible format)
- Node.js 16+ and npm (for development)

## Installation

### Development Installation

1. **Clone and build the extension:**
   ```bash
   git clone <repository-url>
   cd firefox-extension-llm-summary
   npm install
   npm run build
   ```

2. **Load extension in Firefox:**
   - Open Firefox and navigate to `about:debugging`
   - Click "This Firefox" in the left sidebar
   - Click "Load Temporary Add-on"
   - Navigate to the `dist` folder and select `manifest.json`

### Production Installation

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Package the extension:**
   - Zip the contents of the `dist` folder
   - Submit to Firefox Add-ons store or load as a temporary extension

## Configuration

### API Setup

1. **Click the extension icon** in the Firefox toolbar
2. **Click "Options"** to open the settings page
3. **Configure your API settings:**
   - **API Endpoint**: Your LLM API URL (e.g., `http://localhost:4000/v1/chat/completions`)
   - **Model**: The model name to use (e.g., `openai/gpt-4o`, `claude-3-sonnet`)
   - **Custom Headers**: JSON object with authentication headers if needed

### Example API Configuration

For a local OpenAI-compatible API:
```json
API Endpoint: http://localhost:4000/v1/chat/completions
Model: openai/gpt-4o
Headers: {
  "Authorization": "Bearer your-api-key",
  "Content-Type": "application/json"
}
```

### Using the LLM Proxy (for zign authentication)

This repository includes an `llm-proxy` component for environments that use zign for authentication:

1. **Start the proxy**:
   ```bash
   cd llm-proxy
   uv sync
   uv run llm-proxy serve https://api.anthropic.com --port 4000
   ```

2. **Configure extension**:
   ```json
   API Endpoint: http://localhost:4000/v1/chat/completions
   Model: claude-3-sonnet-20240229
   Headers: {} (leave empty - proxy handles auth)
   ```

The proxy automatically extracts zign tokens and adds them to requests before forwarding to the target API.

## Usage

### Basic Summarization

1. **Navigate to any webpage** with text content
2. **Select text** (optional) or leave nothing selected for full page summarization
3. **Click the extension icon** in the toolbar
4. **Click "Summarise"** in the popup
5. **Choose content type:**
   - "Selected Text" for highlighted content
   - "Full Page" for entire page content
6. **Customize the prompt** if needed (auto-saved)
7. **Click "Summarise"** to generate summary
8. **Copy the result** to clipboard using the copy button

### Using Context Menus

1. **Right-click on selected text** → "Summarize with LLM"
2. **Right-click on any page** → "Summarize Page with LLM"
3. **Click the extension icon** to complete the summarization process

### Settings Management

- **Export Settings**: Backup your configuration to a JSON file
- **Import Settings**: Restore configuration from a backup file
- **Test Connection**: Verify your API endpoint is working correctly
- **Reset to Defaults**: Restore original settings

## Manual Testing Workflow

Since this is a browser extension that requires specific browser APIs, comprehensive end-to-end testing requires manual verification. Here's the recommended testing workflow:

### Pre-Testing Setup

1. **Set up a test LLM API endpoint:**
   ```bash
   # Example using a local OpenAI-compatible server
   # Start your LLM server on http://localhost:4000
   ```

2. **Build and load the extension:**
   ```bash
   npm run build
   # Load in Firefox as described in Installation section
   ```

### Core Functionality Tests

#### Test 1: Extension Loading and UI
- [ ] Extension icon appears in Firefox toolbar
- [ ] Clicking icon opens popup with two modules: "Summarise" and "Options"
- [ ] Module buttons are clearly visible with large icons
- [ ] Navigation between views works correctly

#### Test 2: Settings Configuration
- [ ] Options module opens settings page
- [ ] API endpoint field accepts valid URLs
- [ ] Model field accepts text input
- [ ] Headers field validates JSON format
- [ ] "Save Settings" button works and shows success message
- [ ] "Test Connection" button verifies API connectivity
- [ ] Settings persist after browser restart

#### Test 3: Content Extraction
- [ ] Navigate to a text-heavy webpage (e.g., news article, Wikipedia)
- [ ] Select some text and verify "Selected Text" option works
- [ ] Clear selection and verify "Full Page" option extracts page content
- [ ] Test on different website structures (blogs, documentation, etc.)

#### Test 4: Summarization Process
- [ ] Custom prompt field is editable and saves changes
- [ ] "Summarise" button shows loading state during API call
- [ ] Successful API responses display in output area
- [ ] API errors show appropriate error messages
- [ ] Network errors are handled gracefully

#### Test 5: Clipboard Integration
- [ ] "Copy" button successfully copies summary to clipboard
- [ ] Button shows visual feedback when copying succeeds
- [ ] Fallback copy method works if clipboard API unavailable

#### Test 6: Context Menu Integration
- [ ] Right-click menu shows "Summarize with LLM" on selected text
- [ ] Right-click menu shows "Summarize Page with LLM" on page
- [ ] Context menu items trigger appropriate notifications
- [ ] Extension popup reflects the context menu selection

### Error Handling Tests

#### Test 7: API Error Scenarios
- [ ] Invalid API endpoint shows connection error
- [ ] API server down shows network error
- [ ] Invalid API key shows authentication error
- [ ] API rate limiting shows appropriate message
- [ ] Malformed API response handled gracefully

#### Test 8: Content Edge Cases
- [ ] Empty page content shows appropriate message
- [ ] No text selected shows appropriate message
- [ ] Very long content is handled correctly
- [ ] Pages with complex layouts extract content properly
- [ ] JavaScript-heavy pages work correctly

#### Test 9: Settings Edge Cases
- [ ] Invalid URL format shows validation error
- [ ] Empty model name shows validation error
- [ ] Invalid JSON headers show parsing error
- [ ] Settings import/export works correctly
- [ ] Reset to defaults restores original settings

### Performance Tests

#### Test 10: Extension Performance
- [ ] Extension doesn't slow down browser significantly
- [ ] Memory usage remains reasonable during operation
- [ ] Large content processing completes within reasonable time
- [ ] Multiple simultaneous requests handled correctly

### Compatibility Tests

#### Test 11: Browser Compatibility
- [ ] Test on Firefox 109+ versions
- [ ] Test on different operating systems (Windows, macOS, Linux)
- [ ] Test with different Firefox themes
- [ ] Test with other extensions installed

### Regression Tests

#### Test 12: After Updates
- [ ] Settings preserved after extension update
- [ ] Saved prompts persist after update
- [ ] All functionality works after Firefox update
- [ ] No console errors in browser dev tools

## Development

### Available Scripts

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Clean build directory
npm run clean
```

### Project Structure

```
firefox-extension-llm-summary/
├── manifest.json              # Extension manifest
├── popup/                     # Extension popup
│   ├── popup.html            # Popup UI
│   ├── popup.css             # Popup styles
│   ├── popup.js              # Popup functionality
│   └── icons/                # Extension icons
├── options/                   # Settings page
│   ├── options.html          # Options UI
│   ├── options.css           # Options styles
│   └── options.js            # Options functionality
├── content-scripts/           # Content extraction
│   └── content.js            # Page content extraction
├── background/                # Background processes
│   └── background.js         # Extension background script
├── tests/                     # Unit tests
│   ├── setup.js              # Test configuration
│   └── unit/                 # Unit test files
├── dist/                      # Built extension (generated)
├── webpack.config.js         # Build configuration
├── package.json              # Project dependencies
└── README.md                 # This file
```

### Testing

The extension includes comprehensive unit tests using Jest. However, full end-to-end testing requires manual verification due to the browser extension environment.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test popup.test.js
```

## API Compatibility

The extension is designed to work with OpenAI-compatible APIs that accept the following request format:

```javascript
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "Your prompt and content here"
    }
  ]
}
```

And return responses in the format:

```javascript
{
  "choices": [
    {
      "message": {
        "content": "Generated response text"
      }
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Extension not loading:**
   - Check Firefox version (109+ required)
   - Verify manifest.json is in the correct location
   - Check browser console for errors

2. **API connection fails:**
   - Verify API endpoint URL is correct
   - Check if API server is running
   - Verify authentication headers if required
   - Test API endpoint manually with curl

3. **Content extraction not working:**
   - Verify content script permissions in manifest
   - Check if page has content security policy restrictions
   - Test on different websites to isolate issues

4. **Settings not saving:**
   - Check if browser has storage permissions
   - Verify no browser storage quota exceeded
   - Test in private/incognito mode to isolate extensions conflicts

### Debug Mode

Enable debug mode by opening browser developer tools (F12) and checking the console for extension logs.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Feedback and Support

Please report issues and provide feedback through the project's issue tracker. For manual testing feedback, please include:

- Firefox version
- Operating system
- API endpoint type
- Steps to reproduce any issues
- Console error messages (if any)
- Screenshots of UI issues (if applicable)

Your feedback is crucial for improving the extension's reliability and user experience!