// Options page functionality for LLM Utilities Extension
class OptionsController {
    constructor() {
        this.defaultSettings = {
            apiUrl: 'http://localhost:4000/v1/chat/completions',
            model: 'gpt-4o',
            headers: {},
            defaultSummaryPrompt: 'Please provide a concise summary of the following content:',
            requestTimeout: 30,
            autoCopyResults: false
        };

        this.currentSettings = { ...this.defaultSettings };
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
    }

    initializeElements() {
        // API Configuration
        this.apiUrlInput = document.getElementById('api-url');
        this.modelNameInput = document.getElementById('model-name');
        this.apiHeadersInput = document.getElementById('api-headers');
        this.saveSettingsBtn = document.getElementById('save-settings');
        this.testConnectionBtn = document.getElementById('test-connection');
        this.resetSettingsBtn = document.getElementById('reset-settings');
        this.settingsStatus = document.getElementById('settings-status');

        // Prompt Settings
        this.defaultSummaryPromptInput = document.getElementById('default-summary-prompt');
        this.savePromptsBtn = document.getElementById('save-prompts');
        this.promptStatus = document.getElementById('prompt-status');

        // Advanced Settings
        this.requestTimeoutInput = document.getElementById('request-timeout');
        this.autoCopyResultsInput = document.getElementById('auto-copy-results');
        this.saveAdvancedBtn = document.getElementById('save-advanced');
        this.advancedStatus = document.getElementById('advanced-status');

        // Data Management
        this.exportSettingsBtn = document.getElementById('export-settings');
        this.importSettingsBtn = document.getElementById('import-settings');
        this.importFile = document.getElementById('import-file');
        this.dataStatus = document.getElementById('data-status');
    }

    bindEvents() {
        // API Configuration
        this.saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());
        this.testConnectionBtn.addEventListener('click', () => this.handleTestConnection());
        this.resetSettingsBtn.addEventListener('click', () => this.handleResetSettings());

        // Prompt Settings
        this.savePromptsBtn.addEventListener('click', () => this.handleSavePrompts());

        // Advanced Settings
        this.saveAdvancedBtn.addEventListener('click', () => this.handleSaveAdvanced());

