// Auto-detect selection vs full page content
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getContent') {
        // Try selection first, fallback to full page
        let content = window.getSelection().toString().trim();

        if (!content) {
            content = document.body.textContent || document.body.innerText || '';
        }

        // Basic cleanup - remove excessive whitespace
        content = content.replace(/\s+/g, ' ').trim();

        sendResponse({ content });
        return true;
    }
});