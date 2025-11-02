// Minimal options page
document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('save-btn').addEventListener('click', saveSettings);

async function loadSettings() {
    try {
        const data = await browser.storage.sync.get('llmSettings');
        const settings = data.llmSettings || {
            apiUrl: 'http://localhost:4000/v1/chat/completions',
            model: 'openai/gpt-4o',
            timeout: 30
        };

        document.getElementById('api-url').value = settings.apiUrl;
        document.getElementById('model').value = settings.model;
        document.getElementById('timeout').value = settings.timeout;
    } catch (error) {
        showStatus('Error loading settings', true);
    }
}

async function saveSettings() {
    try {
        const settings = {
            apiUrl: document.getElementById('api-url').value,
            model: document.getElementById('model').value,
            timeout: parseInt(document.getElementById('timeout').value) || 30
        };

        await browser.storage.sync.set({ llmSettings: settings });
        showStatus('Settings saved successfully');
    } catch (error) {
        showStatus('Error saving settings', true);
    }
}

function showStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = isError ? 'error' : 'success';
    setTimeout(() => status.textContent = '', 3000);
}