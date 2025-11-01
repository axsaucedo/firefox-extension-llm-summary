// Unit tests for background script functionality

describe('BackgroundManager', () => {
    let backgroundManager;

    beforeEach(() => {
        resetMocks();

        jest.isolateModules(() => {
            const BackgroundManagerClass = require('../../background/background.js');
            backgroundManager = new BackgroundManagerClass();
        });
    });

    describe('Initialization', () => {
        test('should set up event listeners', () => {
            expect(browser.runtime.onInstalled.addListener).toHaveBeenCalled();
            expect(browser.runtime.onStartup.addListener).toHaveBeenCalled();
            expect(browser.runtime.onMessage.addListener).toHaveBeenCalled();
            expect(browser.contextMenus.onClicked.addListener).toHaveBeenCalled();
            expect(browser.tabs.onUpdated.addListener).toHaveBeenCalled();
        });
    });

    describe('Installation Handling', () => {
        test('should initialize default settings on first install', async () => {
            await backgroundManager.handleInstallation({ reason: 'install' });

            expect(browser.storage.sync.set).toHaveBeenCalledWith({
                llmSettings: expect.objectContaining({
                    apiUrl: 'http://localhost:4000/v1/chat/completions',
                    model: 'openai/gpt-4o'
                }),
                savedPrompt: 'Please provide a concise summary of the following content:'
            });

            expect(browser.runtime.openOptionsPage).toHaveBeenCalled();
        });

        test('should handle update installation', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log');

            await backgroundManager.handleInstallation({
                reason: 'update',
                previousVersion: '0.9.0'
            });

            expect(consoleLogSpy).toHaveBeenCalledWith('Updated from version:', '0.9.0');
            expect(browser.runtime.openOptionsPage).not.toHaveBeenCalled();
        });
    });

    describe('Context Menu Creation', () => {
        test('should create context menus', async () => {
            await backgroundManager.createContextMenus();

            expect(browser.contextMenus.removeAll).toHaveBeenCalled();
            expect(browser.contextMenus.create).toHaveBeenCalledTimes(4); // 3 menu items + 1 separator

            // Check specific menu items
            expect(browser.contextMenus.create).toHaveBeenCalledWith({
                id: 'summarize-selection',
                title: 'Summarize with LLM',
                contexts: ['selection'],
                enabled: true
            });

            expect(browser.contextMenus.create).toHaveBeenCalledWith({
                id: 'summarize-page',
                title: 'Summarize Page with LLM',
                contexts: ['page'],
                enabled: true
            });

            expect(browser.contextMenus.create).toHaveBeenCalledWith({
                id: 'open-settings',
                title: 'LLM Utilities Settings',
                contexts: ['page'],
                enabled: true
            });
        });

        test('should handle context menu creation errors', async () => {
            browser.contextMenus.create.mockRejectedValue(new Error('Menu creation failed'));

            await backgroundManager.createContextMenus();

            expect(console.error).toHaveBeenCalledWith('Error creating context menus:', expect.any(Error));
        });
    });

    describe('Message Handling', () => {
        test('should handle getSettings message', async () => {
            const mockSettings = createMockSettings();
            browser.storage.sync.get.mockResolvedValue({ llmSettings: mockSettings });

            const mockSendResponse = jest.fn();

            await backgroundManager.handleMessage(
                { action: 'getSettings' },
                {},
                mockSendResponse
            );

            expect(mockSendResponse).toHaveBeenCalledWith({
                success: true,
                data: mockSettings
            });
        });

        test('should handle updateSettings message', async () => {
            const newSettings = createMockSettings({ model: 'new-model' });
            const mockSendResponse = jest.fn();

            await backgroundManager.handleMessage(
                { action: 'updateSettings', settings: newSettings },
                {},
                mockSendResponse
            );

            expect(browser.storage.sync.set).toHaveBeenCalledWith({
                llmSettings: newSettings
            });

            expect(mockSendResponse).toHaveBeenCalledWith({
                success: true
            });
        });

        test('should handle testConnection message', async () => {
            const mockSettings = createMockSettings();
            fetch.mockImplementation(() => createMockAPIResponse('Test response'));

            const mockSendResponse = jest.fn();

            await backgroundManager.handleMessage(
                { action: 'testConnection', settings: mockSettings },
                {},
                mockSendResponse
            );

            expect(fetch).toHaveBeenCalledWith(
                mockSettings.apiUrl,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );

            expect(mockSendResponse).toHaveBeenCalledWith({
                success: true,
                message: 'Connection successful!',
                data: expect.any(Object)
            });
        });

        test('should handle testConnection failure', async () => {
            const mockSettings = createMockSettings();
            fetch.mockRejectedValue(new Error('Network error'));

            const mockSendResponse = jest.fn();

            await backgroundManager.handleMessage(
                { action: 'testConnection', settings: mockSettings },
                {},
                mockSendResponse
            );

            expect(mockSendResponse).toHaveBeenCalledWith({
                success: false,
                message: 'Connection failed: Network error'
            });
        });

        test('should handle openOptionsPage message', async () => {
            const mockSendResponse = jest.fn();

            await backgroundManager.handleMessage(
                { action: 'openOptionsPage' },
                {},
                mockSendResponse
            );

            expect(browser.runtime.openOptionsPage).toHaveBeenCalled();
            expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
        });

        test('should handle unknown message action', async () => {
            const mockSendResponse = jest.fn();

            await backgroundManager.handleMessage(
                { action: 'unknown' },
                {},
                mockSendResponse
            );

            expect(mockSendResponse).toHaveBeenCalledWith({
                success: false,
                error: 'Unknown action'
            });
        });

        test('should handle message processing errors', async () => {
            browser.storage.sync.get.mockRejectedValue(new Error('Storage error'));

            const mockSendResponse = jest.fn();

            await backgroundManager.handleMessage(
                { action: 'getSettings' },
                {},
                mockSendResponse
            );

            expect(mockSendResponse).toHaveBeenCalledWith({
                success: false,
                error: 'Storage error'
            });
        });
    });

    describe('Context Menu Click Handling', () => {
        test('should handle summarize-selection context menu click', async () => {
            const mockTab = { id: 1, url: 'https://example.com' };

            await backgroundManager.handleContextMenuClick(
                { menuItemId: 'summarize-selection' },
                mockTab
            );

            expect(browser.notifications.create).toHaveBeenCalledWith({
                type: 'basic',
                iconUrl: 'popup/icons/icon-48.png',
                title: 'LLM Utilities',
                message: 'Click the extension icon to summarize selected text.'
            });
        });

        test('should handle summarize-page context menu click', async () => {
            const mockTab = { id: 1, url: 'https://example.com' };

            await backgroundManager.handleContextMenuClick(
                { menuItemId: 'summarize-page' },
                mockTab
            );

            expect(browser.notifications.create).toHaveBeenCalledWith({
                type: 'basic',
                iconUrl: 'popup/icons/icon-48.png',
                title: 'LLM Utilities',
                message: 'Click the extension icon to summarize the page.'
            });
        });

        test('should handle open-settings context menu click', async () => {
            await backgroundManager.handleContextMenuClick(
                { menuItemId: 'open-settings' },
                {}
            );

            expect(browser.runtime.openOptionsPage).toHaveBeenCalled();
        });
    });

    describe('Default Settings Initialization', () => {
        test('should not overwrite existing settings', async () => {
            const existingSettings = createMockSettings({ model: 'existing-model' });
            browser.storage.sync.get.mockResolvedValue({
                llmSettings: existingSettings
            });

            await backgroundManager.initializeDefaultSettings();

            expect(browser.storage.sync.set).not.toHaveBeenCalled();
        });

        test('should create default settings when none exist', async () => {
            browser.storage.sync.get.mockResolvedValue({});

            await backgroundManager.initializeDefaultSettings();

            expect(browser.storage.sync.set).toHaveBeenCalledWith({
                llmSettings: expect.objectContaining({
                    apiUrl: 'http://localhost:4000/v1/chat/completions',
                    model: 'openai/gpt-4o'
                }),
                savedPrompt: 'Please provide a concise summary of the following content:'
            });
        });
    });

    describe('API Connection Testing', () => {
        test('should test successful API connection', async () => {
            const mockSettings = createMockSettings();
            fetch.mockImplementation(() => createMockAPIResponse('Connection test successful'));

            const result = await backgroundManager.testAPIConnection(mockSettings);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Connection successful!');
        });

        test('should handle API connection failure', async () => {
            const mockSettings = createMockSettings();
            fetch.mockImplementation(() => Promise.resolve({
                ok: false,
                status: 401,
                text: () => Promise.resolve('Unauthorized')
            }));

            const result = await backgroundManager.testAPIConnection(mockSettings);

            expect(result.success).toBe(false);
            expect(result.message).toContain('HTTP 401');
        });

        test('should handle network errors during connection test', async () => {
            const mockSettings = createMockSettings();
            fetch.mockRejectedValue(new Error('Network unavailable'));

            const result = await backgroundManager.testAPIConnection(mockSettings);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Connection failed: Network unavailable');
        });
    });

    describe('Settings Management', () => {
        test('should get settings from storage', async () => {
            const mockSettings = createMockSettings();
            browser.storage.sync.get.mockResolvedValue({ llmSettings: mockSettings });

            const settings = await backgroundManager.getSettings();

            expect(settings).toEqual(mockSettings);
            expect(browser.storage.sync.get).toHaveBeenCalledWith(['llmSettings']);
        });

        test('should return empty object when no settings found', async () => {
            browser.storage.sync.get.mockResolvedValue({});

            const settings = await backgroundManager.getSettings();

            expect(settings).toEqual({});
        });

        test('should update settings in storage', async () => {
            const newSettings = createMockSettings({ model: 'updated-model' });

            await backgroundManager.updateSettings(newSettings);

            expect(browser.storage.sync.set).toHaveBeenCalledWith({
                llmSettings: newSettings
            });
        });

        test('should handle storage errors', async () => {
            browser.storage.sync.get.mockRejectedValue(new Error('Storage access denied'));

            await expect(backgroundManager.getSettings()).rejects.toThrow('Failed to get settings: Storage access denied');
        });
    });
});