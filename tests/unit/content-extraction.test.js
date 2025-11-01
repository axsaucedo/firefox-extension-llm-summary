// Unit tests for content extraction functionality

describe('ContentExtractor', () => {
    let contentExtractor;

    beforeEach(() => {
        resetMocks();

        // Set up DOM with various content structures
        document.body.innerHTML = `
            <header>Site Header</header>
            <nav>Navigation Menu</nav>
            <main>
                <article>
                    <h1>Article Title</h1>
                    <p>This is the main article content that should be extracted.</p>
                    <p>Another paragraph with important information.</p>
                </article>
                <aside class="sidebar">Sidebar content</aside>
            </main>
            <footer>Site Footer</footer>
            <script>console.log('script');</script>
            <style>.test { color: red; }</style>
        `;

        // Mock ContentExtractor
        jest.isolateModules(() => {
            const ContentExtractorClass = require('../../content-scripts/content.js');
            contentExtractor = new ContentExtractorClass();
        });
    });

    describe('Selected Text Extraction', () => {
        test('should extract selected text when text is selected', () => {
            // Mock window.getSelection
            global.window.getSelection = jest.fn().mockReturnValue({
                rangeCount: 1,
                toString: () => '  Selected text content  '
            });

            const content = contentExtractor.getSelectedText();

            expect(content).toBe('Selected text content');
        });

        test('should return empty string when no text is selected', () => {
            global.window.getSelection = jest.fn().mockReturnValue({
                rangeCount: 0,
                toString: () => ''
            });

            const content = contentExtractor.getSelectedText();

            expect(content).toBe('');
        });

        test('should return empty string when selection is empty', () => {
            global.window.getSelection = jest.fn().mockReturnValue({
                rangeCount: 1,
                toString: () => '   '
            });

            const content = contentExtractor.getSelectedText();

            expect(content).toBe('');
        });
    });

    describe('Page Content Extraction', () => {
        test('should extract content from article element', () => {
            const content = contentExtractor.getPageContent();

            expect(content).toContain('Article Title');
            expect(content).toContain('main article content');
            expect(content).toContain('Another paragraph');
            expect(content).not.toContain('Site Header');
            expect(content).not.toContain('Navigation Menu');
            expect(content).not.toContain('Sidebar content');
            expect(content).not.toContain('Site Footer');
        });

        test('should extract from main element when no article found', () => {
            // Remove article but keep main
            document.querySelector('article').remove();

            const content = contentExtractor.getPageContent();

            expect(content).toContain('main article content');
            expect(content).not.toContain('Site Header');
            expect(content).not.toContain('Site Footer');
        });

        test('should fall back to body content when no structured content found', () => {
            // Remove main and article
            document.querySelector('main').remove();

            const content = contentExtractor.getPageContent();

            expect(content).toContain('Site Header'); // Now it should include header since we're using body
        });

        test('should remove script and style elements', () => {
            const content = contentExtractor.getPageContent();

            expect(content).not.toContain('console.log');
            expect(content).not.toContain('.test { color: red; }');
        });
    });

    describe('Text Cleaning', () => {
        test('should remove extra whitespace', () => {
            const dirtyText = '  Multiple    spaces   and\n\n\nextra  \n  newlines  ';
            const cleanText = contentExtractor.cleanText(dirtyText);

            expect(cleanText).toBe('Multiple spaces and extra newlines');
        });

        test('should preserve reasonable line breaks', () => {
            const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
            const cleanText = contentExtractor.cleanText(text);

            expect(cleanText).toBe('Paragraph one.\n\nParagraph two.\n\nParagraph three.');
        });

        test('should limit text length', () => {
            const longText = 'a'.repeat(60000);
            const cleanText = contentExtractor.cleanText(longText);

            expect(cleanText.length).toBe(50000);
        });

        test('should handle empty or null text', () => {
            expect(contentExtractor.cleanText('')).toBe('');
            expect(contentExtractor.cleanText(null)).toBe('');
            expect(contentExtractor.cleanText(undefined)).toBe('');
        });
    });

    describe('Element Text Extraction', () => {
        test('should extract text from element while removing unwanted child elements', () => {
            const testElement = document.createElement('div');
            testElement.innerHTML = `
                <h1>Main Title</h1>
                <p>Important paragraph</p>
                <nav>Navigation to remove</nav>
                <div class="advertisement">Ad to remove</div>
                <p>Another important paragraph</p>
                <script>Script to remove</script>
            `;

            const extractedText = contentExtractor.extractTextFromElement(testElement);

            expect(extractedText).toContain('Main Title');
            expect(extractedText).toContain('Important paragraph');
            expect(extractedText).toContain('Another important paragraph');
            expect(extractedText).not.toContain('Navigation to remove');
            expect(extractedText).not.toContain('Ad to remove');
            expect(extractedText).not.toContain('Script to remove');
        });
    });

    describe('Message Handling', () => {
        test('should handle getContent message for selected text', () => {
            global.window.getSelection = jest.fn().mockReturnValue({
                rangeCount: 1,
                toString: () => 'Selected content'
            });

            const mockSender = {};
            const mockSendResponse = jest.fn();

            // Simulate message listener
            const messageHandler = contentExtractor.setupMessageListener();

            // Mock the browser.runtime.onMessage.addListener call
            const addListenerCall = browser.runtime.onMessage.addListener.mock.calls[0];
            const messageListener = addListenerCall[0];

            const result = messageListener(
                { action: 'getContent', type: 'selected' },
                mockSender,
                mockSendResponse
            );

            expect(mockSendResponse).toHaveBeenCalledWith({
                content: 'Selected content'
            });
            expect(result).toBe(true);
        });

        test('should handle getContent message for page content', () => {
            const mockSender = {};
            const mockSendResponse = jest.fn();

            // Mock the browser.runtime.onMessage.addListener call
            const addListenerCall = browser.runtime.onMessage.addListener.mock.calls[0];
            const messageListener = addListenerCall[0];

            const result = messageListener(
                { action: 'getContent', type: 'page' },
                mockSender,
                mockSendResponse
            );

            expect(mockSendResponse).toHaveBeenCalledWith({
                content: expect.stringContaining('main article content')
            });
            expect(result).toBe(true);
        });

        test('should handle unknown message action', () => {
            const mockSender = {};
            const mockSendResponse = jest.fn();

            const addListenerCall = browser.runtime.onMessage.addListener.mock.calls[0];
            const messageListener = addListenerCall[0];

            const result = messageListener(
                { action: 'unknown' },
                mockSender,
                mockSendResponse
            );

            expect(result).toBe(true);
        });
    });

    describe('Metadata Extraction', () => {
        test('should extract page metadata', () => {
            // Set up page metadata
            document.title = 'Test Page Title';
            document.head.innerHTML = `
                <meta name="description" content="Test page description">
                <meta name="author" content="Test Author">
                <meta property="article:published_time" content="2023-01-01T12:00:00Z">
            `;

            // Mock window.location
            delete window.location;
            window.location = { href: 'https://example.com/test' };

            const metadata = contentExtractor.getPageMetadata();

            expect(metadata.title).toBe('Test Page Title');
            expect(metadata.url).toBe('https://example.com/test');
            expect(metadata.description).toBe('Test page description');
            expect(metadata.author).toBe('Test Author');
            expect(metadata.publishDate).toBe('2023-01-01T12:00:00Z');
        });

        test('should handle missing metadata gracefully', () => {
            document.title = 'Test Title';
            document.head.innerHTML = '';

            delete window.location;
            window.location = { href: 'https://example.com' };

            const metadata = contentExtractor.getPageMetadata();

            expect(metadata.title).toBe('Test Title');
            expect(metadata.url).toBe('https://example.com');
            expect(metadata.description).toBe('');
            expect(metadata.author).toBe('');
            expect(metadata.publishDate).toBe('');
        });
    });

    describe('Content Extraction by Type', () => {
        test('should route to correct extraction method based on type', () => {
            jest.spyOn(contentExtractor, 'getSelectedText').mockReturnValue('selected');
            jest.spyOn(contentExtractor, 'getPageContent').mockReturnValue('page');

            expect(contentExtractor.extractContent('selected')).toBe('selected');
            expect(contentExtractor.extractContent('page')).toBe('page');
            expect(contentExtractor.extractContent('unknown')).toBe('');

            expect(contentExtractor.getSelectedText).toHaveBeenCalledTimes(1);
            expect(contentExtractor.getPageContent).toHaveBeenCalledTimes(1);
        });

        test('should handle extraction errors gracefully', () => {
            jest.spyOn(contentExtractor, 'getSelectedText').mockImplementation(() => {
                throw new Error('Extraction failed');
            });

            const result = contentExtractor.extractContent('selected');

            expect(result).toBe('');
            expect(console.error).toHaveBeenCalledWith('Error extracting content:', expect.any(Error));
        });
    });
});