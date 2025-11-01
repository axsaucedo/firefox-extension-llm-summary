// Test setup for LLM Utilities Extension

// Mock browser APIs for testing
const mockBrowser = {
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn()
        },
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn()
        }
    },
    runtime: {
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        },
        onInstalled: {
            addListener: jest.fn()
        },
        onStartup: {
            addListener: jest.fn()
        },
        sendMessage: jest.fn(),
        openOptionsPage: jest.fn(),
        lastError: null
    },
    tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
        onUpdated: {
            addListener: jest.fn()
        }
    },
    contextMenus: {
        create: jest.fn(),
        removeAll: jest.fn(),
        onClicked: {
            addListener: jest.fn()
        }
    },
    notifications: {
        create: jest.fn()
    }
};

// Set up global browser object
global.browser = mockBrowser;

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: jest.fn().mockResolvedValue(undefined)
    },
    writable: true
});

// Mock URL constructor
global.URL = jest.fn().mockImplementation((url) => {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL');
    }

    const validUrlPattern = /^https?:\/\/.+/;
    if (!validUrlPattern.test(url)) {
        throw new Error('Invalid URL');
    }

    return {
        href: url,
        toString: () => url
    };
});

// Mock console methods for cleaner test output
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};

// Helper function to reset all mocks between tests
global.resetMocks = () => {
    jest.clearAllMocks();

    // Reset browser storage mocks to default behavior
    mockBrowser.storage.sync.get.mockResolvedValue({});
    mockBrowser.storage.sync.set.mockResolvedValue();
    mockBrowser.storage.local.get.mockResolvedValue({});
    mockBrowser.storage.local.set.mockResolvedValue();

    // Reset fetch mock
    fetch.mockReset();

    // Reset clipboard mock
    navigator.clipboard.writeText.mockReset().mockResolvedValue(undefined);
};

// Helper function to create mock API response
global.createMockAPIResponse = (content = 'Test summary', status = 200) => {
    const response = {
        ok: status >= 200 && status < 300,
        status: status,
        json: jest.fn().mockResolvedValue({
            choices: [
                {
                    message: {
                        content: content
                    }
                }
            ]
        }),
        text: jest.fn().mockResolvedValue(status >= 400 ? 'Error message' : content)
    };

    return Promise.resolve(response);
};

// Helper function to create mock settings
global.createMockSettings = (overrides = {}) => {
    return {
        apiUrl: 'http://localhost:4000/v1/chat/completions',
        model: 'gpt-4o',
        headers: {},
        defaultSummaryPrompt: 'Please provide a concise summary of the following content:',
        requestTimeout: 30,
        autoCopyResults: false,
        ...overrides
    };
};

// DOM testing helpers
global.createMockElement = (tag, attributes = {}, content = '') => {
    const element = document.createElement(tag);

    Object.keys(attributes).forEach(key => {
        element.setAttribute(key, attributes[key]);
    });

    if (content) {
        element.textContent = content;
    }

    return element;
};

// Mock DOM methods commonly used in the extension
global.setupMockDOM = () => {
    document.body.innerHTML = '';

    // Mock document.querySelector and querySelectorAll
    const originalQuerySelector = document.querySelector;
    const originalQuerySelectorAll = document.querySelectorAll;

    document.querySelector = jest.fn(originalQuerySelector.bind(document));
    document.querySelectorAll = jest.fn(originalQuerySelectorAll.bind(document));

    return {
        restoreDOM: () => {
            document.querySelector = originalQuerySelector;
            document.querySelectorAll = originalQuerySelectorAll;
        }
    };
};

// Setup Node.js polyfills
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Setup JSDOM environment
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Ensure window.getSelection is available
global.window.getSelection = jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue(''),
    rangeCount: 0
});