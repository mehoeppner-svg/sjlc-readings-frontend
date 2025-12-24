/**
 * SJLC Daily Bible Readings - Reading Page JavaScript
 * Handles loading daily reading content and initializing all features after injection
 */

(function() {
    'use strict';

    // ===== DATE UTILITIES =====

    function formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function parseDateString(dateStr) {
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return null;
        }
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return null;
        }
        return date;
    }

    function formatDateDisplay(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function getTodayDateString() {
        return formatDateString(new Date());
    }

    function getRequestedDate() {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        if (dateParam && parseDateString(dateParam)) {
            return dateParam;
        }
        return getTodayDateString();
    }

    function getAdjacentDate(dateStr, offset) {
        const date = parseDateString(dateStr);
        if (!date) return dateStr;
        date.setDate(date.getDate() + offset);
        return formatDateString(date);
    }

    // ===== CONTENT LOADING =====

    function getReadingUrl(dateStr) {
        const year = dateStr.substring(0, 4);
        return `years/${year}/daily_readings/${dateStr}_reading.html`;
    }

    function getReadingsJsonUrl(dateStr) {
        const year = dateStr.substring(0, 4);
        return `years/${year}/readings.json`;
    }

    function isDateInFuture(dateStr) {
        const today = getTodayDateString();
        return dateStr > today;
    }

    async function loadReading(dateStr) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const readingContent = document.getElementById('readingContent');

        loadingState.style.display = 'flex';
        errorState.classList.remove('show');
        readingContent.classList.remove('loaded');

        // For future dates, check if this is a fallback reading
        if (isDateInFuture(dateStr)) {
            try {
                const jsonUrl = getReadingsJsonUrl(dateStr);
                const jsonResponse = await fetch(jsonUrl);
                if (jsonResponse.ok) {
                    const data = await jsonResponse.json();
                    const reading = data.readings?.find(r => r.date === dateStr);
                    if (reading && reading.isFallback) {
                        // Future date with only fallback reading - show "not available"
                        showError("This reading is not yet available. Please check back later or browse other readings.");
                        return;
                    }
                }
            } catch (e) {
                // If we can't fetch JSON, just try loading the HTML
                console.log('Could not check readings.json:', e);
            }
        }

        // Load the HTML content
        const url = getReadingUrl(dateStr);

        try {
            const response = await fetch(url);

            if (response.ok) {
                const html = await response.text();
                readingContent.innerHTML = html;
                readingContent.classList.add('loaded');
                loadingState.style.display = 'none';
                updatePageTitle(dateStr);
                updateOpenGraphMeta(dateStr);

                // Initialize all reading features after content injection
                initReadingFeatures();
            } else {
                showError("This reading is not yet available. Please check back later or browse other readings.");
            }
        } catch (error) {
            console.error('Error loading reading:', error);
            showError("Unable to load this reading. Please check your connection or browse other readings.");
        }
    }

    function showError(message) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');

        loadingState.style.display = 'none';
        errorMessage.textContent = message;
        errorState.classList.add('show');
    }

    // ===== NAVIGATION =====

    function updateDayNavigation(dateStr) {
        const date = parseDateString(dateStr);

        const dateDisplay = document.getElementById('currentDateDisplay');
        if (date) {
            dateDisplay.textContent = formatDateDisplay(date);
        }

        const prevBtn = document.getElementById('prevDayBtn');
        const nextBtn = document.getElementById('nextDayBtn');
        const prevDate = getAdjacentDate(dateStr, -1);
        const nextDate = getAdjacentDate(dateStr, 1);

        prevBtn.href = `reading.html?date=${prevDate}`;
        nextBtn.href = `reading.html?date=${nextDate}`;
    }

    function updatePageTitle(dateStr) {
        const date = parseDateString(dateStr);
        const today = getTodayDateString();
        if (dateStr === today) {
            document.title = "Today's Reading - SJLC Daily Bible Readings";
        } else if (date) {
            document.title = `${formatDateDisplay(date)} - SJLC Daily Bible Readings`;
        }
    }

    function updateOpenGraphMeta(dateStr) {
        const passage = document.querySelector('.reading-title')?.textContent || 'Daily Reading';
        const verseCardImage = document.querySelector('.verse-card-image');
        const baseUrl = window.location.origin;
        const pageUrl = `${baseUrl}/reading.html?date=${dateStr}`;

        // Build image URL
        let imageUrl = '';
        if (verseCardImage && verseCardImage.src) {
            // Convert relative path to absolute
            const imgSrc = verseCardImage.getAttribute('src');
            imageUrl = imgSrc.startsWith('http') ? imgSrc : `${baseUrl}/${imgSrc}`;
        }

        const title = `Daily Reading: ${passage}`;
        const description = `Read ${passage} - Daily Bible Readings from St. John Lutheran Church`;

        // Update Open Graph meta tags
        const ogTitle = document.getElementById('og-title');
        const ogDescription = document.getElementById('og-description');
        const ogImage = document.getElementById('og-image');
        const ogUrl = document.getElementById('og-url');

        if (ogTitle) ogTitle.setAttribute('content', title);
        if (ogDescription) ogDescription.setAttribute('content', description);
        if (ogImage) ogImage.setAttribute('content', imageUrl);
        if (ogUrl) ogUrl.setAttribute('content', pageUrl);

        // Update Twitter Card meta tags
        const twitterTitle = document.getElementById('twitter-title');
        const twitterDescription = document.getElementById('twitter-description');
        const twitterImage = document.getElementById('twitter-image');

        if (twitterTitle) twitterTitle.setAttribute('content', title);
        if (twitterDescription) twitterDescription.setAttribute('content', description);
        if (twitterImage) twitterImage.setAttribute('content', imageUrl);
    }

    // ===== READING FEATURES INITIALIZATION =====

    function initReadingFeatures() {
        initSettingsMenu();
        initVerseSelector();
        initFootnotes();
        initCrossrefs();
        initVerseCardCopy();
        initShareButton();
        initCommentaryDevotional();
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
                if (bibleContent) bibleContent.classList.toggle('hide-crossrefs', !e.target.checked);
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
    }

    function savePreference(key, value) {
        localStorage.setItem(`sjlc_${key}`, JSON.stringify(value));
    }

    // ===== VERSE SELECTOR (Full implementation from daily-reading.js) =====

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

            // Check if this is prose (paragraphs with IDs) or poetry (line spans)
            if (paragraphs.length > 0) {
                this.wrapProseVerses(paragraphs);
            } else {
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
            const allVerseNums = this.bibleContentEl.querySelectorAll('.verse-num, .chapter-num');

            allVerseNums.forEach(verseNum => {
                const verseId = verseNum.id;
                if (!verseId) return;

                const match = verseId.match(/v(\d{2})(\d{3})(\d{3})-/);
                if (!match) return;

                const [, bookNum, chapterNum, verseNumParsed] = match;
                const book = this.getBookName(parseInt(bookNum));
                const chapter = parseInt(chapterNum);
                const verse = parseInt(verseNumParsed);

                // For poetry, the verse number is inside a line span
                // We need to wrap the text that follows the verse number within the same line
                const lineSpan = verseNum.closest('.line');
                if (lineSpan) {
                    // Mark this line span as part of a verse
                    lineSpan.classList.add('verse-wrapper');
                    lineSpan.dataset.verseId = verseId;
                    lineSpan.dataset.book = book;
                    lineSpan.dataset.chapter = chapter;
                    lineSpan.dataset.verse = verse;

                    // Also find continuation lines (same verse, multiple lines)
                    // These have the same id pattern on the line span
                    const versePattern = verseId.replace('v', 'p').replace(/-\d+$/, '');
                    const relatedLines = this.bibleContentEl.querySelectorAll(`[id^="${versePattern}"]`);
                    relatedLines.forEach(line => {
                        if (line !== lineSpan && line.classList.contains('line') && !line.dataset.verseId) {
                            line.classList.add('verse-wrapper');
                            line.dataset.verseId = verseId;
                            line.dataset.book = book;
                            line.dataset.chapter = chapter;
                            line.dataset.verse = verse;
                        }
                    });
                } else {
                    // Fallback: wrap text nodes directly after the verse number
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

            if (this.selectedVerses.has(verseId)) {
                this.selectedVerses.delete(verseId);
                verseWrapper.classList.remove('selected');
            } else {
                this.selectedVerses.set(verseId, {
                    book: verseWrapper.dataset.book,
                    chapter: parseInt(verseWrapper.dataset.chapter),
                    verse: parseInt(verseWrapper.dataset.verse),
                    text: this.cleanText(verseWrapper),
                    element: verseWrapper
                });
                verseWrapper.classList.add('selected');
            }

            this.updateFab();
        }

        cleanText(verseWrapper) {
            const clone = verseWrapper.cloneNode(true);
            clone.querySelectorAll('.footnote, .crossref').forEach(el => el.remove());
            return clone.textContent
                .replace(/\[\d+\]/g, '')
                .replace(/\(\w+\)/g, '')
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
            this.selectedVerses.forEach(verse => verse.element.classList.remove('selected'));
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
            link.addEventListener('click', (e) => {
                e.preventDefault();
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
        const crossrefLinks = document.querySelectorAll('.cr');

        crossrefLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const crossrefText = link.getAttribute('data-crossref') || link.textContent;
                const content = `
                    <span class="verse-ref">${crossrefText}</span>
                    <a href="https://www.esv.org/${crossrefText.replace(/\s+/g, '+')}" target="_blank" class="esv-link">
                        View on ESV.org \u2192
                    </a>
                `;
                showModal('Cross Reference', content, 'crossref', e);
            });
        });
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

    // ===== VERSE CARD COPY =====

    function initVerseCardCopy() {
        const copyBtn = document.getElementById('verseCardCopyBtn');
        const verseCardImage = document.querySelector('.verse-card-image');

        if (!copyBtn || !verseCardImage) return;

        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();

            try {
                // Create canvas to convert to PNG (required by Clipboard API)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = verseCardImage.src;
                });

                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);

                copyBtn.textContent = '\u2713';
                copyBtn.classList.add('copied');
                showToast('Image copied to clipboard!');

                setTimeout(() => {
                    copyBtn.textContent = '\uD83D\uDCCB';
                    copyBtn.classList.remove('copied');
                }, 2000);

            } catch (err) {
                console.log('Copy failed:', err);
                // On mobile, clipboard API for images often fails - guide user to native method
                showToast('Long-press image to save or share');
            }
        });
    }

    // ===== SHARE BUTTON =====

    function initShareButton() {
        const shareBtn = document.getElementById('shareBtn');
        const shareSection = shareBtn?.closest('.share-section');
        if (!shareBtn || !shareSection) return;

        // Create share dropdown menu
        const dropdown = document.createElement('div');
        dropdown.className = 'share-dropdown';
        dropdown.innerHTML = `
            <a href="#" class="share-option" data-platform="facebook">
                <span class="share-option-icon">f</span>
                <span class="share-option-label">Facebook</span>
            </a>
            <a href="#" class="share-option" data-platform="twitter">
                <span class="share-option-icon">𝕏</span>
                <span class="share-option-label">X / Twitter</span>
            </a>
            <a href="#" class="share-option" data-platform="whatsapp">
                <span class="share-option-icon">💬</span>
                <span class="share-option-label">WhatsApp</span>
            </a>
            <a href="#" class="share-option" data-platform="email">
                <span class="share-option-icon">✉</span>
                <span class="share-option-label">Email</span>
            </a>
            <a href="#" class="share-option" data-platform="copy">
                <span class="share-option-icon">🔗</span>
                <span class="share-option-label">Copy Link</span>
            </a>
            ${navigator.share ? `
            <a href="#" class="share-option" data-platform="native">
                <span class="share-option-icon">↱</span>
                <span class="share-option-label">More...</span>
            </a>
            ` : ''}
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
            const url = encodeURIComponent(window.location.href);
            const passage = document.querySelector('.reading-title')?.textContent || 'Daily Reading';
            const text = encodeURIComponent(`Check out today's reading: ${passage}`);
            const title = encodeURIComponent(document.title);

            dropdown.classList.remove('active');

            switch (platform) {
                case 'facebook':
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
                    break;
                case 'twitter':
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
                    break;
                case 'whatsapp':
                    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                    break;
                case 'email':
                    window.location.href = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
                    break;
                case 'copy':
                    try {
                        await navigator.clipboard.writeText(decodeURIComponent(url));
                        showToast('Link copied to clipboard!');
                    } catch (err) {
                        showToast('Failed to copy link');
                    }
                    break;
                case 'native':
                    await handleNativeShare();
                    break;
            }
        });

        async function handleNativeShare() {
            const url = window.location.href;
            const title = document.title;
            const passage = document.querySelector('.reading-title')?.textContent || 'Daily Reading';
            const verseCardImage = document.querySelector('.verse-card-image');

            try {
                let shareData = {
                    title: title,
                    text: `Check out today's reading: ${passage}`,
                    url: url
                };

                if (verseCardImage) {
                    try {
                        const imageBlob = await getVerseCardBlob(verseCardImage);
                        if (imageBlob) {
                            const file = new File([imageBlob], 'verse-card.png', { type: 'image/png' });
                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                shareData.files = [file];
                            }
                        }
                    } catch (imgErr) {
                        console.log('Could not include image in share:', imgErr);
                    }
                }

                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.log('Share failed:', err);
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
        const dateStr = getRequestedDate();
        // Set up navigation immediately (before content loads)
        updateDayNavigation(dateStr);
        loadReading(dateStr);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
