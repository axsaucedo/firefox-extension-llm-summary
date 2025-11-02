// Minimal content extraction - let LLM handle the filtering
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getContent') {
        let content = '';

        if (message.type === 'selected') {
            content = window.getSelection().toString().trim();
        } else {
            content = document.body.textContent || document.body.innerText || '';
        }

        // Basic cleanup - remove excessive whitespace
        content = content.replace(/\s+/g, ' ').trim();

        sendResponse({ content });
        return true;
    }
});