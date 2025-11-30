/**
 * SJLC Daily Bible Readings - Reading Page JavaScript
 * Handles loading daily reading content based on URL date parameter
 */

(function() {
    'use strict';

    // ===== DATE UTILITIES =====

    /**
     * Get date string in YYYY-MM-DD format
     * @param {Date} date - Date object
     * @returns {string} Date in YYYY-MM-DD format
     */
    function formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Parse date string (YYYY-MM-DD) to Date object
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {Date|null} Date object or null if invalid
     */
    function parseDateString(dateStr) {
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return null;
        }
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        // Validate the date is real (e.g., not Feb 30)
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return null;
        }
        return date;
    }

    /**
     * Format date for display (e.g., "November 29, 2025")
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    function formatDateDisplay(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get today's date string
     * @returns {string} Today's date in YYYY-MM-DD format
     */
    function getTodayDateString() {
        return formatDateString(new Date());
    }

    /**
     * Get date from URL parameter or default to today
     * @returns {string} Date string in YYYY-MM-DD format
     */
    function getRequestedDate() {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');

        if (dateParam && parseDateString(dateParam)) {
            return dateParam;
        }
        return getTodayDateString();
    }

    /**
     * Get adjacent date (previous or next day)
     * @param {string} dateStr - Current date string
     * @param {number} offset - Days to add (negative for previous)
     * @returns {string} Adjacent date string
     */
    function getAdjacentDate(dateStr, offset) {
        const date = parseDateString(dateStr);
        if (!date) return dateStr;
        date.setDate(date.getDate() + offset);
        return formatDateString(date);
    }

    // ===== CONTENT LOADING =====

    /**
     * Build URL for reading content file
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {string} URL to reading content file
     */
    function getReadingUrl(dateStr) {
        const year = dateStr.substring(0, 4);
        return `years/${year}/daily_readings/${dateStr}_reading.html`;
    }

    /**
     * Load reading content for a specific date
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     */
    async function loadReading(dateStr) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const readingContent = document.getElementById('readingContent');
        const dayNav = document.getElementById('dayNav');

        // Show loading state
        loadingState.style.display = 'flex';
        errorState.classList.remove('show');
        readingContent.classList.remove('loaded');
        dayNav.style.display = 'none';

        const url = getReadingUrl(dateStr);

        try {
            const response = await fetch(url);

            if (response.ok) {
                const html = await response.text();

                // Inject content
                readingContent.innerHTML = html;
                readingContent.classList.add('loaded');

                // Hide loading, show nav
                loadingState.style.display = 'none';
                dayNav.style.display = 'flex';

                // Update navigation
                updateDayNavigation(dateStr);

                // Update page title
                updatePageTitle(dateStr);

                // Initialize reading functionality (settings, verse selection, etc.)
                initReadingFeatures();

            } else {
                showError(dateStr, "This reading is not yet available. Please check back later or browse other readings.");
            }
        } catch (error) {
            console.error('Error loading reading:', error);
            showError(dateStr, "Unable to load this reading. Please check your connection or browse other readings.");
        }
    }

    /**
     * Show error state
     * @param {string} dateStr - Date that was requested
     * @param {string} message - Error message to display
     */
    function showError(dateStr, message) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        const dayNav = document.getElementById('dayNav');

        loadingState.style.display = 'none';
        errorMessage.textContent = message;
        errorState.classList.add('show');

        // Still show day nav so user can navigate
        dayNav.style.display = 'flex';
        updateDayNavigation(dateStr);
    }

    // ===== NAVIGATION =====

    /**
     * Update day navigation buttons and display
     * @param {string} dateStr - Current date string
     */
    function updateDayNavigation(dateStr) {
        const date = parseDateString(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Update current date display
        const dateDisplay = document.getElementById('currentDateDisplay');
        if (date) {
            dateDisplay.textContent = formatDateDisplay(date);
        }

        // Update prev/next buttons
        const prevBtn = document.getElementById('prevDayBtn');
        const nextBtn = document.getElementById('nextDayBtn');

        const prevDate = getAdjacentDate(dateStr, -1);
        const nextDate = getAdjacentDate(dateStr, 1);

        prevBtn.href = `reading.html?date=${prevDate}`;
        nextBtn.href = `reading.html?date=${nextDate}`;

        // Disable next button if viewing today or future
        const currentDate = parseDateString(dateStr);
        if (currentDate && currentDate >= today) {
            nextBtn.classList.add('disabled');
        } else {
            nextBtn.classList.remove('disabled');
        }
    }

    /**
     * Update page title based on date
     * @param {string} dateStr - Current date string
     */
    function updatePageTitle(dateStr) {
        const date = parseDateString(dateStr);
        const today = getTodayDateString();

        if (dateStr === today) {
            document.title = "Today's Reading - SJLC Daily Bible Readings";
        } else if (date) {
            document.title = `${formatDateDisplay(date)} - SJLC Daily Bible Readings`;
        }
    }

    // ===== READING FEATURES =====

    /**
     * Initialize reading page features after content is loaded
     * (Settings menu, verse selection, footnotes, etc.)
     */
    function initReadingFeatures() {
        initSettingsMenu();
        initVerseSelection();
        initFootnotes();
        initCrossrefs();
        initVerseCardCopy();
        initShareButton();
        initCommentaryDevotional();
    }

    /**
     * Initialize settings menu functionality
     */
    function initSettingsMenu() {
        const settingsBtn = document.querySelector('.settings-btn');
        const settingsMenu = document.querySelector('.settings-menu');

        if (!settingsBtn || !settingsMenu) return;

        // Toggle menu on click
        settingsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            settingsMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsMenu.classList.remove('active');
            }
        });

        // Load saved preferences
        loadDisplayPreferences();

        // Handle checkbox changes
        const checkboxes = settingsMenu.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                handleSettingChange(this);
            });
        });
    }

    /**
     * Load display preferences from localStorage
     */
    function loadDisplayPreferences() {
        const bibleContent = document.querySelector('.bible-content');
        const verseCard = document.querySelector('.verse-card-section');
        const audioSection = document.querySelector('.audio-section');
        const footnotes = document.querySelector('.footnotes');

        // Verse card
        const showVerseCard = localStorage.getItem('showVerseCard') !== 'false';
        const verseCardCheckbox = document.getElementById('toggleVerseCard');
        if (verseCardCheckbox) verseCardCheckbox.checked = showVerseCard;
        if (verseCard) verseCard.classList.toggle('hidden', !showVerseCard);

        // Audio
        const showAudio = localStorage.getItem('showAudio') !== 'false';
        const audioCheckbox = document.getElementById('toggleAudio');
        if (audioCheckbox) audioCheckbox.checked = showAudio;
        if (audioSection) audioSection.classList.toggle('hidden', !showAudio);

        // Footnotes (inline markers)
        const showFootnotes = localStorage.getItem('showFootnotes') !== 'false';
        const footnotesCheckbox = document.getElementById('toggleFootnotes');
        if (footnotesCheckbox) footnotesCheckbox.checked = showFootnotes;
        if (bibleContent) bibleContent.classList.toggle('hide-footnotes', !showFootnotes);
        if (footnotes) footnotes.classList.toggle('hidden', !showFootnotes);

        // Crossrefs
        const showCrossrefs = localStorage.getItem('showCrossrefs') !== 'false';
        const crossrefsCheckbox = document.getElementById('toggleCrossrefs');
        if (crossrefsCheckbox) crossrefsCheckbox.checked = showCrossrefs;
        if (bibleContent) bibleContent.classList.toggle('hide-crossrefs', !showCrossrefs);
    }

    /**
     * Handle settings checkbox change
     * @param {HTMLInputElement} checkbox - The checkbox that changed
     */
    function handleSettingChange(checkbox) {
        const bibleContent = document.querySelector('.bible-content');
        const verseCard = document.querySelector('.verse-card-section');
        const audioSection = document.querySelector('.audio-section');
        const footnotes = document.querySelector('.footnotes');

        switch (checkbox.id) {
            case 'toggleVerseCard':
                localStorage.setItem('showVerseCard', checkbox.checked);
                if (verseCard) verseCard.classList.toggle('hidden', !checkbox.checked);
                break;
            case 'toggleAudio':
                localStorage.setItem('showAudio', checkbox.checked);
                if (audioSection) audioSection.classList.toggle('hidden', !checkbox.checked);
                break;
            case 'toggleFootnotes':
                localStorage.setItem('showFootnotes', checkbox.checked);
                if (bibleContent) bibleContent.classList.toggle('hide-footnotes', !checkbox.checked);
                if (footnotes) footnotes.classList.toggle('hidden', !checkbox.checked);
                break;
            case 'toggleCrossrefs':
                localStorage.setItem('showCrossrefs', checkbox.checked);
                if (bibleContent) bibleContent.classList.toggle('hide-crossrefs', !checkbox.checked);
                break;
        }
    }

    /**
     * Initialize verse selection functionality
     */
    function initVerseSelection() {
        const bibleContent = document.querySelector('.bible-content');
        if (!bibleContent) return;

        const verseWrappers = bibleContent.querySelectorAll('.verse-wrapper');
        const copyFab = document.querySelector('.copy-fab');
        const copyButton = document.querySelector('.copy-button');
        const clearButton = document.querySelector('.clear-selection-button');
        const verseCountBadge = document.querySelector('.verse-count-badge');

        if (!verseWrappers.length) return;

        let selectedVerses = new Set();

        // Click to select/deselect verses
        verseWrappers.forEach(wrapper => {
            wrapper.addEventListener('click', function(e) {
                // Don't select if clicking on footnote/crossref
                if (e.target.closest('.footnote') || e.target.closest('.crossref')) return;

                const verseNum = this.dataset.verse;
                if (selectedVerses.has(verseNum)) {
                    selectedVerses.delete(verseNum);
                    this.classList.remove('selected');
                } else {
                    selectedVerses.add(verseNum);
                    this.classList.add('selected');
                }
                updateCopyFab();
            });
        });

        function updateCopyFab() {
            if (!copyFab) return;

            if (selectedVerses.size > 0) {
                copyFab.classList.add('visible');
                if (verseCountBadge) {
                    verseCountBadge.textContent = selectedVerses.size;
                }
            } else {
                copyFab.classList.remove('visible');
            }
        }

        // Copy button
        if (copyButton) {
            copyButton.addEventListener('click', function() {
                copySelectedVerses(selectedVerses, verseWrappers);
            });
        }

        // Clear button
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                selectedVerses.clear();
                verseWrappers.forEach(w => w.classList.remove('selected'));
                updateCopyFab();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (selectedVerses.size > 0) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                    copySelectedVerses(selectedVerses, verseWrappers);
                }
                if (e.key === 'Escape') {
                    selectedVerses.clear();
                    verseWrappers.forEach(w => w.classList.remove('selected'));
                    updateCopyFab();
                }
            }
        });
    }

    /**
     * Copy selected verses to clipboard
     * @param {Set} selectedVerses - Set of selected verse numbers
     * @param {NodeList} verseWrappers - All verse wrapper elements
     */
    function copySelectedVerses(selectedVerses, verseWrappers) {
        if (selectedVerses.size === 0) return;

        // Get passage reference from page
        const readingTitle = document.querySelector('.reading-title');
        const passage = readingTitle ? readingTitle.textContent.trim() : '';

        // Sort verse numbers
        const sortedVerses = Array.from(selectedVerses).sort((a, b) => parseInt(a) - parseInt(b));

        // Build verse text
        let verseTexts = [];
        sortedVerses.forEach(verseNum => {
            const wrapper = Array.from(verseWrappers).find(w => w.dataset.verse === verseNum);
            if (wrapper) {
                // Get clean text (remove footnotes/crossrefs)
                const clone = wrapper.cloneNode(true);
                clone.querySelectorAll('.footnote, .crossref').forEach(el => el.remove());
                verseTexts.push(`${verseNum} ${clone.textContent.trim()}`);
            }
        });

        // Format reference
        const reference = formatVerseReference(passage, sortedVerses);
        const text = `${verseTexts.join('\n')}\n\n${reference}`;

        // Copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            showToast('Verses copied to clipboard!');
        }).catch(() => {
            showToast('Failed to copy verses');
        });
    }

    /**
     * Format verse reference string
     * @param {string} passage - Base passage (e.g., "John 3")
     * @param {Array} verses - Sorted array of verse numbers
     * @returns {string} Formatted reference
     */
    function formatVerseReference(passage, verses) {
        if (verses.length === 1) {
            return `${passage}:${verses[0]}`;
        }

        // Group consecutive verses
        let ranges = [];
        let start = verses[0];
        let end = verses[0];

        for (let i = 1; i < verses.length; i++) {
            if (parseInt(verses[i]) === parseInt(end) + 1) {
                end = verses[i];
            } else {
                ranges.push(start === end ? start : `${start}-${end}`);
                start = end = verses[i];
            }
        }
        ranges.push(start === end ? start : `${start}-${end}`);

        return `${passage}:${ranges.join(', ')}`;
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     */
    function showToast(message) {
        let toast = document.querySelector('.verse-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'verse-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    /**
     * Initialize footnote popups
     */
    function initFootnotes() {
        const footnoteLinks = document.querySelectorAll('.footnote a.fn');

        footnoteLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const fnId = this.getAttribute('href')?.replace('#', '');
                const footnote = document.getElementById(fnId);
                if (footnote) {
                    showModal('Footnote', footnote.textContent.trim(), 'footnote');
                }
            });
        });
    }

    /**
     * Initialize cross-reference popups
     */
    function initCrossrefs() {
        const crossrefLinks = document.querySelectorAll('.crossref a.cr');

        crossrefLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const refs = this.getAttribute('data-refs') || this.textContent;
                showModal('Cross References', refs, 'crossref');
            });
        });
    }

    /**
     * Show modal popup
     * @param {string} title - Modal title
     * @param {string} content - Modal content
     * @param {string} type - Modal type (footnote/crossref)
     */
    function showModal(title, content, type) {
        // Remove existing modal
        const existingOverlay = document.querySelector('.modal-overlay');
        if (existingOverlay) existingOverlay.remove();

        // Create modal
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

        // Position modal
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close handlers
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handler);
            }
        });
    }

    /**
     * Initialize verse card copy button
     */
    function initVerseCardCopy() {
        const copyBtn = document.querySelector('.verse-card-copy-btn');
        const verseCardImg = document.querySelector('.verse-card-image');

        if (!copyBtn || !verseCardImg) return;

        copyBtn.addEventListener('click', async function() {
            try {
                const response = await fetch(verseCardImg.src);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                this.classList.add('copied');
                this.textContent = 'Copied!';
                setTimeout(() => {
                    this.classList.remove('copied');
                    this.innerHTML = '&#x1F4CB;';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy image:', err);
                showToast('Failed to copy image');
            }
        });
    }

    /**
     * Initialize share button
     */
    function initShareButton() {
        const shareBtn = document.querySelector('.share-btn');
        if (!shareBtn) return;

        // Show share section
        const shareSection = shareBtn.closest('.share-section');
        if (shareSection) shareSection.style.display = 'block';

        shareBtn.addEventListener('click', async function() {
            const url = window.location.href;
            const title = document.title;
            const passage = document.querySelector('.reading-title')?.textContent || 'Daily Reading';

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: title,
                        text: `Check out today's reading: ${passage}`,
                        url: url
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        copyToClipboard(url);
                    }
                }
            } else {
                copyToClipboard(url);
            }
        });

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Link copied to clipboard!');
            });
        }
    }

    /**
     * Initialize commentary and devotional panels
     */
    function initCommentaryDevotional() {
        const commentaryBtn = document.querySelector('.content-btn.commentary');
        const devotionalBtn = document.querySelector('.content-btn.devotional');

        if (commentaryBtn) {
            commentaryBtn.addEventListener('click', function() {
                openSidePanel('Commentary', 'commentary');
            });
        }

        if (devotionalBtn) {
            devotionalBtn.addEventListener('click', function() {
                openSidePanel('Devotional', 'devotional');
            });
        }
    }

    /**
     * Open side panel
     * @param {string} title - Panel title
     * @param {string} type - Panel type (commentary/devotional)
     */
    function openSidePanel(title, type) {
        // Remove existing panel
        const existingOverlay = document.querySelector('.side-panel-overlay');
        if (existingOverlay) existingOverlay.remove();

        // Get content from hidden divs
        const contentDiv = document.querySelector(`.${type}-content`);
        const content = contentDiv ? contentDiv.innerHTML : '<p>Content not available.</p>';

        // Create panel
        const overlay = document.createElement('div');
        overlay.className = 'side-panel-overlay active';

        const panel = document.createElement('div');
        panel.className = `side-panel active`;
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
        setTimeout(() => panel.classList.add('active'), 10);

        // Close handlers
        const closeBtn = panel.querySelector('.side-panel-close');
        closeBtn.addEventListener('click', closeSidePanel);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSidePanel();
        });

        function closeSidePanel() {
            panel.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // ===== INITIALIZATION =====

    function init() {
        const dateStr = getRequestedDate();
        loadReading(dateStr);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
