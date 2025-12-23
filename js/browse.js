/**
 * Browse Page - Calendar and Search functionality
 * Fetches per-year readings.json and displays an interactive calendar
 */

// State
let yearDataCache = {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allCollections = [];

// DOM Elements
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const calendarGrid = document.getElementById('calendarGrid');
const calendarContainer = document.getElementById('calendarContainer');
const loadingState = document.getElementById('loadingState');
const passageSearch = document.getElementById('passageSearch');
const searchBtn = document.getElementById('searchBtn');
const searchClear = document.getElementById('searchClear');
const searchResults = document.getElementById('searchResults');
const searchResultsList = document.getElementById('searchResultsList');
const calendarLegend = document.getElementById('calendarLegend');

// Search state
let allYearsFetched = false;
let isSearching = false;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    populateYearSelect();
    setupEventListeners();

    // Set initial values
    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    // Load current year and render
    await loadYearData(currentYear);
    renderCalendar(currentYear, currentMonth);
    renderLegend();
}

/**
 * Populate year dropdown (current year +/- 5 years)
 */
function populateYearSelect() {
    const now = new Date().getFullYear();
    for (let year = now - 5; year <= now + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Navigation buttons
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));

    // Dropdowns
    monthSelect.addEventListener('change', () => {
        currentMonth = parseInt(monthSelect.value);
        handleMonthYearChange();
    });

    yearSelect.addEventListener('change', async () => {
        currentYear = parseInt(yearSelect.value);
        await handleMonthYearChange();
    });

    // Search - trigger on button click or Enter key
    searchBtn.addEventListener('click', performSearch);
    searchClear.addEventListener('click', clearSearch);

    // Keyboard support
    passageSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        } else if (e.key === 'Escape') {
            clearSearch();
        }
    });
}

/**
 * Handle month/year dropdown change
 */
async function handleMonthYearChange() {
    // Load year data if not cached
    if (!yearDataCache[currentYear]) {
        showLoading(true);
        await loadYearData(currentYear);
        showLoading(false);
    }
    renderCalendar(currentYear, currentMonth);
}

/**
 * Navigate month forward or backward
 */
async function navigateMonth(delta) {
    currentMonth += delta;

    // Handle year rollover
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    // Update selects
    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    // Load year data if needed
    if (!yearDataCache[currentYear]) {
        showLoading(true);
        await loadYearData(currentYear);
        showLoading(false);
    }

    renderCalendar(currentYear, currentMonth);
}

/**
 * Fetch year data from JSON file
 */
async function loadYearData(year) {
    // Return cached data if available
    if (yearDataCache[year]) {
        return yearDataCache[year];
    }

    try {
        const response = await fetch(`years/${year}/readings.json`);
        if (!response.ok) {
            // Year doesn't exist - cache empty data
            yearDataCache[year] = { year, collections: [], readings: [] };
            return yearDataCache[year];
        }

        const data = await response.json();
        yearDataCache[year] = data;

        // Merge collections into global list (avoid duplicates)
        if (data.collections) {
            data.collections.forEach(col => {
                if (!allCollections.find(c => c.id === col.id)) {
                    allCollections.push(col);
                }
            });
        }

        return data;
    } catch (error) {
        console.warn(`Could not load readings for ${year}:`, error);
        yearDataCache[year] = { year, collections: [], readings: [] };
        return yearDataCache[year];
    }
}

/**
 * Render the calendar grid for a given month/year
 */
function renderCalendar(year, month) {
    calendarGrid.innerHTML = '';

    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    // Get readings for this month
    const monthReadings = getReadingsForMonth(year, month);
    const readingsByDate = {};
    monthReadings.forEach(r => {
        readingsByDate[r.date] = r;
    });

    // Add empty cells for days before the 1st
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }

    // Add day cells
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = formatDate(year, month, day);
        const reading = readingsByDate[dateStr];
        const isToday = (year === today.getFullYear() &&
                        month === today.getMonth() &&
                        day === today.getDate());

        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';

        if (isToday) {
            dayCell.classList.add('today');
        }

        if (reading) {
            dayCell.classList.add('has-reading');
            dayCell.setAttribute('role', 'link');
            dayCell.setAttribute('tabindex', '0');
            dayCell.setAttribute('aria-label', `${reading.passage} - ${formatDateLong(dateStr)}`);

            // Apply collection color if available
            const color = getCollectionColor(reading.collection);
            if (color) {
                dayCell.style.borderLeftColor = color;
            }

            // Click to navigate (link to full page file)
            dayCell.addEventListener('click', () => {
                window.location.href = `years/${year}/daily_readings/${dateStr}_reading.html`;
            });

            // Keyboard support
            dayCell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = `years/${year}/daily_readings/${dateStr}_reading.html`;
                }
            });

            // Tooltip with passage
            dayCell.title = reading.passage;
        }

        // Day number
        const dayNum = document.createElement('span');
        dayNum.className = 'day-number';
        dayNum.textContent = day;
        dayCell.appendChild(dayNum);

        // Show passage preview on hover for readings
        if (reading) {
            const passagePreview = document.createElement('span');
            passagePreview.className = 'passage-preview';
            passagePreview.textContent = reading.passage;
            dayCell.appendChild(passagePreview);
        }

        calendarGrid.appendChild(dayCell);
    }
}

