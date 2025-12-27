/**
 * SJLC Daily Bible Readings - Reading Page JavaScript
 * Handles interactive features for pre-rendered reading pages
 */

(function() {
    'use strict';

    // ===== READING FEATURES INITIALIZATION =====

    function initReadingFeatures() {
        initSettingsMenu();
        initVerseSelector();
        initFootnotes();
        initCrossrefs();
        initShareButton();
        initCommentaryDevotional();
        initImageLightbox();
    }

    // ===== SETTINGS MENU =====

    function initSettingsMenu() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsMenu = document.getElementById('settingsMenu');

        if (!settingsBtn || !settingsMenu) return;

        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsMenu.classList.remove('active');
            }
        });

        // Load and apply preferences
        loadDisplayPreferences();

        // Settings toggle handlers
        const toggleImage = document.getElementById('toggleImage');
        const toggleAudio = document.getElementById('toggleAudio');
        const toggleFootnotes = document.getElementById('toggleFootnotes');
        const toggleCrossrefs = document.getElementById('toggleCrossrefs');

        if (toggleImage) {
            toggleImage.addEventListener('change', (e) => {
                const verseCard = document.getElementById('verseCard');
                const imageSection = document.getElementById('imageSection');
                if (verseCard) verseCard.classList.toggle('hidden', !e.target.checked);
                if (imageSection) imageSection.classList.toggle('hidden', !e.target.checked);
                savePreference('showImage', e.target.checked);
            });
        }

        if (toggleAudio) {
            toggleAudio.addEventListener('change', (e) => {
                const audioSection = document.getElementById('audioSection');
                if (audioSection) audioSection.classList.toggle('hidden', !e.target.checked);
                savePreference('showAudio', e.target.checked);
            });
        }

        if (toggleFootnotes) {
            toggleFootnotes.addEventListener('change', (e) => {
                const bibleContent = document.getElementById('bibleContent');
                const footnotesSection = document.getElementById('footnotesSection');
                if (bibleContent) bibleContent.classList.toggle('hide-footnotes', !e.target.checked);
                if (footnotesSection) footnotesSection.classList.toggle('hidden', !e.target.checked);
                savePreference('showFootnotes', e.target.checked);
            });
        }

        if (toggleCrossrefs) {
            toggleCrossrefs.addEventListener('change', (e) => {
                const bibleContent = document.getElementById('bibleContent');
                const crossrefsSection = document.querySelector('.crossrefs');
                if (bibleContent) bibleContent.classList.toggle('hide-crossrefs', !e.target.checked);
                if (crossrefsSection) crossrefsSection.classList.toggle('hidden', !e.target.checked);
                savePreference('showCrossrefs', e.target.checked);
            });
        }
    }

    function loadDisplayPreferences() {
        const prefs = {
            showImage: JSON.parse(localStorage.getItem('sjlc_showImage') ?? 'true'),
            showAudio: JSON.parse(localStorage.getItem('sjlc_showAudio') ?? 'true'),
            showFootnotes: JSON.parse(localStorage.getItem('sjlc_showFootnotes') ?? 'true'),
            showCrossrefs: JSON.parse(localStorage.getItem('sjlc_showCrossrefs') ?? 'true')
        };

        const toggleImage = document.getElementById('toggleImage');
        const toggleAudio = document.getElementById('toggleAudio');
        const toggleFootnotes = document.getElementById('toggleFootnotes');
        const toggleCrossrefs = document.getElementById('toggleCrossrefs');
        const verseCard = document.getElementById('verseCard');
        const imageSection = document.getElementById('imageSection');
        const audioSection = document.getElementById('audioSection');
        const bibleContent = document.getElementById('bibleContent');
        const footnotesSection = document.getElementById('footnotesSection');
        const crossrefsSection = document.querySelector('.crossrefs');

        if (toggleImage) toggleImage.checked = prefs.showImage;
        if (toggleAudio) toggleAudio.checked = prefs.showAudio;
        if (toggleFootnotes) toggleFootnotes.checked = prefs.showFootnotes;
        if (toggleCrossrefs) toggleCrossrefs.checked = prefs.showCrossrefs;

        if (verseCard) verseCard.classList.toggle('hidden', !prefs.showImage);
        if (imageSection) imageSection.classList.toggle('hidden', !prefs.showImage);
        if (audioSection) audioSection.classList.toggle('hidden', !prefs.showAudio);
        if (bibleContent) {
            bibleContent.classList.toggle('hide-footnotes', !prefs.showFootnotes);
            bibleContent.classList.toggle('hide-crossrefs', !prefs.showCrossrefs);
        }
        if (footnotesSection) footnotesSection.classList.toggle('hidden', !prefs.showFootnotes);
        if (crossrefsSection) crossrefsSection.classList.toggle('hidden', !prefs.showCrossrefs);
    }

    function savePreference(key, value) {
        localStorage.setItem(`sjlc_${key}`, JSON.stringify(value));
    }

    // ===== VERSE SELECTOR =====

    let verseSelector = null;

    function initVerseSelector() {
        const bibleContent = document.getElementById('bibleContent');
        if (!bibleContent) return;

        verseSelector = new VerseSelector(bibleContent);
    }

    class VerseSelector {
        constructor(bibleContentEl) {
            this.selectedVerses = new Map();
            this.bibleContentEl = bibleContentEl;
            this.copyFab = document.getElementById('copyFab');
            this.copyBtn = document.getElementById('copyVerseBtn');
            this.clearBtn = document.getElementById('clearSelectionBtn');
            this.verseCountBadge = document.getElementById('verseCountBadge');
            this.init();
        }

        init() {
            this.wrapVerses();
            this.attachEventListeners();
        }

        wrapVerses() {
            const paragraphs = this.bibleContentEl.querySelectorAll('p[id^="p"]');
            const lines = this.bibleContentEl.querySelectorAll('.line');

            // Handle prose paragraphs if present
            if (paragraphs.length > 0) {
                this.wrapProseVerses(paragraphs);
            }

            // Always handle poetry lines if present (mixed content like Hebrews)
            if (lines.length > 0) {
                this.wrapPoetryVerses();
            }
        }

        wrapProseVerses(paragraphs) {
            paragraphs.forEach(p => {
                const verseNums = Array.from(p.querySelectorAll('.verse-num, .chapter-num'));

                verseNums.forEach((verseNum, index) => {
                    const verseId = verseNum.id;
                    if (!verseId) return;

                    const match = verseId.match(/v(\d{2})(\d{3})(\d{3})-/);
                    if (!match) return;

                    const [, bookNum, chapterNum, verseNumParsed] = match;
                    const book = this.getBookName(parseInt(bookNum));
                    const chapter = parseInt(chapterNum);
                    const verse = parseInt(verseNumParsed);

                    const nextVerseNum = verseNums[index + 1];
                    const nodesToWrap = [];
                    let currentNode = verseNum.nextSibling;

                    while (currentNode && currentNode !== nextVerseNum) {
                        if (currentNode.nodeType === Node.TEXT_NODE && currentNode.textContent.trim()) {
                            nodesToWrap.push(currentNode);
                        } else if (currentNode.nodeType === Node.ELEMENT_NODE &&
                                  !currentNode.classList.contains('verse-num') &&
                                  !currentNode.classList.contains('chapter-num')) {
                            nodesToWrap.push(currentNode);
                        }
                        currentNode = currentNode.nextSibling;
                    }

                    if (nodesToWrap.length > 0) {
                        const wrapper = document.createElement('span');
                        wrapper.className = 'verse-wrapper';
                        wrapper.dataset.verseId = verseId;
                        wrapper.dataset.book = book;
                        wrapper.dataset.chapter = chapter;
                        wrapper.dataset.verse = verse;

                        verseNum.parentNode.insertBefore(wrapper, verseNum.nextSibling);
                        nodesToWrap.forEach(node => wrapper.appendChild(node));
                    }
                });
            });
        }

        wrapPoetryVerses() {
            // Poetry uses spans with class "line" - group lines by their verse
            // Build a map of verse patterns to verse data
            const versePatternMap = new Map();
            const allVerseNums = this.bibleContentEl.querySelectorAll('.verse-num, .chapter-num');

            // First pass: collect all verse patterns and their data
            allVerseNums.forEach(verseNum => {
                const verseId = verseNum.id;
                if (!verseId) return;

                const match = verseId.match(/v(\d{2})(\d{3})(\d{3})-/);
                if (!match) return;

                const [, bookNum, chapterNum, verseNumParsed] = match;
                const book = this.getBookName(parseInt(bookNum));
                const chapter = parseInt(chapterNum);
                const verse = parseInt(verseNumParsed);

                // Extract the verse pattern (e.g., "v58001005-1" -> "58001005")
                // This pattern appears in both verse IDs and line span IDs
                const versePattern = `${bookNum}${chapterNum}${verseNumParsed}`;
                versePatternMap.set(versePattern, { verseId, book, chapter, verse });

                // If verse number is inside a .line span, mark it directly
                const lineSpan = verseNum.closest('.line');
                if (lineSpan) {
                    lineSpan.classList.add('verse-wrapper');
                    lineSpan.dataset.verseId = verseId;
                    lineSpan.dataset.book = book;
                    lineSpan.dataset.chapter = chapter;
                    lineSpan.dataset.verse = verse;
                }
            });

            // Second pass: find ALL .line elements and match them to verses by ID pattern
            const allLines = this.bibleContentEl.querySelectorAll('.line');
            allLines.forEach(line => {
                // Skip lines that already have verse-wrapper
                if (line.classList.contains('verse-wrapper')) return;

                const lineId = line.id;
                if (!lineId) return;

                // Try to extract verse pattern from line ID (e.g., "p58001005_06-1" -> "58001005")
                const lineMatch = lineId.match(/p(\d{8})/);
                if (lineMatch) {
                    const linePattern = lineMatch[1];
                    const verseData = versePatternMap.get(linePattern);
                    if (verseData) {
                        line.classList.add('verse-wrapper');
                        line.dataset.verseId = verseData.verseId;
                        line.dataset.book = verseData.book;
                        line.dataset.chapter = verseData.chapter;
                        line.dataset.verse = verseData.verse;
                    }
                }
            });

            // Handle non-poetry verses (prose mode fallback)
            allVerseNums.forEach(verseNum => {
                const verseId = verseNum.id;
                if (!verseId) return;

                const match = verseId.match(/v(\d{2})(\d{3})(\d{3})-/);
                if (!match) return;

                // Skip if already handled in poetry mode
                const lineSpan = verseNum.closest('.line');
                if (lineSpan) return;

                const [, bookNum, chapterNum, verseNumParsed] = match;
                const book = this.getBookName(parseInt(bookNum));
                const chapter = parseInt(chapterNum);
                const verse = parseInt(verseNumParsed);

                // Fallback: wrap text nodes directly after the verse number (prose mode)
                const nodesToWrap = [];
                let currentNode = verseNum.nextSibling;

                while (currentNode) {
                    if (currentNode.nodeType === Node.ELEMENT_NODE &&
                        (currentNode.classList.contains('verse-num') ||
                         currentNode.classList.contains('chapter-num'))) {
                        break;
                    }
                    if (currentNode.nodeType === Node.TEXT_NODE && currentNode.textContent.trim()) {
                        nodesToWrap.push(currentNode);
                    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                        nodesToWrap.push(currentNode);
                    }
                    currentNode = currentNode.nextSibling;
                }

                if (nodesToWrap.length > 0) {
                    const wrapper = document.createElement('span');
                    wrapper.className = 'verse-wrapper';
                    wrapper.dataset.verseId = verseId;
                    wrapper.dataset.book = book;
                    wrapper.dataset.chapter = chapter;
                    wrapper.dataset.verse = verse;

                    verseNum.parentNode.insertBefore(wrapper, verseNum.nextSibling);
                    nodesToWrap.forEach(node => wrapper.appendChild(node));
                }
            });
        }

        attachEventListeners() {
            // Verse click selection
            this.bibleContentEl.addEventListener('click', (e) => {
                const verseWrapper = e.target.closest('.verse-wrapper');
                if (verseWrapper && !e.target.closest('.footnote') && !e.target.closest('.crossref')) {
                    this.toggleVerseSelection(verseWrapper);
                }
            });

            // Copy button
            if (this.copyBtn) {
                this.copyBtn.addEventListener('click', () => this.copySelectedVerses());
            }

            // Clear button
            if (this.clearBtn) {
                this.clearBtn.addEventListener('click', () => this.clearSelection());
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'c' && this.selectedVerses.size > 0) {
                    e.preventDefault();
                    this.copySelectedVerses();
                }
                if (e.key === 'Escape' && this.selectedVerses.size > 0) {
                    this.clearSelection();
                }
            });

            // Click outside to clear
            document.addEventListener('click', (e) => {
                const isModalClick = e.target.closest('.modal-overlay') ||
                                    e.target.closest('.modal-popup') ||
                                    e.target.closest('.side-panel-overlay') ||
                                    e.target.closest('.side-panel');

                if (!isModalClick &&
                    !this.bibleContentEl.contains(e.target) &&
                    !this.copyFab?.contains(e.target) &&
                    this.selectedVerses.size > 0) {
                    this.clearSelection();
                }
            });

            // Mobile long-press support
            let pressTimer;
            this.bibleContentEl.addEventListener('touchstart', (e) => {
                const verseWrapper = e.target.closest('.verse-wrapper');
                if (verseWrapper && !e.target.closest('.footnote') && !e.target.closest('.crossref')) {
                    pressTimer = setTimeout(() => {
                        this.toggleVerseSelection(verseWrapper);
                        if (navigator.vibrate) navigator.vibrate(50);
                    }, 500);
                }
            });

            this.bibleContentEl.addEventListener('touchend', () => clearTimeout(pressTimer));
            this.bibleContentEl.addEventListener('touchmove', () => clearTimeout(pressTimer));
        }

        toggleVerseSelection(verseWrapper) {
            const verseId = verseWrapper.dataset.verseId;

            // Find ALL elements with this verseId (for poetry with multiple lines per verse)
            const allVerseElements = this.bibleContentEl.querySelectorAll(`[data-verse-id="${verseId}"]`);

            if (this.selectedVerses.has(verseId)) {
                this.selectedVerses.delete(verseId);
                allVerseElements.forEach(el => el.classList.remove('selected'));
            } else {
                this.selectedVerses.set(verseId, {
                    book: verseWrapper.dataset.book,
                    chapter: parseInt(verseWrapper.dataset.chapter),
                    verse: parseInt(verseWrapper.dataset.verse),
                    text: this.cleanTextFromElements(allVerseElements),
                    elements: Array.from(allVerseElements)
                });
                allVerseElements.forEach(el => el.classList.add('selected'));
            }

            this.updateFab();
        }

        cleanTextFromElements(elements) {
            // Gather text from all elements (for poetry with multiple lines)
            let text = '';
            elements.forEach(el => {
                const clone = el.cloneNode(true);
                // Remove footnotes (.fn) and cross-references (.cf) - ESV uses these classes
                // Also remove their parent sup tags to clean up completely
                clone.querySelectorAll('.footnote, .fn, .cf, sup:has(.fn), sup:has(.cf)').forEach(fn => fn.remove());
                text += clone.textContent + ' ';
            });
            return text
                .replace(/\[\d+\]/g, '')       // Remove footnote brackets [1], [2]
                .replace(/\(\w+\)/g, '')       // Remove crossref letters (a), (b)
                .replace(/\s+/g, ' ')
                .trim();
        }

        cleanText(verseWrapper) {
            const clone = verseWrapper.cloneNode(true);
            // Remove footnotes (.fn) and cross-references (.cf) - ESV uses these classes
            clone.querySelectorAll('.footnote, .fn, .cf, sup:has(.fn), sup:has(.cf)').forEach(el => el.remove());
            return clone.textContent
                .replace(/\[\d+\]/g, '')       // Remove footnote brackets [1], [2]
                .replace(/\(\w+\)/g, '')       // Remove crossref letters (a), (b)
                .replace(/\s+/g, ' ')
                .trim();
        }

        updateFab() {
            const count = this.selectedVerses.size;

            if (count > 0) {
                this.copyFab?.classList.add('visible');
                if (this.verseCountBadge) this.verseCountBadge.textContent = count;
                if (this.copyBtn) {
                    this.copyBtn.disabled = false;
                    this.copyBtn.innerHTML = '\uD83D\uDCCB<span class="verse-count-badge" id="verseCountBadge">' + count + '</span>';
                }
                if (this.clearBtn) this.clearBtn.style.display = 'flex';
            } else {
                this.copyFab?.classList.remove('visible');
            }
        }

        async copySelectedVerses() {
            if (this.selectedVerses.size === 0) return;

            const formattedText = this.formatSelectedVerses();

            if (this.copyBtn) this.copyBtn.disabled = true;
            if (this.clearBtn) this.clearBtn.style.display = 'none';
            if (this.copyBtn) this.copyBtn.innerHTML = '\u2713';

            try {
                await navigator.clipboard.writeText(formattedText);
                showToast('Verses copied to clipboard!');
            } catch (err) {
                this.fallbackCopy(formattedText);
                return;
            }

            setTimeout(() => this.clearSelection(), 1500);
        }

        formatSelectedVerses() {
            const verses = Array.from(this.selectedVerses.values())
                .sort((a, b) => {
                    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                    return a.verse - b.verse;
                });

            if (verses.length === 0) return '';

            const book = verses[0].book;
            const chapter = verses[0].chapter;
            let reference = `${book} ${chapter}:`;
            const verseNumbers = verses.map(v => v.verse);

            const isConsecutive = verseNumbers.every((num, idx) =>
                idx === 0 || num === verseNumbers[idx - 1] + 1
            );

            if (isConsecutive && verseNumbers.length > 1) {
                reference += `${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`;
            } else {
                reference += verseNumbers.join(', ');
            }

            const text = verses.map(v => v.text).join(' ');
            return `${text} - ${reference}`;
        }

        fallbackCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();

            if (this.copyBtn) this.copyBtn.disabled = true;
            if (this.clearBtn) this.clearBtn.style.display = 'none';
            if (this.copyBtn) this.copyBtn.innerHTML = '\u2713';

            try {
                document.execCommand('copy');
                showToast('Verses copied to clipboard!');
            } catch (err) {
                showToast('Failed to copy verses');
                if (this.copyBtn) this.copyBtn.disabled = false;
                if (this.clearBtn) this.clearBtn.style.display = 'flex';
                this.updateFab();
            }

            document.body.removeChild(textarea);
            setTimeout(() => this.clearSelection(), 1500);
        }

        clearSelection() {
            this.selectedVerses.forEach(verse => {
                // Handle both single element and array of elements (for poetry)
                if (verse.elements) {
                    verse.elements.forEach(el => el.classList.remove('selected'));
                } else if (verse.element) {
                    verse.element.classList.remove('selected');
                }
            });
            this.selectedVerses.clear();
            this.updateFab();
        }

        getBookName(bookNum) {
            const books = {
                1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
                6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
                11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
                15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
                20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
                24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
                28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
                33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
                38: 'Zechariah', 39: 'Malachi', 40: 'Matthew', 41: 'Mark', 42: 'Luke',
                43: 'John', 44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
                48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians',
                52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy',
                56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter',
                61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude',
                66: 'Revelation'
            };
            return books[bookNum] || `Book ${bookNum}`;
        }
    }

    // ===== FOOTNOTES =====

    function initFootnotes() {
        const footnoteLinks = document.querySelectorAll('.fn');

        footnoteLinks.forEach(link => {
            // Remove href to prevent browser scroll (ESV HTML has anchor links to footnotes section)
            link.removeAttribute('href');
            link.style.cursor = 'pointer';

            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Check data-footnote first, then fall back to title attribute (ESV API format)
                let footnoteText = link.getAttribute('data-footnote') || link.getAttribute('title');
                if (footnoteText) {
                    // Clean up ESV title format: decode HTML entities and strip XML/HTML tags
                    footnoteText = decodeHTMLEntities(footnoteText);
                    footnoteText = footnoteText.replace(/<[^>]+>/g, '').trim();

                    // Try to get verse reference from nearby verse number
                    const verseNum = link.closest('p, .line')?.querySelector('.verse-num, .chapter-num') ||
                                    link.closest('.line')?.previousElementSibling?.querySelector('.verse-num, .chapter-num');
                    const verseRef = verseNum ? verseNum.textContent.trim() : '';
                    const content = verseRef
                        ? `<span class="verse-ref">Verse ${verseRef}</span><p>${footnoteText}</p>`
                        : `<p>${footnoteText}</p>`;
                    showModal('Footnote', content, 'footnote', e);
                }
            });
        });
    }

    function decodeHTMLEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    // ===== CROSS-REFERENCES =====

    function initCrossrefs() {
        // ESV API uses .cf class for crossref links
        const crossrefLinks = document.querySelectorAll('.cf');

        crossrefLinks.forEach(link => {
            // Remove href to prevent browser navigation (ESV puts refs in href)
            link.removeAttribute('href');
            link.style.cursor = 'pointer';

            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Get enriched crossref data if available (from backend processing)
                const dataAttr = link.getAttribute('data-crossrefs');
                let crossrefs = [];

                if (dataAttr) {
                    try {
                        crossrefs = JSON.parse(dataAttr);
                    } catch (err) {
                        console.warn('Could not parse crossref data', err);
                    }
                }

                // Fallback: parse from title attribute if no data-crossrefs
                if (crossrefs.length === 0) {
                    const title = link.getAttribute('title') || '';
                    // Parse refs from title (format: "Gen. 1:1; [Col. 1:17; 1 John 1:1]")
                    const refs = title.split(';').map(r => r.trim().replace(/[\[\]]/g, '')).filter(r => r);
                    crossrefs = refs.map(ref => ({
                        reference: ref,
                        text: null,
                        esv_url: `https://www.esv.org/${encodeURIComponent(ref)}`
                    }));
                }

                // Build popup content
                const content = buildCrossrefContent(crossrefs);
                showModal('Cross References', content, 'crossref', e);
            });
        });
    }

    function buildCrossrefContent(crossrefs) {
        if (!crossrefs || crossrefs.length === 0) {
            return '<p>No cross-references available.</p>';
        }

        let html = '<div class="crossref-list">';

        crossrefs.forEach(cr => {
            html += '<div class="crossref-item">';
            html += `<a href="${cr.esv_url}" target="_blank" rel="noopener" class="crossref-reference">${cr.reference} <span class="esv-arrow">→</span></a>`;

            if (cr.text) {
                html += `<p class="crossref-text">${cr.text}</p>`;
                html += `<span class="crossref-version">(ASV)</span>`;
            }

            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    // ===== MODAL =====

    function showModal(title, content, type, event) {
        // Remove existing modal
        const existingOverlay = document.querySelector('.modal-overlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';

        const modal = document.createElement('div');
        modal.className = 'modal-popup active';
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title ${type}">${title}</h3>
                <button class="modal-close" aria-label="Close">&times;</button>
            </div>
            <div class="modal-content">${content}</div>
        `;

        // Position modal above click if event provided
        if (event && event.target) {
            const rect = event.target.getBoundingClientRect();
            modal.style.position = 'fixed';
            modal.style.bottom = `${window.innerHeight - rect.top + 10}px`;
            modal.style.top = 'auto';
            modal.style.left = `${Math.max(20, rect.left - 100)}px`;
        } else {
            modal.style.position = 'fixed';
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
        }

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const closeBtn = modal.querySelector('.modal-close');
        const closeModal = () => overlay.remove();

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // ===== SHARE BUTTON =====

    function initShareButton() {
        const shareBtn = document.getElementById('shareBtn');
        const shareSection = shareBtn?.closest('.share-section');
        if (!shareBtn || !shareSection) return;

        // Detect if mobile device (touch + native share available)
        const isMobile = navigator.share && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

        if (isMobile) {
            // Mobile: Single tap opens native share sheet
            shareBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await handleNativeShare();
            });
        } else {
            // Desktop: Show dropdown menu
            const dropdown = document.createElement('div');
            dropdown.className = 'share-dropdown';
            dropdown.innerHTML = `
                <a href="#" class="share-option" data-platform="copy">
                    <span class="share-option-icon">🔗</span>
                    <span class="share-option-label">Copy Link</span>
                </a>
                <a href="#" class="share-option" data-platform="email">
                    <span class="share-option-icon">✉</span>
                    <span class="share-option-label">Email</span>
                </a>
                <a href="#" class="share-option" data-platform="facebook">
                    <span class="share-option-icon">f</span>
                    <span class="share-option-label">Facebook</span>
                </a>
                <a href="#" class="share-option" data-platform="pinterest">
                    <span class="share-option-icon">P</span>
                    <span class="share-option-label">Pinterest</span>
                </a>
                <a href="#" class="share-option" data-platform="twitter">
                    <span class="share-option-icon">𝕏</span>
                    <span class="share-option-label">X / Twitter</span>
                </a>
                <a href="#" class="share-option" data-platform="download">
                    <span class="share-option-icon">⬇</span>
                    <span class="share-option-label">Download Image</span>
                </a>
                <a href="#" class="share-option" data-platform="copyverses">
                    <span class="share-option-icon">📋</span>
                    <span class="share-option-label">Copy All Verses</span>
                </a>
            `;
            shareSection.appendChild(dropdown);

            // Toggle dropdown on button click
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!shareSection.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });

            // Handle share option clicks
            dropdown.addEventListener('click', async (e) => {
                const option = e.target.closest('.share-option');
                if (!option) return;

                e.preventDefault();
                const platform = option.dataset.platform;
                const url = window.location.href;
                const encodedUrl = encodeURIComponent(url);
                const passage = document.querySelector('.reading-title')?.textContent || 'Daily Reading';
                const verseCardImage = document.querySelector('.verse-card-image');
                const imageUrl = verseCardImage ? encodeURIComponent(verseCardImage.src) : '';

                dropdown.classList.remove('active');

                switch (platform) {
                    case 'copy':
                        try {
                            await navigator.clipboard.writeText(url);
                            showToast('Link copied to clipboard!');
                        } catch (err) {
                            // Fallback for older browsers
                            const textarea = document.createElement('textarea');
                            textarea.value = url;
                            textarea.style.position = 'fixed';
                            textarea.style.opacity = '0';
                            document.body.appendChild(textarea);
                            textarea.select();
                            try {
                                document.execCommand('copy');
                                showToast('Link copied to clipboard!');
                            } catch (copyErr) {
                                showToast('Failed to copy link');
                            }
                            document.body.removeChild(textarea);
                        }
                        break;
                    case 'email':
                        const subject = encodeURIComponent(passage);
                        const body = encodeURIComponent(`Check out today's reading: ${passage}\n\n${url}`);
                        window.location.href = `mailto:?subject=${subject}&body=${body}`;
                        break;
                    case 'facebook':
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400');
                        break;
                    case 'pinterest':
                        // Pinterest requires an image URL
                        if (imageUrl) {
                            const pinterestText = encodeURIComponent(passage);
                            window.open(`https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${imageUrl}&description=${pinterestText}`, '_blank', 'width=600,height=400');
                        } else {
                            window.open(`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodeURIComponent(passage)}`, '_blank', 'width=600,height=400');
                        }
                        break;
                    case 'twitter':
                        const tweetText = encodeURIComponent(passage);
                        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${tweetText}`, '_blank', 'width=600,height=400');
                        break;
                    case 'download':
                        if (verseCardImage) {
                            try {
                                const response = await fetch(verseCardImage.src);
                                const blob = await response.blob();
                                const blobUrl = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = `verse-card-${passage.replace(/[^a-zA-Z0-9]/g, '-')}.webp`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(blobUrl);
                                showToast('Image downloaded!');
                            } catch (err) {
                                showToast('Failed to download image');
                            }
                        } else {
                            showToast('No image available');
                        }
                        break;
                    case 'copyverses':
                        try {
                            const verseText = extractAllVerseText();
                            if (verseText) {
                                await navigator.clipboard.writeText(verseText);
                                showToast('Verses copied to clipboard!');
                            } else {
                                showToast('No verse text found');
                            }
                        } catch (err) {
                            showToast('Failed to copy verses');
                        }
                        break;
                }
            });
        }

        // Extract all verse text from the bible content (strips footnotes/crossrefs/verse numbers)
        function extractAllVerseText() {
            const bibleContent = document.querySelector('.bible-content');
            if (!bibleContent) return null;

            // Clone the content to avoid modifying the DOM
            const clone = bibleContent.cloneNode(true);

            // Remove footnotes, cross-references, and verse numbers
            clone.querySelectorAll('.footnote, .fn, .cf, sup:has(.fn), sup:has(.cf), .crossrefs, .verse-num, .chapter-num').forEach(el => el.remove());

            // Get the text content
            let text = clone.textContent || '';

            // Clean up whitespace (multiple spaces, newlines)
            text = text.replace(/\s+/g, ' ').trim();

            // Get the passage reference
            const passage = document.querySelector('.reading-title')?.textContent || '';

            // Append reference at the end
            if (passage && text) {
                text = `${text}\n\n— ${passage} (ESV)`;
            }

            return text;
        }

        async function handleNativeShare() {
            const url = window.location.href;

            try {
                // Only pass URL - OG tags handle preview (title, description, image)
                await navigator.share({ url: url });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // User cancelled - that's fine, do nothing
                }
            }
        }

        async function getVerseCardBlob(imgElement) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imgElement.src;
            });

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        }
    }

    // ===== COMMENTARY & DEVOTIONAL =====

    function initCommentaryDevotional() {
        const additionalContent = document.querySelector('.additional-content');
        const commentaryBtn = document.getElementById('commentaryBtn');
        const devotionalBtn = document.getElementById('devotionalBtn');

        if (additionalContent) {
            const container = document.querySelector('.daily-reading-container');
            const hasCommentary = container?.dataset.hasCommentary === 'true';
            const hasDevotional = container?.dataset.hasDevotional === 'true';

            if (commentaryBtn && !hasCommentary) commentaryBtn.style.display = 'none';
            if (devotionalBtn && !hasDevotional) devotionalBtn.style.display = 'none';
            if (!hasCommentary && !hasDevotional) additionalContent.style.display = 'none';
        }

        if (commentaryBtn) {
            commentaryBtn.addEventListener('click', () => {
                const passage = document.querySelector('.reading-title')?.textContent || 'this passage';
                openSidePanel(`Commentary on ${passage}`, 'commentary');
            });
        }

        if (devotionalBtn) {
            devotionalBtn.addEventListener('click', () => {
                openSidePanel('Daily Devotional', 'devotional');
            });
        }
    }

    function openSidePanel(title, type) {
        const existingOverlay = document.querySelector('.side-panel-overlay');
        if (existingOverlay) existingOverlay.remove();

        // Get content from hidden divs if they exist
        const contentDiv = document.querySelector(`.${type}-content`);
        const content = contentDiv ? contentDiv.innerHTML : '<p>Content not available.</p>';

        const overlay = document.createElement('div');
        overlay.className = 'side-panel-overlay';

        const panel = document.createElement('div');
        panel.className = 'side-panel';
        panel.innerHTML = `
            <div class="side-panel-header ${type}">
                <h2 class="side-panel-title">${title}</h2>
                <button class="side-panel-close" aria-label="Close">&times;</button>
            </div>
            <div class="side-panel-content">${content}</div>
        `;

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Animate in
        setTimeout(() => {
            overlay.classList.add('active');
            panel.classList.add('active');
        }, 10);

        const closeBtn = panel.querySelector('.side-panel-close');
        const closeSidePanel = () => {
            panel.classList.remove('active');
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };

        closeBtn.addEventListener('click', closeSidePanel);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSidePanel();
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                closeSidePanel();
                document.removeEventListener('keydown', handler);
            }
        });
    }

    // ===== IMAGE LIGHTBOX =====

    function initImageLightbox() {
        const verseCardImage = document.querySelector('.verse-card-image');
        if (!verseCardImage) return;

        // Add cursor pointer to indicate clickable
        verseCardImage.style.cursor = 'pointer';

        verseCardImage.addEventListener('click', () => {
            openImageLightbox(verseCardImage.src);
        });
    }

    function openImageLightbox(imageSrc) {
        // Remove existing lightbox if any
        const existingLightbox = document.querySelector('.image-lightbox-overlay');
        if (existingLightbox) existingLightbox.remove();

        const passage = document.querySelector('.reading-title')?.textContent || 'verse-card';

        const overlay = document.createElement('div');
        overlay.className = 'image-lightbox-overlay';
        overlay.innerHTML = `
            <div class="image-lightbox">
                <button class="lightbox-close" aria-label="Close">&times;</button>
                <img src="${imageSrc}" alt="Verse Card" class="lightbox-image">
                <div class="lightbox-actions">
                    <button class="lightbox-download-btn">
                        <span>⬇</span> Download Image
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        setTimeout(() => overlay.classList.add('active'), 10);

        const closeLightbox = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        };

        // Close button
        overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);

        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeLightbox();
        });

        // Escape key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Download button
        overlay.querySelector('.lightbox-download-btn').addEventListener('click', async () => {
            try {
                const response = await fetch(imageSrc);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `verse-card-${passage.replace(/[^a-zA-Z0-9]/g, '-')}.webp`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
                showToast('Image downloaded!');
            } catch (err) {
                showToast('Failed to download image');
            }
        });
    }

    // ===== TOAST =====

    function showToast(message) {
        let toast = document.querySelector('.verse-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'verse-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== INITIALIZATION =====

    function init() {
        // Content is pre-rendered, just initialize interactive features
        initReadingFeatures();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
