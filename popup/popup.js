// Popup functionality for LLM Utilities Extension
class PopupController {
    constructor() {
        this.currentView = 'main';
        this.settings = {
            apiUrl: 'http://localhost:4000/v1/chat/completions',
            model: 'gpt-4o',
            headers: {}
        };
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.loadSavedPrompt();
    }

    initializeElements() {
        // Views
        this.mainView = document.getElementById('main-view');
        this.summariseView = document.getElementById('summarise-view');
        this.optionsView = document.getElementById('options-view');

        // Navigation buttons
        this.summariseButton = document.getElementById('summarise-button');
        this.optionsButton = document.getElementById('options-button');
        this.backFromSummarise = document.getElementById('back-from-summarise');
        this.backFromOptions = document.getElementById('back-from-options');

        // Summarise elements
        this.selectedContentRadio = document.getElementById('selected-content');
        this.pageContentRadio = document.getElementById('page-content');
        this.promptInput = document.getElementById('prompt-input');
        this.summariseAction = document.getElementById('summarise-action');
        this.summaryOutput = document.getElementById('summary-output');
        this.summaryText = document.getElementById('summary-text');
        this.copySummary = document.getElementById('copy-summary');
        this.errorMessage = document.getElementById('error-message');
        this.buttonText = document.querySelector('.button-text');
        this.loadingSpinner = document.querySelector('.loading-spinner');

        // Settings elements
        this.apiUrlInput = document.getElementById('api-url');
        this.modelNameInput = document.getElementById('model-name');
        this.apiHeadersInput = document.getElementById('api-headers');
        this.saveSettings = document.getElementById('save-settings');
        this.settingsStatus = document.getElementById('settings-status');
    }

    bindEvents() {
        // Navigation
        this.summariseButton.addEventListener('click', () => this.showView('summarise'));
        this.optionsButton.addEventListener('click', () => this.showView('options'));
        this.backFromSummarise.addEventListener('click', () => this.showView('main'));
        this.backFromOptions.addEventListener('click', () => this.showView('main'));

        // Summarise functionality
        this.summariseAction.addEventListener('click', () => this.handleSummarise());
        this.copySummary.addEventListener('click', () => this.copyToClipboard());

        // Save prompt changes
        this.promptInput.addEventListener('input', () => this.savePrompt());

        // Settings functionality
        this.saveSettings.addEventListener('click', () => this.handleSaveSettings());
    }

    showView(viewName) {
        // Hide all views
        this.mainView.classList.remove('active');
        this.summariseView.classList.remove('active');
        this.optionsView.classList.remove('active');

        // Show selected view
        switch (viewName) {
            case 'main':
                this.mainView.classList.add('active');
                break;
            case 'summarise':
                this.summariseView.classList.add('active');
                break;
            case 'options':
                this.optionsView.classList.add('active');
                this.loadSettingsToForm();
                break;
        }
        this.currentView = viewName;
    }