/**
 * Render the legend based on collections
 */
function renderLegend() {
    // Keep the static "Today" and "Reading Available" items
    // Remove any dynamically added collection items
    const dynamicItems = calendarLegend.querySelectorAll('.legend-item-dynamic');
    dynamicItems.forEach(item => item.remove());

    // Add collection items
    allCollections.forEach(collection => {
        const item = document.createElement('div');
        item.className = 'legend-item legend-item-dynamic';

        const dot = document.createElement('span');
        dot.className = 'legend-dot';
        dot.style.backgroundColor = collection.color;

        const label = document.createElement('span');
        label.textContent = collection.name;

        item.appendChild(dot);
        item.appendChild(label);
        calendarLegend.appendChild(item);
    });
}

/**
 * Get readings for a specific month
 */
function getReadingsForMonth(year, month) {
    const data = yearDataCache[year];
    if (!data || !data.readings) return [];

    const monthStr = String(month + 1).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    return data.readings.filter(r => r.date.startsWith(prefix));
}

/**
 * Get color for a collection ID
 */
function getCollectionColor(collectionId) {
    if (!collectionId) return null;
    const collection = allCollections.find(c => c.id === collectionId);
    return collection ? collection.color : null;
}

/**
 * Fetch all years' data for comprehensive search
 */
async function fetchAllYears() {
    if (allYearsFetched) return;

    const currentYearNum = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYearNum + 1;

    // Fetch all years in parallel
    const fetchPromises = [];
    for (let year = startYear; year <= endYear; year++) {
        if (!yearDataCache[year]) {
            fetchPromises.push(loadYearData(year));
        }
    }

    await Promise.all(fetchPromises);
    allYearsFetched = true;
}

/**
 * Perform search (triggered by button click or Enter)
 */
async function performSearch() {
    const query = passageSearch.value.trim();

    if (query.length === 0) {
        return;
    }

    if (isSearching) return;
    isSearching = true;

    // Show searching state
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    searchClear.hidden = false;
    calendarContainer.hidden = true;
    searchResults.hidden = false;
    searchResultsList.innerHTML = '<p class="searching-message">Searching all readings...</p>';

    // Fetch all years if not already done
    await fetchAllYears();

    // Search across all cached years
    const results = searchReadings(query);

    // Reset button state
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
    isSearching = false;

    if (results.length > 0) {
        showSearchResults(results);
    } else {
        showNoResults();
    }
}

/**
 * Search readings by passage text
 */
function searchReadings(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    // Search all cached years
    Object.values(yearDataCache).forEach(yearData => {
        if (!yearData.readings) return;

        yearData.readings.forEach(reading => {
            if (reading.passage.toLowerCase().includes(queryLower)) {
                results.push(reading);
            }
        });
    });

    // Sort by date descending
    results.sort((a, b) => b.date.localeCompare(a.date));

    return results;
}

/**
 * Show search results
 */
function showSearchResults(results) {
    calendarContainer.hidden = true;
    searchResults.hidden = false;

    searchResultsList.innerHTML = '';

    results.forEach(reading => {
        const item = document.createElement('a');
        // Link to full page file
        const year = reading.date.substring(0, 4);
        item.href = `years/${year}/daily_readings/${reading.date}_reading.html`;
        item.className = 'search-result-item';

        const date = document.createElement('span');
        date.className = 'result-date';
        date.textContent = formatDateLong(reading.date);

        const passage = document.createElement('span');
        passage.className = 'result-passage';
        passage.textContent = reading.passage;

        item.appendChild(passage);
        item.appendChild(date);

        // Add collection badge if applicable
        if (reading.collection) {
            const color = getCollectionColor(reading.collection);
            const collection = allCollections.find(c => c.id === reading.collection);
            if (collection) {
                const badge = document.createElement('span');
                badge.className = 'result-badge';
                badge.textContent = collection.name;
                badge.style.backgroundColor = color;
                item.appendChild(badge);
            }
        }

        searchResultsList.appendChild(item);
    });
}

/**
 * Show "no results" message
 */
function showNoResults() {
    calendarContainer.hidden = true;
    searchResults.hidden = false;

    searchResultsList.innerHTML = '<p class="no-results">No readings found matching your search.</p>';
}

/**
 * Clear search and show calendar
 */
function clearSearch() {
    passageSearch.value = '';
    searchClear.hidden = true;
    searchResults.hidden = true;
    calendarContainer.hidden = false;
}

/**
 * Show/hide loading state
 */
function showLoading(show) {
    loadingState.hidden = !show;
    calendarContainer.hidden = show;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
}

/**
 * Format date as "Saturday, November 29, 2025"
 */
function formatDateLong(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
