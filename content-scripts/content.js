// Auto-detect selection vs full page content
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getContent') {
        // Try selection first, fallback to full page
        let content = window.getSelection().toString() || document.body.innerText;

        if (!content) {
            content =  'Error: No content found; try select the page.';
        }

        // Basic cleanup - remove excessive whitespace
        content = content.replace(/\s+/g, ' ').trim();

        sendResponse({ content });
        return true;
    }
});
