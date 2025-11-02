// Minimal LLM Utilities Extension - Simple function-based approach
let settings = {
    apiUrl: 'http://localhost:4000/v1/chat/completions',
    model: 'openai/gpt-4o',
    timeout: 30
};

// Load settings and initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    document.getElementById('summarize-btn').addEventListener('click', summarize);
    document.getElementById('options-btn').addEventListener('click', () => browser.runtime.openOptionsPage());
});

async function loadSettings() {
    try {
        const data = await browser.storage.sync.get('llmSettings');
        if (data.llmSettings) settings = { ...settings, ...data.llmSettings };
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

async function summarize() {
    const resultDiv = document.getElementById('result');
    const button = document.getElementById('summarize-btn');

    button.disabled = true;
    button.textContent = 'Processing...';
    resultDiv.textContent = '';

    try {
        // Get content from current tab
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        const contentType = document.querySelector('input[name="content"]:checked').value;
        const prompt = document.getElementById('prompt').value || 'Summarize this content:';

        const response = await browser.tabs.sendMessage(tab.id, {
            action: 'getContent',
            type: contentType
        });

        if (!response?.content) {
            throw new Error('No content found');
        }

        // Call LLM API
        const apiResponse = await fetch(settings.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: settings.model,
                messages: [{ role: 'user', content: `${prompt}\n\n${response.content}` }]
            })
        });

        if (!apiResponse.ok) {
            throw new Error(`API error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        const summary = data.choices?.[0]?.message?.content || 'No summary generated';
        resultDiv.textContent = summary;

    } catch (error) {
        resultDiv.textContent = `Error: ${error.message}`;
    } finally {
        button.disabled = false;
        button.textContent = 'Summarize';
    }
}