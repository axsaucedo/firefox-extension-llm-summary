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
        console.log('DEBUG: Starting enhanced page content extraction');

        // Layer 1: Enhanced semantic HTML detection with priority scoring
        const semanticSelectors = [
            // High priority semantic selectors
            { selector: 'main[role="main"]', priority: 100 },
            { selector: 'article', priority: 95 },
            { selector: '[role="main"]', priority: 90 },
            { selector: 'main', priority: 85 },

            // Academic and research site patterns
            { selector: '.container .content', priority: 80 },
            { selector: '.page-content', priority: 75 },
            { selector: '.post-content', priority: 75 },
            { selector: '.entry-content', priority: 75 },
            { selector: '.article-content', priority: 75 },
            { selector: '.story-body', priority: 70 },
            { selector: '.post-body', priority: 70 },

            // Documentation and blog patterns
            { selector: '.markdown-body', priority: 80 },
            { selector: '.prose', priority: 75 },
            { selector: '.content-area', priority: 70 },
            { selector: '.main-content', priority: 70 },
            { selector: '.primary-content', priority: 70 },

            // Generic content patterns
            { selector: '.content', priority: 60 },
            { selector: '#content', priority: 60 },
            { selector: '#main', priority: 55 },
            { selector: '.wrapper .content', priority: 50 },
            { selector: '.container', priority: 40 }
        ];

        // Try semantic selectors first
        for (const { selector, priority } of semanticSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`DEBUG: Trying selector "${selector}" with priority ${priority}`);
                const content = this.extractTextFromElement(element);
                const contentScore = this.scoreContent(element, content);

                console.log(`DEBUG: Content length: ${content.length}, Score: ${contentScore}`);

                // Lower threshold for high-priority selectors, higher for generic ones
                const threshold = priority > 70 ? 50 : 100;

                if (content && content.length > threshold && contentScore > 0.3) {
                    console.log(`DEBUG: Using content from "${selector}"`);
                    return this.cleanText(content);
                }
            }
        }

        // Layer 2: Heuristic content detection using content density analysis
        console.log('DEBUG: Falling back to heuristic content detection');
        const heuristicContent = this.findContentByHeuristics();
        if (heuristicContent && heuristicContent.length > 100) {
            console.log('DEBUG: Using heuristic-detected content');
            return this.cleanText(heuristicContent);
        }

        // Layer 3: Intelligent content scoring of all elements
        console.log('DEBUG: Falling back to content scoring analysis');
        const scoredContent = this.findContentByScoring();
        if (scoredContent && scoredContent.length > 100) {
            console.log('DEBUG: Using scored content');
            return this.cleanText(scoredContent);
        }

        // Layer 4: Enhanced body extraction as final fallback
        console.log('DEBUG: Using enhanced body extraction as final fallback');
        const bodyContent = this.extractBodyContent();
        return this.cleanText(bodyContent);
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

    // Content scoring algorithm inspired by readability heuristics
    scoreContent(element, text) {
        if (!element || !text) return 0;

        let score = 0;
        const textLength = text.length;

        // Base score from text length (normalized)
        score += Math.min(textLength / 1000, 1) * 0.3;

        // Calculate text density (text vs markup ratio)
        const htmlLength = element.innerHTML.length;
        const textDensity = htmlLength > 0 ? textLength / htmlLength : 0;
        score += textDensity * 0.3;

        // Count paragraphs and text blocks
        const paragraphs = element.querySelectorAll('p, div, section, article').length;
        const paragraphScore = Math.min(paragraphs / 10, 1) * 0.2;
        score += paragraphScore;

        // Penalty for high link density (likely navigation)
        const links = element.querySelectorAll('a').length;
        const linkDensity = textLength > 0 ? links / (textLength / 100) : 0;
        score -= Math.min(linkDensity * 0.2, 0.3);

        // Bonus for content indicators
        const contentIndicators = ['time', 'author', 'byline', 'published', 'article', 'content'];
        const classNames = element.className.toLowerCase();
        const hasContentIndicators = contentIndicators.some(indicator =>
            classNames.includes(indicator) || element.id.toLowerCase().includes(indicator)
        );
        if (hasContentIndicators) score += 0.1;

        // Bonus for semantic elements
        if (['ARTICLE', 'MAIN', 'SECTION'].includes(element.tagName)) {
            score += 0.15;
        }

        console.log(`DEBUG: Element score breakdown - Length: ${textLength}, Density: ${textDensity.toFixed(2)}, Paragraphs: ${paragraphs}, Links: ${links}, Final score: ${score.toFixed(2)}`);

        return Math.max(0, Math.min(score, 1)); // Clamp between 0 and 1
    }

    // Heuristic content detection using content density analysis
    findContentByHeuristics() {
        console.log('DEBUG: Starting heuristic content detection');

        const candidates = [];

        // Find all potential content containers
        const potentialContainers = document.querySelectorAll('div, section, article, main, aside');

        for (const container of potentialContainers) {
            const text = this.extractTextFromElement(container);
            if (text.length < 50) continue; // Skip very short content

            const score = this.scoreContent(container, text);
            if (score > 0.2) { // Minimum score threshold
                candidates.push({ element: container, text, score });
            }
        }

        // Sort by score and return the best candidate
        candidates.sort((a, b) => b.score - a.score);

        if (candidates.length > 0) {
            console.log(`DEBUG: Found ${candidates.length} candidates, best score: ${candidates[0].score.toFixed(2)}`);
            return candidates[0].text;
        }

        return '';
    }

    // Advanced content scoring by analyzing all elements
    findContentByScoring() {
        console.log('DEBUG: Starting comprehensive content scoring');

        let bestElement = null;
        let bestScore = 0;
        let bestContent = '';

        // Analyze all significant elements
        const allElements = document.querySelectorAll('div, section, article, main, aside, body > *');

        for (const element of allElements) {
            // Skip obviously non-content elements
            if (this.isNonContentElement(element)) continue;

            const text = this.extractTextFromElement(element);
            if (text.length < 100) continue; // Minimum content threshold

            const score = this.scoreContent(element, text);

            if (score > bestScore && score > 0.4) { // Higher threshold for this method
                bestScore = score;
                bestElement = element;
                bestContent = text;
            }
        }

        if (bestElement) {
            console.log(`DEBUG: Best scored element: ${bestElement.tagName}.${bestElement.className}, score: ${bestScore.toFixed(2)}`);
            return bestContent;
        }

        return '';
    }

    // Helper method to identify non-content elements
    isNonContentElement(element) {
        const tagName = element.tagName.toLowerCase();
        const className = element.className.toLowerCase();
        const id = element.id.toLowerCase();

        // Skip obvious non-content elements
        const nonContentTags = ['nav', 'header', 'footer', 'aside', 'form', 'button'];
        if (nonContentTags.includes(tagName)) return true;

        // Skip elements with non-content class names or IDs
        const nonContentPatterns = [
            'nav', 'menu', 'sidebar', 'header', 'footer', 'ad', 'advertisement',
            'social', 'share', 'comment', 'widget', 'popup', 'modal', 'overlay',
            'breadcrumb', 'pagination', 'search', 'filter', 'toolbar'
        ];

        return nonContentPatterns.some(pattern =>
            className.includes(pattern) || id.includes(pattern)
        );
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