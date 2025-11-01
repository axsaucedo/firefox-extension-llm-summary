// Basic structure and configuration tests

describe('Extension Structure', () => {
    test('manifest.json should be valid', () => {
        const fs = require('fs');
        const path = require('path');

        const manifestPath = path.join(__dirname, '../../manifest.json');
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);

        expect(manifest.manifest_version).toBe(2);
        expect(manifest.name).toBe('LLM Utilities');
        expect(manifest.permissions).toContain('activeTab');
        expect(manifest.permissions).toContain('storage');
        expect(manifest.browser_action).toBeDefined();
        expect(manifest.options_ui).toBeDefined();
    });

    test('package.json should have required scripts', () => {
        const fs = require('fs');
        const path = require('path');

        const packagePath = path.join(__dirname, '../../package.json');
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);

        expect(packageJson.scripts.build).toBeDefined();
        expect(packageJson.scripts.test).toBeDefined();
        expect(packageJson.scripts.dev).toBeDefined();
    });

    test('required files should exist', () => {
        const fs = require('fs');
        const path = require('path');

        const requiredFiles = [
            'popup/popup.html',
            'popup/popup.css',
            'popup/popup.js',
            'options/options.html',
            'options/options.css',
            'options/options.js',
            'content-scripts/content.js',
            'background/background.js',
            'webpack.config.js',
            '.babelrc'
        ];

        requiredFiles.forEach(file => {
            const filePath = path.join(__dirname, '../../', file);
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });
});

describe('Browser API Mocks', () => {
    beforeEach(() => {
        resetMocks();
    });

    test('browser storage API should be mocked', () => {
        expect(browser.storage.sync.get).toBeDefined();
        expect(browser.storage.sync.set).toBeDefined();
        expect(typeof browser.storage.sync.get).toBe('function');
        expect(typeof browser.storage.sync.set).toBe('function');
    });

    test('browser runtime API should be mocked', () => {
        expect(browser.runtime.onMessage).toBeDefined();
        expect(browser.runtime.sendMessage).toBeDefined();
        expect(typeof browser.runtime.sendMessage).toBe('function');
    });

    test('browser tabs API should be mocked', () => {
        expect(browser.tabs.query).toBeDefined();
        expect(browser.tabs.sendMessage).toBeDefined();
        expect(typeof browser.tabs.query).toBe('function');
    });

    test('fetch should be mocked', () => {
        expect(global.fetch).toBeDefined();
        expect(typeof global.fetch).toBe('function');
        expect(jest.isMockFunction(global.fetch)).toBe(true);
    });
});

describe('Utility Functions', () => {
    test('createMockSettings should create valid settings object', () => {
        const settings = createMockSettings();

        expect(settings).toHaveProperty('apiUrl');
        expect(settings).toHaveProperty('model');
        expect(settings).toHaveProperty('headers');
        expect(settings.apiUrl).toContain('localhost');
        expect(settings.model).toBe('gpt-4o');
    });

    test('createMockSettings should allow overrides', () => {
        const settings = createMockSettings({
            model: 'custom-model',
            apiUrl: 'http://custom:8000/api'
        });

        expect(settings.model).toBe('custom-model');
        expect(settings.apiUrl).toBe('http://custom:8000/api');
        expect(settings.headers).toEqual({});
    });

    test('createMockAPIResponse should create valid response', async () => {
        const response = await createMockAPIResponse('Test content');

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.choices).toBeDefined();
        expect(data.choices[0].message.content).toBe('Test content');
    });

    test('createMockAPIResponse should handle error status', async () => {
        const response = await createMockAPIResponse('Error', 500);

        expect(response.ok).toBe(false);
        expect(response.status).toBe(500);
    });
});

describe('DOM Utilities', () => {
    test('document and window should be available', () => {
        expect(global.document).toBeDefined();
        expect(global.window).toBeDefined();
        expect(document.createElement).toBeDefined();
    });

    test('createMockElement should create DOM elements', () => {
        const element = createMockElement('div', { id: 'test', class: 'test-class' }, 'Test content');

        expect(element.tagName).toBe('DIV');
        expect(element.id).toBe('test');
        expect(element.className).toBe('test-class');
        expect(element.textContent).toBe('Test content');
    });

    test('setupMockDOM should provide DOM utilities', () => {
        const { restoreDOM } = setupMockDOM();

        expect(document.querySelector).toBeDefined();
        expect(jest.isMockFunction(document.querySelector)).toBe(true);

        restoreDOM();
    });
});

describe('Test Environment', () => {
    test('TextEncoder should be available', () => {
        expect(global.TextEncoder).toBeDefined();
        expect(global.TextDecoder).toBeDefined();

        const encoder = new TextEncoder();
        expect(encoder.encode).toBeDefined();
    });

    test('clipboard API should be mocked', () => {
        expect(navigator.clipboard).toBeDefined();
        expect(navigator.clipboard.writeText).toBeDefined();
        expect(jest.isMockFunction(navigator.clipboard.writeText)).toBe(true);
    });
});