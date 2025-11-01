// Background script for LLM Utilities Extension
// Handles extension lifecycle, context menus, and communication between components

class BackgroundManager {
    constructor() {
        this.setupEventListeners();
        this.initializeExtension();
    }

    setupEventListeners() {
        // Extension installation/update
        browser.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Extension startup
        browser.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });

        // Message handling between popup and content scripts
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            return this.handleMessage(message, sender, sendResponse);
        });

        // Context menu clicks
        browser.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });

        // Tab updates (for future features like auto-detection)
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.handleTabUpdate(tabId, tab);
            }
        });
    }

    async initializeExtension() {
        try {
            // Create context menus
            await this.createContextMenus();

            // Initialize default settings if not present
            await this.initializeDefaultSettings();

            console.log('LLM Utilities extension initialized successfully');
        } catch (error) {
            console.error('Error initializing extension:', error);
        }
    }

    async handleInstallation(details) {
        console.log('Extension installed/updated:', details.reason);

        if (details.reason === 'install') {
            // First installation
            await this.initializeDefaultSettings();

            // Open options page for first-time setup
            browser.runtime.openOptionsPage();
        } else if (details.reason === 'update') {
            // Extension updated
            const previousVersion = details.previousVersion;
            console.log('Updated from version:', previousVersion);

            // Handle any migration logic here if needed
            await this.handleVersionMigration(previousVersion);
        }
    }

    handleStartup() {
        console.log('LLM Utilities extension started');
    }

    async createContextMenus() {
        try {
            // Remove existing context menus
            await browser.contextMenus.removeAll();

            // Create context menu for selected text
            browser.contextMenus.create({
                id: 'summarize-selection',
                title: 'Summarize with LLM',
                contexts: ['selection'],
                enabled: true
            });

            // Create context menu for page
            browser.contextMenus.create({
                id: 'summarize-page',
                title: 'Summarize Page with LLM',
                contexts: ['page'],
                enabled: true
            });

            // Separator
            browser.contextMenus.create({
                id: 'separator-1',
                type: 'separator',
                contexts: ['selection', 'page']
            });

            // Settings menu
            browser.contextMenus.create({
                id: 'open-settings',
                title: 'LLM Utilities Settings',
                contexts: ['page'],
                enabled: true
            });

        } catch (error) {
            console.error('Error creating context menus:', error);
        }
    }

    async initializeDefaultSettings() {
        try {
            const result = await browser.storage.sync.get(['llmSettings']);

            if (!result.llmSettings) {
                const defaultSettings = {
                    apiUrl: 'http://localhost:4000/v1/chat/completions',
                    model: 'openai/gpt-4o',
                    headers: {},
                    defaultSummaryPrompt: 'Please provide a concise summary of the following content:',
                    requestTimeout: 30,
                    autoCopyResults: false
                };

                await browser.storage.sync.set({
                    llmSettings: defaultSettings,
                    savedPrompt: defaultSettings.defaultSummaryPrompt
                });

                console.log('Default settings initialized');
            }
        } catch (error) {
            console.error('Error initializing default settings:', error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, data: settings });
                    break;

                case 'updateSettings':
                    await this.updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'testConnection':
                    const connectionResult = await this.testAPIConnection(message.settings);
                    sendResponse(connectionResult);
                    break;

                case 'openOptionsPage':
                    browser.runtime.openOptionsPage();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }

        return true; // Keep message channel open for async responses
    }

    async handleContextMenuClick(info, tab) {
        try {
            switch (info.menuItemId) {
                case 'summarize-selection':
                    await this.triggerSummarization(tab, 'selected');
                    break;

                case 'summarize-page':
                    await this.triggerSummarization(tab, 'page');
                    break;

                case 'open-settings':
                    browser.runtime.openOptionsPage();
                    break;
            }
        } catch (error) {
            console.error('Error handling context menu click:', error);
        }
    }

    async triggerSummarization(tab, contentType) {
        try {
            // Open popup programmatically (if possible) or show notification
            // Note: Firefox doesn't allow programmatic popup opening, so we'll show a notification
            browser.notifications.create({
                type: 'basic',
                iconUrl: 'popup/icons/icon-48.png',
                title: 'LLM Utilities',
                message: `Click the extension icon to summarize ${contentType === 'selected' ? 'selected text' : 'the page'}.`
            });
        } catch (error) {
            console.error('Error triggering summarization:', error);
        }
    }

    handleTabUpdate(tabId, tab) {
        // Future enhancement: Auto-detect articles or specific content types
        // For now, this is just a placeholder for future features
    }

    async getSettings() {
        try {
            const result = await browser.storage.sync.get(['llmSettings']);
            return result.llmSettings || {};
        } catch (error) {
            throw new Error('Failed to get settings: ' + error.message);
        }
    }

    async updateSettings(settings) {
        try {
            await browser.storage.sync.set({ llmSettings: settings });
        } catch (error) {
            throw new Error('Failed to update settings: ' + error.message);
        }
    }

    async testAPIConnection(settings) {
        try {
            const testPayload = {
                model: settings.model,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello! This is a connection test from LLM Utilities extension.'
                    }
                ]
            };

            const response = await fetch(settings.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...settings.headers
                },
                body: JSON.stringify(testPayload)
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    message: 'Connection successful!',
                    data: data
                };
            } else {
                const errorText = await response.text();
                return {
                    success: false,
                    message: `Connection failed: HTTP ${response.status} - ${errorText}`
                };
            }

        } catch (error) {
            return {
                success: false,
                message: 'Connection failed: ' + error.message
            };
        }
    }

    async handleVersionMigration(previousVersion) {
        // Handle any necessary data migration between versions
        console.log(`Migrating from version ${previousVersion}`);

        // Example migration logic:
        // if (previousVersion < '1.1.0') {
        //     await this.migrateToV11();
        // }
    }

    // Utility method for logging (can be enhanced with different log levels)
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        console.log(logMessage, data || '');

        // Future enhancement: Store logs for debugging
        // await this.storeLogs(level, message, data);
    }
}

// Initialize background manager
const backgroundManager = new BackgroundManager();

// Export for testing purposes (if in test environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundManager;
}