        // Data Management
        this.exportSettingsBtn.addEventListener('click', () => this.handleExportSettings());
        this.importSettingsBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.handleImportSettings(e));

        // Auto-save on input changes (with debouncing)
        this.debounceTimer = null;
        const inputs = [this.apiUrlInput, this.modelNameInput, this.defaultSummaryPromptInput];
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => this.autoSave(), 1000);
            });
        });
    }

    async loadSettings() {
        try {
            const result = await browser.storage.sync.get(['llmSettings']);
            if (result.llmSettings) {
                this.currentSettings = { ...this.defaultSettings, ...result.llmSettings };
            }
            this.populateForm();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('settings', 'Error loading settings: ' + error.message, 'error');
        }
    }

    populateForm() {
        // API Configuration
        this.apiUrlInput.value = this.currentSettings.apiUrl || '';
        this.modelNameInput.value = this.currentSettings.model || '';
        this.apiHeadersInput.value = JSON.stringify(this.currentSettings.headers || {}, null, 2);

        // Prompt Settings
        this.defaultSummaryPromptInput.value = this.currentSettings.defaultSummaryPrompt || '';

        // Advanced Settings
        this.requestTimeoutInput.value = this.currentSettings.requestTimeout || 30;
        this.autoCopyResultsInput.checked = this.currentSettings.autoCopyResults || false;
    }

    async saveSettings() {
        try {
            await browser.storage.sync.set({ llmSettings: this.currentSettings });
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    async handleSaveSettings() {
        try {
            this.setButtonLoading('save-settings', true);

            // Validate API URL
            const apiUrl = this.apiUrlInput.value.trim();
            if (!apiUrl || !this.isValidUrl(apiUrl)) {
                throw new Error('Please enter a valid API URL');
            }

            // Validate model name
            const model = this.modelNameInput.value.trim();
            if (!model) {
                throw new Error('Please enter a model name');
            }

            // Validate headers JSON
            let headers = {};
            const headersText = this.apiHeadersInput.value.trim();
            if (headersText) {
                try {
                    headers = JSON.parse(headersText);
                    if (typeof headers !== 'object' || Array.isArray(headers)) {
                        throw new Error('Headers must be a valid JSON object');
                    }
                } catch (error) {
                    throw new Error('Invalid JSON format for headers: ' + error.message);
                }
            }

            // Update settings
            this.currentSettings.apiUrl = apiUrl;
            this.currentSettings.model = model;
            this.currentSettings.headers = headers;

            await this.saveSettings();
            this.showStatus('settings', 'API settings saved successfully!', 'success');

        } catch (error) {
            console.error('Error saving API settings:', error);
            this.showStatus('settings', error.message, 'error');
        } finally {
            this.setButtonLoading('save-settings', false);
        }
    }

    async handleTestConnection() {
        try {
            this.setButtonLoading('test-connection', true);

            const testPayload = {
                model: this.currentSettings.model,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello! This is a connection test.'
                    }
                ]
            };

            const response = await fetch(this.currentSettings.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.currentSettings.headers
                },
                body: JSON.stringify(testPayload)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.choices && data.choices[0]) {
                    this.showStatus('settings', 'Connection successful! API is responding correctly.', 'success');
                } else {
                    this.showStatus('settings', 'Connection established but unexpected response format.', 'warning');
                }
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

        } catch (error) {
            console.error('Connection test failed:', error);
            this.showStatus('settings', 'Connection failed: ' + error.message, 'error');
        } finally {
            this.setButtonLoading('test-connection', false);
        }
    }

    async handleResetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            try {
                this.currentSettings = { ...this.defaultSettings };
                await this.saveSettings();
                this.populateForm();
                this.showStatus('settings', 'Settings reset to defaults successfully!', 'success');
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.showStatus('settings', 'Error resetting settings: ' + error.message, 'error');
            }
        }
    }

    async handleSavePrompts() {
        try {
            this.setButtonLoading('save-prompts', true);

            const prompt = this.defaultSummaryPromptInput.value.trim();
            if (!prompt) {
                throw new Error('Please enter a default summary prompt');
            }

            this.currentSettings.defaultSummaryPrompt = prompt;
            await this.saveSettings();
            this.showStatus('prompt', 'Prompt settings saved successfully!', 'success');

        } catch (error) {
            console.error('Error saving prompt settings:', error);
            this.showStatus('prompt', error.message, 'error');
        } finally {
            this.setButtonLoading('save-prompts', false);
        }
    }

    async handleSaveAdvanced() {
        try {
            this.setButtonLoading('save-advanced', true);

            const timeout = parseInt(this.requestTimeoutInput.value);
            if (isNaN(timeout) || timeout < 5 || timeout > 120) {
                throw new Error('Request timeout must be between 5 and 120 seconds');
            }

            this.currentSettings.requestTimeout = timeout;
            this.currentSettings.autoCopyResults = this.autoCopyResultsInput.checked;

            await this.saveSettings();
            this.showStatus('advanced', 'Advanced settings saved successfully!', 'success');

        } catch (error) {
            console.error('Error saving advanced settings:', error);
            this.showStatus('advanced', error.message, 'error');
        } finally {
            this.setButtonLoading('save-advanced', false);
        }
    }

    async handleExportSettings() {
        try {
            const exportData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                settings: this.currentSettings
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `llm-utilities-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showStatus('data', 'Settings exported successfully!', 'success');

        } catch (error) {
            console.error('Error exporting settings:', error);
            this.showStatus('data', 'Error exporting settings: ' + error.message, 'error');
        }
    }

    async handleImportSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.settings) {
                throw new Error('Invalid settings file format');
            }

            // Validate imported settings
            const validatedSettings = this.validateImportedSettings(importData.settings);

            if (confirm('This will replace all current settings. Continue?')) {
                this.currentSettings = { ...this.defaultSettings, ...validatedSettings };
                await this.saveSettings();
                this.populateForm();
                this.showStatus('data', 'Settings imported successfully!', 'success');
            }

        } catch (error) {
            console.error('Error importing settings:', error);
            this.showStatus('data', 'Error importing settings: ' + error.message, 'error');
        } finally {
            // Reset file input
            this.importFile.value = '';
        }
    }

    validateImportedSettings(settings) {
        const validated = {};

        // Validate API URL
        if (settings.apiUrl && this.isValidUrl(settings.apiUrl)) {
            validated.apiUrl = settings.apiUrl;
        }

        // Validate model
        if (settings.model && typeof settings.model === 'string') {
            validated.model = settings.model;
        }

        // Validate headers
        if (settings.headers && typeof settings.headers === 'object' && !Array.isArray(settings.headers)) {
            validated.headers = settings.headers;
        }

        // Validate prompt
        if (settings.defaultSummaryPrompt && typeof settings.defaultSummaryPrompt === 'string') {
            validated.defaultSummaryPrompt = settings.defaultSummaryPrompt;
        }

        // Validate timeout
        if (settings.requestTimeout && typeof settings.requestTimeout === 'number' &&
            settings.requestTimeout >= 5 && settings.requestTimeout <= 120) {
            validated.requestTimeout = settings.requestTimeout;
        }

        // Validate auto-copy
        if (typeof settings.autoCopyResults === 'boolean') {
            validated.autoCopyResults = settings.autoCopyResults;
        }

        return validated;
    }

    async autoSave() {
        try {
            // Only auto-save basic settings, not all form changes
            const apiUrl = this.apiUrlInput.value.trim();
            const model = this.modelNameInput.value.trim();
            const prompt = this.defaultSummaryPromptInput.value.trim();

            if (apiUrl && this.isValidUrl(apiUrl)) {
                this.currentSettings.apiUrl = apiUrl;
            }
            if (model) {
                this.currentSettings.model = model;
            }
            if (prompt) {
                this.currentSettings.defaultSummaryPrompt = prompt;
            }

            await this.saveSettings();
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        const textSpan = button.querySelector('.btn-text');
        const spinnerSpan = button.querySelector('.btn-spinner');

        if (loading) {
            button.disabled = true;
            textSpan.style.display = 'none';
            spinnerSpan.style.display = 'inline';
        } else {
            button.disabled = false;
            textSpan.style.display = 'inline';
            spinnerSpan.style.display = 'none';
        }
    }

    showStatus(section, message, type = 'info') {
        let statusElement;
        switch (section) {
            case 'settings':
                statusElement = this.settingsStatus;
                break;
            case 'prompt':
                statusElement = this.promptStatus;
                break;
            case 'advanced':
                statusElement = this.advancedStatus;
                break;
            case 'data':
                statusElement = this.dataStatus;
                break;
            default:
                return;
        }

        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.style.display = 'block';

        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsController();
});