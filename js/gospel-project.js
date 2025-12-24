/**
 * Gospel Project Page - Dynamic timeline and themes
 * All data loaded from readings.json
 */

(function() {
    'use strict';

    // Bible book to era mapping
    const BIBLE_ERAS = {
        // Era 1: Creation & Patriarchs
        'Genesis': 'Creation & Patriarchs',

        // Era 2: Exodus & Law
        'Exodus': 'Exodus & Law',
        'Leviticus': 'Exodus & Law',
        'Numbers': 'Exodus & Law',
        'Deuteronomy': 'Exodus & Law',

        // Era 3: Conquest & Judges
        'Joshua': 'Conquest & Judges',
        'Judges': 'Conquest & Judges',
        'Ruth': 'Conquest & Judges',

        // Era 4: Kingdom
        '1 Samuel': 'Kingdom',
        '2 Samuel': 'Kingdom',
        '1 Kings': 'Kingdom',
        '2 Kings': 'Kingdom',
        '1 Chronicles': 'Kingdom',
        '2 Chronicles': 'Kingdom',

        // Era 5: Exile & Return
        'Ezra': 'Exile & Return',
        'Nehemiah': 'Exile & Return',
        'Esther': 'Exile & Return',
        'Job': 'Exile & Return',
        'Proverbs': 'Exile & Return',
        'Ecclesiastes': 'Exile & Return',
        'Song of Solomon': 'Exile & Return',
        'Isaiah': 'Exile & Return',
        'Jeremiah': 'Exile & Return',
        'Lamentations': 'Exile & Return',
        'Ezekiel': 'Exile & Return',
        'Daniel': 'Exile & Return',
        'Hosea': 'Exile & Return',
        'Joel': 'Exile & Return',
        'Amos': 'Exile & Return',
        'Obadiah': 'Exile & Return',
        'Jonah': 'Exile & Return',
        'Micah': 'Exile & Return',
        'Nahum': 'Exile & Return',
        'Habakkuk': 'Exile & Return',
        'Zephaniah': 'Exile & Return',
        'Haggai': 'Exile & Return',
        'Zechariah': 'Exile & Return',
        'Malachi': 'Exile & Return',

        // Era 6: Jesus
        'Matthew': 'Jesus',
        'Mark': 'Jesus',
        'Luke': 'Jesus',
        'John': 'Jesus',

        // Era 7: Church
        'Acts': 'Church',
        'Romans': 'Church',
        '1 Corinthians': 'Church',
        '2 Corinthians': 'Church',
        'Galatians': 'Church',
        'Ephesians': 'Church',
        'Philippians': 'Church',
        'Colossians': 'Church',
        '1 Thessalonians': 'Church',
        '2 Thessalonians': 'Church',
        '1 Timothy': 'Church',
        '2 Timothy': 'Church',
        'Titus': 'Church',
        'Philemon': 'Church',
        'Hebrews': 'Church',
        'James': 'Church',
        '1 Peter': 'Church',
        '2 Peter': 'Church',
        '1 John': 'Church',
        '2 John': 'Church',
        '3 John': 'Church',
        'Jude': 'Church',
        'Revelation': 'Church',

        // Psalms - scattered throughout, don't affect era calculation
        'Psalms': null,
        'Psalm': null
    };

    // Era order for milestone display
    const ERA_ORDER = [
        'Creation & Patriarchs',
        'Exodus & Law',
        'Conquest & Judges',
        'Kingdom',
        'Exile & Return',
        'Jesus',
        'Church'
    ];

    // State
    let yearDataCache = {};
    let readings = [];
    let themes = [];

    // DOM Elements
    const pageLoading = document.getElementById('pageLoading');
    const pageContent = document.getElementById('pageContent');
    const timelineFill = document.getElementById('timelineFill');
    const milestonesContainer = document.getElementById('milestonesContainer');
    const progressText = document.getElementById('progressText');
    const themesList = document.getElementById('themesList');

    // Get collection ID from data attribute on pageContent or default
    const collectionId = pageContent?.dataset.collectionId || 'gospel-project-year-one';

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadAllYearData();
        extractReadings();
        calculateProgress();
        renderMilestones();
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
     * Calculate progress and update timeline
     * Progress is based on WHERE in the Bible we are (era), not reading count
     */
    function calculateProgress() {
        if (readings.length === 0) {
            progressText.textContent = 'No readings available yet.';
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find the latest reading (on or before today) that ISN'T Psalms
        let latestNonPsalmReading = null;
        for (let i = readings.length - 1; i >= 0; i--) {
            const readingDate = parseDate(readings[i].date);
            // Skip future readings
            if (readingDate > today) continue;

            const book = extractBook(readings[i].passage);
            if (book !== 'Psalm' && book !== 'Psalms') {
                latestNonPsalmReading = readings[i];
                break;
            }
        }

        if (!latestNonPsalmReading) {
            progressText.textContent = 'The journey begins soon!';
            return;
        }

        // Determine which era this reading belongs to
        const book = extractBook(latestNonPsalmReading.passage);
        const era = BIBLE_ERAS[book];
        const eraIndex = era ? ERA_ORDER.indexOf(era) : -1;

        // Calculate progress as position on timeline (based on era)
        // Each era is evenly spaced, so era 0 = 0%, era 6 = 100%
        const progress = eraIndex >= 0
            ? (eraIndex / (ERA_ORDER.length - 1)) * 100
            : 0;

        // Update progress bar
        timelineFill.style.width = `${progress}%`;

        // Update progress text
        if (eraIndex >= 0) {
            const percentage = Math.round(progress);
            const eraName = ERA_ORDER[eraIndex];
            progressText.innerHTML = `You are <strong>${percentage}% through</strong> the journey (currently in ${eraName})`;
        } else {
            progressText.textContent = 'The journey begins soon!';
        }
    }

    /**
     * Render timeline milestones
     * Shows ALL eras as fixed milestones, with state based on latest non-Psalm reading (on or before today)
     */
    function renderMilestones() {
        milestonesContainer.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find the current era based on latest non-Psalm reading (on or before today)
        let currentEraIndex = -1;

        if (readings.length > 0) {
            // Find the latest reading (on or before today) that ISN'T Psalms
            for (let i = readings.length - 1; i >= 0; i--) {
                const readingDate = parseDate(readings[i].date);
                // Skip future readings
                if (readingDate > today) continue;

                const book = extractBook(readings[i].passage);
                if (book !== 'Psalm' && book !== 'Psalms') {
                    const era = BIBLE_ERAS[book];
                    if (era) {
                        currentEraIndex = ERA_ORDER.indexOf(era);
                    }
                    break;
                }
            }
        }

        // Render ALL eras as milestones, evenly spaced
        ERA_ORDER.forEach((era, i) => {
            // Position evenly across the timeline (0% to 100%)
            const position = (i / (ERA_ORDER.length - 1)) * 100;

            // Determine state based on current era
            let state = 'upcoming';
            if (currentEraIndex >= 0) {
                if (i < currentEraIndex) {
                    state = 'completed';
                } else if (i === currentEraIndex) {
                    state = 'current';
                }
            }

            // Create milestone element
            const milestone = document.createElement('div');
            milestone.className = `timeline-milestone ${state}`;
            milestone.style.left = `${position}%`;

            const dot = document.createElement('div');
            dot.className = 'milestone-dot';

            const label = document.createElement('div');
            label.className = 'milestone-label';
            // Shorten labels for display
            const shortLabels = {
                'Creation & Patriarchs': 'Creation',
                'Exodus & Law': 'Exodus',
                'Conquest & Judges': 'Judges',
                'Kingdom': 'Kingdom',
                'Exile & Return': 'Exile',
                'Jesus': 'Jesus',
                'Church': 'Church'
            };
            label.textContent = shortLabels[era] || era;

            milestone.appendChild(dot);
            milestone.appendChild(label);
            milestonesContainer.appendChild(milestone);
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
