// Content script for LLM Utilities Extension
// This script runs on web pages to extract content

class ContentExtractor {
    constructor() {
        this.lastSelection = '';
        this.setupMessageListener();
        this.setupSelectionTracking();
    }

    setupMessageListener() {
        // Listen for messages from the popup
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'getContent') {
                console.log('DEBUG: Received getContent message, type:', message.type);
                const content = this.extractContent(message.type);
                console.log('DEBUG: Extracted content length:', content.length);
                sendResponse({ content: content });
                return true; // Keep message channel open for async response
            }
        });
    }

    setupSelectionTracking() {
        // Listen for selection changes and cache valid selections
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const selectedText = selection.toString().trim();
                if (selectedText) {
                    this.lastSelection = selectedText;
                    console.log('DEBUG: Cached new selection:', selectedText.substring(0, 50) + '...');
                }
            }
        });

        // Also capture selection on mouseup (as backup)
        document.addEventListener('mouseup', () => {
            setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                if (selectedText) {
                    this.lastSelection = selectedText;
                    console.log('DEBUG: Mouseup - cached selection:', selectedText.substring(0, 50) + '...');
                }
            }, 10); // Small delay to ensure selection is complete
        });

        console.log('DEBUG: Selection tracking initialized');
    }

    extractContent(type) {
        try {
            switch (type) {
                case 'selected':
                    return this.getSelectedText();
                case 'page':
                    return this.getPageContent();
                default:
                    return '';
            }
        } catch (error) {
            console.error('Error extracting content:', error);
            return '';
        }
    }

    getSelectedText() {
        const selection = window.getSelection();
        console.log('DEBUG: getSelectedText called, rangeCount:', selection.rangeCount);

        let selectedText = '';

        if (selection.rangeCount > 0) {
            selectedText = selection.toString().trim();
            console.log('DEBUG: Current selection text length:', selectedText.length);
            console.log('DEBUG: Current selection preview:', selectedText.substring(0, 50) + '...');
        }

        // If no current selection but we have cached selection, use it
        if (!selectedText && this.lastSelection) {
            selectedText = this.lastSelection;
            console.log('DEBUG: Using cached selection, length:', selectedText.length);
            console.log('DEBUG: Cached selection preview:', selectedText.substring(0, 50) + '...');
            // Clear the cache after using it
            this.lastSelection = '';
        }

        // If still no text, return empty string
        if (!selectedText) {
            console.log('DEBUG: No text selected and no cached selection available');
            return '';
        }

        // Clean up the text
        const cleanedText = this.cleanText(selectedText);
        console.log('DEBUG: Final cleaned text length:', cleanedText.length);
        return cleanedText;
    }

    getPageContent() {
        // Try to get content from common article containers first
        const articleSelectors = [
            'article',
            '[role="main"]',
            'main',
            '.content',
            '.post-content',
            '.entry-content',
            '.article-content',
            '.story-body',
            '.post-body'
        ];

        let content = '';

        // Try to find article content first
        for (const selector of articleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                content = this.extractTextFromElement(element);
                if (content && content.length > 100) { // Minimum content length
                    return this.cleanText(content);
                }
            }
        }

        // If no article content found, extract from body but exclude common navigation/footer elements
        if (!content) {
            content = this.extractBodyContent();
        }

        return this.cleanText(content);
    }

    extractTextFromElement(element) {
        // Clone the element to avoid modifying the original
        const clone = element.cloneNode(true);

        // Remove unwanted elements
        const unwantedSelectors = [
            'script',
            'style',
            'nav',
            'header',
            'footer',
            '.advertisement',
            '.ads',
            '.social-share',
            '.comments',
            '.sidebar',
            '.related-posts',
            '.newsletter-signup',
            '[role="navigation"]',
            '[role="banner"]',
            '[role="contentinfo"]'
        ];

        unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Extract text content
        return clone.textContent || clone.innerText || '';
    }

    extractBodyContent() {
        const body = document.body.cloneNode(true);

        // Remove unwanted elements from body
        const unwantedSelectors = [
            'script',
            'style',
            'nav',
            'header',
            'footer',
            'aside',
            '.advertisement',
            '.ads',
            '.social-share',
            '.comments',
            '.sidebar',
            '.menu',
            '.navigation',
            '.breadcrumb',
            '.search-form',
            '.newsletter',
            '.popup',
            '.modal',
            '.tooltip',
            '[role="navigation"]',
            '[role="banner"]',
            '[role="contentinfo"]',
            '[role="complementary"]'
        ];

        unwantedSelectors.forEach(selector => {
            const elements = body.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        return body.textContent || body.innerText || '';
    }

    cleanText(text) {
        if (!text) return '';

        return text
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove multiple line breaks
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Trim whitespace from start and end
            .trim()
            // Limit to reasonable length (API limits)
            .substring(0, 50000); // Reasonable limit for most APIs
    }

    // Additional utility methods for future enhancements
    getPageTitle() {
        return document.title || '';
    }

    getPageUrl() {
        return window.location.href || '';
    }

    getPageMetadata() {
        const metadata = {
            title: this.getPageTitle(),
            url: this.getPageUrl(),
            description: '',
            author: '',
            publishDate: ''
        };

        // Try to get meta description
        const descMeta = document.querySelector('meta[name="description"]') ||
                        document.querySelector('meta[property="og:description"]');
        if (descMeta) {
            metadata.description = descMeta.getAttribute('content') || '';
        }

        // Try to get author
        const authorMeta = document.querySelector('meta[name="author"]') ||
                          document.querySelector('meta[property="article:author"]') ||
                          document.querySelector('[rel="author"]');
        if (authorMeta) {
            metadata.author = authorMeta.getAttribute('content') || authorMeta.textContent || '';
        }

        // Try to get publish date
        const dateMeta = document.querySelector('meta[property="article:published_time"]') ||
                        document.querySelector('meta[name="publish-date"]') ||
                        document.querySelector('time[datetime]');
        if (dateMeta) {
            metadata.publishDate = dateMeta.getAttribute('content') ||
                                 dateMeta.getAttribute('datetime') || '';
        }

        return metadata;
    }

    // Method to highlight text (for future features)
    highlightText(text) {
        if (!text) return;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;

        while (node = walker.nextNode()) {
            if (node.textContent.includes(text)) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            const content = textNode.textContent;
            const index = content.indexOf(text);

            if (index !== -1) {
                const before = content.substring(0, index);
                const match = content.substring(index, index + text.length);
                const after = content.substring(index + text.length);

                const fragment = document.createDocumentFragment();

                if (before) fragment.appendChild(document.createTextNode(before));

                const highlight = document.createElement('mark');
                highlight.style.backgroundColor = 'yellow';
                highlight.style.padding = '2px';
                highlight.textContent = match;
                fragment.appendChild(highlight);

                if (after) fragment.appendChild(document.createTextNode(after));

                parent.replaceChild(fragment, textNode);
            }
        });
    }
}

// Initialize content extractor
const contentExtractor = new ContentExtractor();

// Export for testing purposes (if in test environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentExtractor;
}