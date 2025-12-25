/**
 * Gospel Project Page - Dynamic timeline and themes
 * All data loaded from readings.json
 *
 * Progress is calculated based on Bible book and chapter position,
 * not reading count, to handle schedule variations gracefully.
 */

(function() {
    'use strict';

    // Bible book chapter counts (for progress calculation)
    const BOOK_CHAPTERS = {
        'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
        'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
        '1 Kings': 22, '2 Kings': 25, 'Proverbs': 31, 'Ecclesiastes': 12, 'Job': 42,
        '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10, 'Nehemiah': 13, 'Esther': 10,
        'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12,
        'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4,
        'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2,
        'Zechariah': 14, 'Malachi': 4, 'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21,
        'Acts': 28, 'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13,
        'Galatians': 6, 'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
        '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4,
        'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5,
        '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
        'Jude': 1, 'Revelation': 22
    };

    // Year One volume configuration (4 volumes/seasons)
    const YEAR_ONE_VOLUMES = [
        {
            number: 1,
            name: 'Creation & Patriarchs',
            season: 'Fall',
            books: ['Genesis'],
            startPercent: 0,
            endPercent: 25
        },
        {
            number: 2,
            name: 'God Delivers',
            season: 'Winter',
            books: ['Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'],
            startPercent: 25,
            endPercent: 50
        },
        {
            number: 3,
            name: 'The Promised Land',
            season: 'Spring',
            books: ['Joshua', 'Judges', 'Ruth', '1 Samuel'],
            startPercent: 50,
            endPercent: 75
        },
        {
            number: 4,
            name: 'Kingdom Established',
            season: 'Summer',
            books: ['2 Samuel', '1 Kings', 'Proverbs', 'Ecclesiastes', 'Job'],
            startPercent: 75,
            endPercent: 100
        }
    ];


    // State
    let yearDataCache = {};
    let readings = [];
    let themes = [];

    // DOM Elements
    const pageLoading = document.getElementById('pageLoading');
    const pageContent = document.getElementById('pageContent');
    const yearTimelineFill = document.getElementById('yearTimelineFill');
    const volumeMilestones = document.getElementById('volumeMilestones');
    const yearProgressText = document.getElementById('yearProgressText');
    const themesList = document.getElementById('themesList');

    // Get collection ID from data attribute
    const collectionId = pageContent?.dataset.collectionId || 'gospel-project-year-one';

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadAllYearData();
        extractReadings();
        const progressResult = calculateYearProgress();
        renderVolumeMilestones(progressResult.currentVolume);
        renderThemes();
        showContent();
    }

    /**
     * Load data from all available years
     */
    async function loadAllYearData() {
        const currentYear = new Date().getFullYear();
        const startYear = 2020;
        const endYear = currentYear + 5;

        const fetchPromises = [];
        for (let year = startYear; year <= endYear; year++) {
            fetchPromises.push(loadYearData(year));
        }

        await Promise.all(fetchPromises);
    }

    /**
     * Fetch year data from JSON file
     */
    async function loadYearData(year) {
        try {
            // Handle relative paths for subdirectory pages
            const basePath = window.location.pathname.includes('/collections/') ? '../' : '';
            const response = await fetch(`${basePath}years/${year}/readings.json`);
            if (!response.ok) {
                yearDataCache[year] = { year, collections: [], readings: [] };
                return;
            }
            yearDataCache[year] = await response.json();
        } catch (error) {
            yearDataCache[year] = { year, collections: [], readings: [] };
        }
    }

    /**
     * Extract readings for this collection
     */
    function extractReadings() {
        readings = [];

        Object.values(yearDataCache).forEach(yearData => {
            if (yearData.readings) {
                yearData.readings.forEach(reading => {
                    if (reading.collection === collectionId) {
                        readings.push(reading);
                    }
                });
            }
        });

        // Sort by date
        readings.sort((a, b) => a.date.localeCompare(b.date));

        // Group into themes
        groupIntoThemes();
    }

    /**
     * Group readings into themes
     */
    function groupIntoThemes() {
        themes = [];
        let currentTheme = null;

        readings.forEach(reading => {
            const themeName = reading.theme || 'Untitled';

            if (!currentTheme || currentTheme.name !== themeName) {
                // Start new theme
                currentTheme = {
                    name: themeName,
                    readings: [],
                    startDate: reading.date,
                    endDate: reading.date
                };
                themes.push(currentTheme);
            }

            currentTheme.readings.push(reading);
            currentTheme.endDate = reading.date;
        });

        // Calculate overall passage for each theme
        themes.forEach(theme => {
            if (theme.readings.length > 0) {
                // Get unique books
                const books = [...new Set(theme.readings.map(r => extractBook(r.passage)))];
                theme.passage = books.join(', ');
            }
        });
    }

    /**
     * Extract book name from passage (e.g., "Genesis 1:1-13" -> "Genesis")
     */
    function extractBook(passage) {
        // Handle numbered books (1 Samuel, 2 Kings, etc.)
        const match = passage.match(/^(\d?\s*[A-Za-z]+)/);
        return match ? match[1].trim() : passage;
    }

    /**
     * Extract ending chapter from passage (e.g., "Genesis 42:1-45:28" -> 45)
     */
    function extractEndingChapter(passage) {
        // Handle various passage formats:
        // "Genesis 1:1-13" -> 1
        // "Genesis 42:1-45:28" -> 45
        // "Genesis 1:1-2:3" -> 2
        // "Genesis 50:1-26" -> 50

        // Look for the last chapter reference (before last colon or at end)
        // Pattern: find all chapter:verse references
        const matches = passage.match(/(\d+):\d+/g);
        if (matches && matches.length > 0) {
            // Get the last match and extract the chapter number
            const lastMatch = matches[matches.length - 1];
            return parseInt(lastMatch.split(':')[0]);
        }

        // Fallback: look for any number after the book name
        const simpleMatch = passage.match(/\s(\d+)/);
        return simpleMatch ? parseInt(simpleMatch[1]) : 1;
    }

    /**
     * Calculate year progress based on Bible book and chapter
     * Progress is gradual within volumes, not discrete jumps
     */
    function calculateYearProgress() {
        if (readings.length === 0) {
            if (yearProgressText) yearProgressText.textContent = 'No readings available yet.';
            return { progressPercent: 0, currentVolume: null };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find the latest reading (on or before today) that ISN'T Psalms
        let latestReading = null;
        for (let i = readings.length - 1; i >= 0; i--) {
            const readingDate = parseDate(readings[i].date);
            if (readingDate > today) continue;

            const book = extractBook(readings[i].passage);
            if (book !== 'Psalm' && book !== 'Psalms') {
                latestReading = readings[i];
                break;
            }
        }

        if (!latestReading) {
            if (yearProgressText) yearProgressText.textContent = 'The journey begins soon!';
            return { progressPercent: 0, currentVolume: null };
        }

        // Extract book and chapter
        const book = extractBook(latestReading.passage);
        const chapter = extractEndingChapter(latestReading.passage);
        const totalChapters = BOOK_CHAPTERS[book] || 50;

        // Find which volume this book belongs to
        const volume = YEAR_ONE_VOLUMES.find(v => v.books.includes(book));

        if (!volume) {
            // Book not in Year One config - show at 0%
            if (yearProgressText) yearProgressText.textContent = `Currently reading: ${book}`;
            return { progressPercent: 0, currentVolume: null };
        }

        // Calculate position within volume based on book index + chapter progress
        const bookIndex = volume.books.indexOf(book);
        const booksInVolume = volume.books.length;
        const volumeWidth = volume.endPercent - volume.startPercent;

        // Each book gets equal share of volume width
        const bookWidth = volumeWidth / booksInVolume;
        const bookStart = volume.startPercent + (bookIndex * bookWidth);
        const chapterProgress = chapter / totalChapters;

        const progressPercent = bookStart + (chapterProgress * bookWidth);

        // Update progress bar
        if (yearTimelineFill) {
            yearTimelineFill.style.width = `${progressPercent}%`;
        }

        // Update progress text
        if (yearProgressText) {
            yearProgressText.innerHTML = `<strong>Volume ${volume.number}:</strong> ${volume.name}`;
        }

        return { progressPercent, currentVolume: volume };
    }

    /**
     * Render volume milestones (4 volumes for Year One)
     */
    function renderVolumeMilestones(currentVolume) {
        if (!volumeMilestones) return;
        volumeMilestones.innerHTML = '';

        YEAR_ONE_VOLUMES.forEach((volume, i) => {
            // Position at volume start (0%, 25%, 50%, 75%)
            const position = volume.startPercent;

            // Determine state based on current volume
            let state = 'upcoming';
            if (currentVolume) {
                if (volume.number < currentVolume.number) {
                    state = 'completed';
                } else if (volume.number === currentVolume.number) {
                    state = 'current';
                }
            }

            // Create milestone element
            const milestone = document.createElement('div');
            milestone.className = `volume-milestone ${state}`;
            milestone.style.left = `${position}%`;

            const dot = document.createElement('div');
            dot.className = 'milestone-dot';

            const label = document.createElement('div');
            label.className = 'milestone-label';
            label.textContent = volume.name;

            milestone.appendChild(dot);
            milestone.appendChild(label);
            volumeMilestones.appendChild(milestone);
        });
    }

    /**
     * Render themes accordion
     */
    function renderThemes() {
        themesList.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Handle relative paths for subdirectory pages
        const basePath = window.location.pathname.includes('/collections/') ? '../' : '';

        themes.forEach((theme, index) => {
            const themeItem = document.createElement('div');
            themeItem.className = 'theme-item';
            themeItem.id = `theme-${index}`;

            // Determine theme status
            const startDate = parseDate(theme.startDate);
            const endDate = parseDate(theme.endDate);

            let status = 'upcoming';
            let statusIcon = '';

            if (today > endDate) {
                status = 'completed';
                statusIcon = '\u2713';
            } else if (today >= startDate) {
                status = 'current';
                statusIcon = '\u2192';
                themeItem.classList.add('expanded'); // Auto-expand current theme
            }

            // Header
            const header = document.createElement('div');
            header.className = 'theme-header';
            header.onclick = () => toggleTheme(index);

            header.innerHTML = `
                <div class="theme-info">
                    <div class="theme-status ${status}">${statusIcon}</div>
                    <div class="theme-title-group">
                        <h4 class="theme-name">${theme.name}</h4>
                        <div class="theme-dates">${formatDateRange(theme.startDate, theme.endDate)}</div>
                    </div>
                    <div class="theme-passage">${theme.passage || ''}</div>
                </div>
                <div class="theme-toggle"></div>
            `;

            // Content (days)
            const content = document.createElement('div');
            content.className = 'theme-content';

            const days = document.createElement('div');
            days.className = 'theme-days';

            const grid = document.createElement('div');
            grid.className = 'days-grid';

            theme.readings.forEach(reading => {
                const readingDate = parseDate(reading.date);
                let dayStatus = '';

                if (readingDate < today) {
                    dayStatus = 'completed';
                } else if (readingDate.toDateString() === today.toDateString()) {
                    dayStatus = 'current';
                }

                const dayLink = document.createElement('a');
                dayLink.href = `${basePath}reading.html?date=${reading.date}`;
                dayLink.className = `day-link ${dayStatus}`;

                dayLink.innerHTML = `
                    <div class="day-info">
                        <div class="day-date">${formatDateShort(reading.date)}</div>
                        <div class="day-passage">${reading.passage}</div>
                    </div>
                    <div class="day-arrow">\u2192</div>
                `;

                grid.appendChild(dayLink);
            });

            days.appendChild(grid);
            content.appendChild(days);

            themeItem.appendChild(header);
            themeItem.appendChild(content);
            themesList.appendChild(themeItem);
        });
    }

    /**
     * Toggle theme expansion
     */
    window.toggleTheme = function(index) {
        const themeItem = document.getElementById(`theme-${index}`);
        themeItem.classList.toggle('expanded');
    };

    /**
     * Show page content
     */
    function showContent() {
        pageLoading.hidden = true;
        pageContent.hidden = false;
    }

    /**
     * Parse YYYY-MM-DD to Date
     */
    function parseDate(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    /**
     * Format date range
     */
    function formatDateRange(startDate, endDate) {
        const start = parseDate(startDate);
        const end = parseDate(endDate);

        const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
        const startDay = start.getDate();
        const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
        const endDay = end.getDate();
        const year = end.getFullYear();

        if (startMonth === endMonth) {
            return `${startMonth} ${startDay}-${endDay}, ${year}`;
        }

        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }

    /**
     * Format date as "Mon 15"
     */
    function formatDateShort(dateStr) {
        const date = parseDate(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

})();
