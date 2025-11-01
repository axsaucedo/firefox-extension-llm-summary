// Unit tests for popup functionality

describe('PopupController', () => {
    let popupController;
    let mockElements;

    beforeEach(() => {
        resetMocks();

        // Create mock DOM elements
        document.body.innerHTML = `
            <div id="main-view" class="view active"></div>
            <div id="summarise-view" class="view"></div>
            <div id="options-view" class="view"></div>
            <button id="summarise-button"></button>
            <button id="options-button"></button>
            <button id="back-from-summarise"></button>
            <button id="back-from-options"></button>
            <input type="radio" id="selected-content" name="content-type" value="selected" checked>
            <input type="radio" id="page-content" name="content-type" value="page">
            <textarea id="prompt-input"></textarea>
            <button id="summarise-action">
                <span class="button-text">Summarise</span>
                <span class="loading-spinner" style="display: none;"></span>
            </button>
            <div id="summary-output" style="display: none;">
                <div id="summary-text"></div>
                <button id="copy-summary"></button>
                <div id="error-message" style="display: none;"></div>
            </div>
            <input id="api-url" value="http://localhost:4000/v1/chat/completions">
            <input id="model-name" value="openai/gpt-4o">
            <textarea id="api-headers">{}</textarea>
            <button id="save-settings"></button>
            <div id="settings-status" style="display: none;"></div>
        `;

        // Mock PopupController - we need to load it after DOM setup
        jest.isolateModules(() => {
            const PopupControllerClass = require('../../popup/popup.js');
            popupController = new PopupControllerClass();
        });
    });

    describe('Initialization', () => {
        test('should initialize with default settings', () => {
            expect(popupController.currentView).toBe('main');
            expect(popupController.settings).toMatchObject({
                apiUrl: 'http://localhost:4000/v1/chat/completions',
                model: 'openai/gpt-4o',
                headers: {}
            });
        });

        test('should load saved settings from storage', async () => {
            const mockSettings = createMockSettings({
                apiUrl: 'http://custom:8000/api',
                model: 'custom-model'
            });

            browser.storage.sync.get.mockResolvedValue({
                llmSettings: mockSettings
            });

            await popupController.loadSettings();

            expect(popupController.settings.apiUrl).toBe('http://custom:8000/api');
            expect(popupController.settings.model).toBe('custom-model');
        });
    });

    describe('View Navigation', () => {
        test('should show summarise view when summarise button clicked', () => {
            const mainView = document.getElementById('main-view');
            const summariseView = document.getElementById('summarise-view');

            popupController.showView('summarise');

            expect(mainView.classList.contains('active')).toBe(false);
            expect(summariseView.classList.contains('active')).toBe(true);
            expect(popupController.currentView).toBe('summarise');
        });

        test('should show options view when options button clicked', () => {
            const mainView = document.getElementById('main-view');
            const optionsView = document.getElementById('options-view');

            popupController.showView('options');

            expect(mainView.classList.contains('active')).toBe(false);
            expect(optionsView.classList.contains('active')).toBe(true);
            expect(popupController.currentView).toBe('options');
        });

        test('should return to main view when back button clicked', () => {
            popupController.showView('summarise');
            popupController.showView('main');

            const mainView = document.getElementById('main-view');
            const summariseView = document.getElementById('summarise-view');

            expect(mainView.classList.contains('active')).toBe(true);
            expect(summariseView.classList.contains('active')).toBe(false);
            expect(popupController.currentView).toBe('main');
        });
    });

    describe('Settings Management', () => {
        test('should validate and save API settings', async () => {
            const apiUrlInput = document.getElementById('api-url');
            const modelNameInput = document.getElementById('model-name');

            apiUrlInput.value = 'http://valid-url:3000/api';
            modelNameInput.value = 'test-model';

            await popupController.handleSaveSettings();

            expect(browser.storage.sync.set).toHaveBeenCalledWith({
                llmSettings: expect.objectContaining({
                    apiUrl: 'http://valid-url:3000/api',
                    model: 'test-model'
                })
            });
        });

        test('should show error for invalid API URL', async () => {
            const apiUrlInput = document.getElementById('api-url');
            apiUrlInput.value = 'invalid-url';

            await popupController.handleSaveSettings();

            expect(browser.storage.sync.set).not.toHaveBeenCalled();
            // Should show error message (implementation dependent)
        });

        test('should validate JSON headers', async () => {
            const apiHeadersInput = document.getElementById('api-headers');
            apiHeadersInput.value = '{"Authorization": "Bearer token"}';

            await popupController.handleSaveSettings();

            expect(popupController.settings.headers).toEqual({
                Authorization: 'Bearer token'
            });
        });

        test('should show error for invalid JSON headers', async () => {
            const apiHeadersInput = document.getElementById('api-headers');
            apiHeadersInput.value = '{invalid json}';

            await popupController.handleSaveSettings();

            expect(browser.storage.sync.set).not.toHaveBeenCalled();
        });
    });

    describe('Content Summarization', () => {
        test('should get selected content and call API', async () => {
            // Mock successful API response
            fetch.mockImplementation(() => createMockAPIResponse('Test summary'));

            // Mock tabs.query and sendMessage for content extraction
            browser.tabs.query.mockResolvedValue([{ id: 1 }]);
            browser.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
                callback({ content: 'Selected text content' });
            });

            const promptInput = document.getElementById('prompt-input');
            promptInput.value = 'Summarize this:';

            await popupController.handleSummarise();

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:4000/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    body: expect.stringContaining('Selected text content')
                })
            );

            const summaryText = document.getElementById('summary-text');
            expect(summaryText.textContent).toBe('Test summary');
        });

        test('should handle API errors gracefully', async () => {
            // Mock API error response
            fetch.mockImplementation(() => Promise.resolve({
                ok: false,
                status: 500,
                json: () => Promise.resolve({
                    error: { message: 'Server error' }
                })
            }));

            browser.tabs.query.mockResolvedValue([{ id: 1 }]);
            browser.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
                callback({ content: 'Test content' });
            });

            await popupController.handleSummarise();

            const errorMessage = document.getElementById('error-message');
            expect(errorMessage.style.display).toBe('block');
            expect(errorMessage.textContent).toContain('Server error');
        });

        test('should handle empty content', async () => {
            browser.tabs.query.mockResolvedValue([{ id: 1 }]);
            browser.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
                callback({ content: '' });
            });

            await popupController.handleSummarise();

            const errorMessage = document.getElementById('error-message');
            expect(errorMessage.style.display).toBe('block');
            expect(errorMessage.textContent).toContain('No text selected');
        });

        test('should show loading state during API call', async () => {
            // Mock slow API response
            fetch.mockImplementation(() => new Promise(resolve => {
                setTimeout(() => resolve(createMockAPIResponse()), 100);
            }));

            browser.tabs.query.mockResolvedValue([{ id: 1 }]);
            browser.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
                callback({ content: 'Test content' });
            });

            const summariseButton = document.getElementById('summarise-action');
            const buttonText = document.querySelector('.button-text');
            const loadingSpinner = document.querySelector('.loading-spinner');

            // Start summarization
            popupController.handleSummarise();

            // Check loading state immediately
            expect(summariseButton.disabled).toBe(true);
            expect(buttonText.style.display).toBe('none');
            expect(loadingSpinner.style.display).toBe('inline');

            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(summariseButton.disabled).toBe(false);
            expect(buttonText.style.display).toBe('inline');
            expect(loadingSpinner.style.display).toBe('none');
        });
    });

    describe('Clipboard Operations', () => {
        test('should copy summary to clipboard', async () => {
            const summaryText = document.getElementById('summary-text');
            summaryText.textContent = 'Test summary content';

            await popupController.copyToClipboard();

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test summary content');
        });

        test('should use fallback copy method when clipboard API fails', async () => {
            navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard not available'));

            const summaryText = document.getElementById('summary-text');
            summaryText.textContent = 'Test summary content';

            // Mock document.execCommand
            document.execCommand = jest.fn().mockReturnValue(true);

            await popupController.copyToClipboard();

            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });
    });

    describe('Prompt Management', () => {
        test('should save prompt changes to storage', async () => {
            const promptInput = document.getElementById('prompt-input');
            promptInput.value = 'Custom prompt text';

            await popupController.savePrompt();

            expect(browser.storage.sync.set).toHaveBeenCalledWith({
                savedPrompt: 'Custom prompt text'
            });
        });

        test('should load saved prompt from storage', async () => {
            browser.storage.sync.get.mockResolvedValue({
                savedPrompt: 'Saved custom prompt'
            });

            await popupController.loadSavedPrompt();

            const promptInput = document.getElementById('prompt-input');
            expect(promptInput.value).toBe('Saved custom prompt');
        });

        test('should use default prompt if none saved', async () => {
            browser.storage.sync.get.mockResolvedValue({});

            await popupController.loadSavedPrompt();

            const promptInput = document.getElementById('prompt-input');
            expect(promptInput.value).toBe('Please provide a concise summary of the following content:');
        });
    });

    describe('Utility Functions', () => {
        test('should validate URLs correctly', () => {
            expect(popupController.isValidUrl('http://localhost:3000')).toBe(true);
            expect(popupController.isValidUrl('https://api.example.com')).toBe(true);
            expect(popupController.isValidUrl('invalid-url')).toBe(false);
            expect(popupController.isValidUrl('')).toBe(false);
        });
    });
});