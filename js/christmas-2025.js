/**
 * Christmas 2025 Page - Countdown and themes
 * All data loaded from readings.json
 */

(function() {
    'use strict';

    // Theme icons for visual variety
    const THEME_ICONS = {
        'Prophecy & Longing': '&#128220;',      // Scroll
        'Prophecy to Preparation': '&#128310;', // Candle
        'Preparation to Birth': '&#11088;',     // Star
        'Incarnation & Wonder': '&#127873;'     // Gift
    };

    // State
    let yearDataCache = {};
    let readings = [];
    let themes = [];

    // DOM Elements
    const pageLoading = document.getElementById('pageLoading');
    const pageContent = document.getElementById('pageContent');
    const countdownSection = document.getElementById('countdownSection');
    const countdownLabel = document.getElementById('countdownLabel');
    const countdownNumber = document.getElementById('countdownNumber');
    const countdownFill = document.getElementById('countdownFill');
    const themesList = document.getElementById('themesList');

    // Get collection ID from data attribute
    const collectionId = pageContent?.dataset.collectionId || 'christmas-2025';

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadAllYearData();
        extractReadings();
        updateCountdown();
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
            const themeName = reading.theme || 'Readings';

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
    }

    /**
     * Update countdown display
     */
    function updateCountdown() {
        // Find Christmas day in this collection's year
        const christmasReading = readings.find(r => r.date.endsWith('-12-25'));
        if (!christmasReading) {
            countdownSection.hidden = true;
            return;
        }

        const christmasYear = parseInt(christmasReading.date.substring(0, 4));
        const christmas = parseDate(christmasReading.date);
        const epiphany = new Date(christmasYear + 1, 0, 6); // Jan 6 of next year
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find collection start date
        const startDate = readings.length > 0 ? parseDate(readings[0].date) : today;

        const daysUntilChristmas = Math.ceil((christmas - today) / (1000 * 60 * 60 * 24));
        const daysUntilEpiphany = Math.ceil((epiphany - today) / (1000 * 60 * 60 * 24));
        const totalDaysToChristmas = Math.ceil((christmas - startDate) / (1000 * 60 * 60 * 24));
        const daysPassed = totalDaysToChristmas - daysUntilChristmas;

        if (daysUntilChristmas > 0) {
            // Before Christmas
            countdownLabel.textContent = 'Days until Christmas';
            countdownNumber.textContent = daysUntilChristmas;

            // Progress bar: how far through to Christmas
            const progress = Math.max(0, Math.min(100, (daysPassed / totalDaysToChristmas) * 100));
            countdownFill.style.width = `${progress}%`;
        } else if (daysUntilChristmas === 0) {
            // Christmas Day!
            countdownSection.classList.add('christmas-passed');
            countdownLabel.textContent = 'Merry Christmas!';
            countdownNumber.innerHTML = '&#127876;'; // Christmas tree
            countdownFill.style.width = '100%';
        } else if (daysUntilEpiphany > 0) {
            // After Christmas, before Epiphany
            countdownSection.classList.add('christmas-passed');
            countdownLabel.textContent = 'Days until Epiphany';
            countdownNumber.textContent = daysUntilEpiphany;

            // Progress bar: Christmas to Epiphany
            const totalChristmastide = 12; // 12 days of Christmas
            const daysIntoChristmastide = 12 - daysUntilEpiphany;
            const progress = Math.max(0, Math.min(100, (daysIntoChristmastide / totalChristmastide) * 100));
            countdownFill.style.width = `${progress}%`;
        } else if (daysUntilEpiphany === 0) {
            // Epiphany!
            countdownSection.classList.add('christmas-passed');
            countdownLabel.textContent = 'Happy Epiphany!';
            countdownNumber.innerHTML = '&#11088;'; // Star
            countdownFill.style.width = '100%';
        } else {
            // After Epiphany - season complete
            countdownSection.classList.add('christmas-passed');
            countdownLabel.textContent = 'Season Complete';
            countdownNumber.innerHTML = '&#10003;'; // Checkmark
            countdownFill.style.width = '100%';
        }
    }

    /**
     * Render themes
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
                statusIcon = '\u2713'; // Checkmark
            } else if (today >= startDate) {
                status = 'current';
                statusIcon = '\u2192'; // Arrow
                themeItem.classList.add('expanded'); // Auto-expand current theme
            }

            // Get theme icon
            const themeIcon = THEME_ICONS[theme.name] || '&#128218;'; // Default: book

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
                let extraClass = '';

                if (readingDate < today) {
                    dayStatus = 'completed';
                } else if (readingDate.toDateString() === today.toDateString()) {
                    dayStatus = 'current';
                }

                // Special styling for Christmas Day
                if (reading.date.endsWith('-12-25')) {
                    extraClass = ' christmas-day';
                }

                const dayLink = document.createElement('a');
                dayLink.href = `${basePath}reading.html?date=${reading.date}`;
                dayLink.className = `day-link ${dayStatus}${extraClass}`;

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
     * Format date as "Thu, Dec 25"
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
