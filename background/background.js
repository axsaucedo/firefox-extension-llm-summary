// Minimal background script
browser.runtime.onInstalled.addListener(() => {
    // Create context menu
    browser.contextMenus.create({
        id: "summarize-selection",
        title: "Summarize with LLM",
        contexts: ["selection"]
    });
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "summarize-selection") {
        // Open popup (or could trigger summarization directly)
        browser.action.openPopup();
    }
});

// Basic message handling if needed
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Reserved for future inter-component communication
    return false;
});