    async loadSettings() {
        try {
            const result = await browser.storage.sync.get(['llmSettings']);
            if (result.llmSettings) {
                this.settings = { ...this.settings, ...result.llmSettings };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await browser.storage.sync.set({ llmSettings: this.settings });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    async loadSavedPrompt() {
        try {
            const result = await browser.storage.sync.get(['savedPrompt']);
            if (result.savedPrompt) {
                this.promptInput.value = result.savedPrompt;
            } else {
                this.promptInput.value = 'Please provide a concise summary of the following content:';
            }
        } catch (error) {
            console.error('Error loading saved prompt:', error);
            this.promptInput.value = 'Please provide a concise summary of the following content:';
        }
    }

    async savePrompt() {
        try {
            await browser.storage.sync.set({ savedPrompt: this.promptInput.value });
        } catch (error) {
            console.error('Error saving prompt:', error);
        }
    }

    loadSettingsToForm() {
        this.apiUrlInput.value = this.settings.apiUrl;
        this.modelNameInput.value = this.settings.model;
        this.apiHeadersInput.value = JSON.stringify(this.settings.headers, null, 2);
    }

    async handleSaveSettings() {
        try {
            // Validate API URL
            const apiUrl = this.apiUrlInput.value.trim();
            if (!apiUrl || !this.isValidUrl(apiUrl)) {
                this.showSettingsStatus('Please enter a valid API URL', 'error');
                return;
            }

            // Validate model name
            const model = this.modelNameInput.value.trim();
            if (!model) {
                this.showSettingsStatus('Please enter a model name', 'error');
                return;
            }

            // Validate headers JSON
            let headers = {};
            const headersText = this.apiHeadersInput.value.trim();
            if (headersText) {
                try {
                    headers = JSON.parse(headersText);
                    if (typeof headers !== 'object' || Array.isArray(headers)) {
                        throw new Error('Headers must be an object');
                    }
                } catch (error) {
                    this.showSettingsStatus('Invalid JSON format for headers', 'error');
                    return;
                }
            }

            // Update settings
            this.settings = { apiUrl, model, headers };
            await this.saveSettings();

            this.showSettingsStatus('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showSettingsStatus('Error saving settings: ' + error.message, 'error');
        }
    }

    showSettingsStatus(message, type) {
        this.settingsStatus.textContent = message;
        this.settingsStatus.className = `status-message ${type}`;
        this.settingsStatus.style.display = 'block';

        setTimeout(() => {
            this.settingsStatus.style.display = 'none';
        }, 3000);
    }

    async handleSummarise() {
        try {
            this.setLoadingState(true);
            this.hideError();

            // Get content based on selection
            const contentType = this.selectedContentRadio.checked ? 'selected' : 'page';
            const content = await this.getPageContent(contentType);

            if (!content || content.trim().length === 0) {
                throw new Error(contentType === 'selected' ?
                    'No text selected. Please select some text on the page or choose "Full Page" option.' :
                    'No content found on the page.');
            }

            // Get custom prompt
            const prompt = this.promptInput.value.trim() || 'Please provide a concise summary of the following content:';

            // Make API request
            const summary = await this.callLLMAPI(prompt, content);

            // Display result
            this.displaySummary(summary);

        } catch (error) {
            console.error('Error during summarisation:', error);
            this.showError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    async getPageContent(type) {
        return new Promise((resolve) => {
            browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    browser.tabs.sendMessage(tabs[0].id, {
                        action: 'getContent',
                        type: type
                    }, (response) => {
                        if (browser.runtime.lastError) {
                            console.error('Content script error:', browser.runtime.lastError);
                            resolve('');
                        } else {
                            resolve(response?.content || '');
                        }
                    });
                } else {
                    resolve('');
                }
            });
        });
    }

    async callLLMAPI(prompt, content) {
        const requestBody = {
            model: this.settings.model,
            messages: [
                {
                    role: 'user',
                    content: `${prompt}\n\n${content}`
                }
            ]
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.settings.headers
            },
            body: JSON.stringify(requestBody)
        };

        const response = await fetch(this.settings.apiUrl, requestOptions);

        if (!response.ok) {
            let errorMessage = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                // Use default error message if can't parse error response
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from API');
        }

        return data.choices[0].message.content;
    }

    displaySummary(summary) {
        this.summaryText.textContent = summary;
        this.summaryOutput.style.display = 'block';
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.summaryText.textContent);

            // Visual feedback
            const originalText = this.copySummary.textContent;
            this.copySummary.textContent = '✓ Copied!';
            this.copySummary.style.background = '#28a745';

            setTimeout(() => {
                this.copySummary.textContent = originalText;
                this.copySummary.style.background = '';
            }, 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Fallback for older browsers
            this.fallbackCopyToClipboard(this.summaryText.textContent);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            const originalText = this.copySummary.textContent;
            this.copySummary.textContent = '✓ Copied!';
            setTimeout(() => {
                this.copySummary.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Fallback copy failed:', error);
        }

        document.body.removeChild(textArea);
    }

    setLoadingState(loading) {
        this.summariseAction.disabled = loading;
        if (loading) {
            this.buttonText.style.display = 'none';
            this.loadingSpinner.style.display = 'inline';
        } else {
            this.buttonText.style.display = 'inline';
            this.loadingSpinner.style.display = 'none';
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.summaryOutput.style.display = 'block';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
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

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});