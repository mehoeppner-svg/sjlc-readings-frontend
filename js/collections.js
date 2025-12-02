/**
 * Collections Page - Display and filter reading collections
 * Fetches per-year readings.json and displays collection cards
 */

// State
let yearDataCache = {};
let collectionsData = {}; // collectionId -> { ...collection, readings: [], startDate, endDate }
let currentYear = new Date().getFullYear();
let minYear = currentYear;
let maxYear = currentYear;

// DOM Elements
const yearDisplay = document.getElementById('yearDisplay');
const prevYearBtn = document.getElementById('prevYear');
const nextYearBtn = document.getElementById('nextYear');
const collectionsList = document.getElementById('collectionsList');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    await loadAllYearData();
    buildCollectionsData();
    updateYearDisplay();
    renderCollections();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    prevYearBtn.addEventListener('click', () => navigateYear(-1));
    nextYearBtn.addEventListener('click', () => navigateYear(1));
}

/**
 * Navigate year forward or backward
 */
function navigateYear(delta) {
    const newYear = currentYear + delta;
    if (newYear >= minYear && newYear <= maxYear) {
        currentYear = newYear;
        updateYearDisplay();
        renderCollections();
    }
}

/**
 * Update year display and button states
 */
function updateYearDisplay() {
    yearDisplay.textContent = currentYear;
    prevYearBtn.disabled = currentYear <= minYear;
    nextYearBtn.disabled = currentYear >= maxYear;
}

/**
 * Load data from all available years
 */
async function loadAllYearData() {
    showLoading(true);

    const currentYearNum = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYearNum + 2;

    // Fetch all years in parallel
    const fetchPromises = [];
    for (let year = startYear; year <= endYear; year++) {
        fetchPromises.push(loadYearData(year));
    }

    await Promise.all(fetchPromises);

    // Determine min/max years that have collections
    const yearsWithCollections = new Set();
    Object.values(collectionsData).forEach(col => {
        if (col.readings.length > 0) {
            col.readings.forEach(r => {
                yearsWithCollections.add(parseInt(r.date.substring(0, 4)));
            });
        }
    });

    if (yearsWithCollections.size > 0) {
        minYear = Math.min(...yearsWithCollections);
        maxYear = Math.max(...yearsWithCollections);
    }

    showLoading(false);
}

/**
 * Fetch year data from JSON file
 */
async function loadYearData(year) {
    if (yearDataCache[year]) {
        return yearDataCache[year];
    }

    try {
        const response = await fetch(`years/${year}/readings.json`);
        if (!response.ok) {
            yearDataCache[year] = { year, collections: [], readings: [] };
            return yearDataCache[year];
        }

        const data = await response.json();
        yearDataCache[year] = data;
        return data;
    } catch (error) {
        console.warn(`Could not load readings for ${year}:`, error);
        yearDataCache[year] = { year, collections: [], readings: [] };
        return yearDataCache[year];
    }
}

/**
 * Build collections data from all year caches
 */
function buildCollectionsData() {
    collectionsData = {};

    // First pass: gather all collections metadata
    Object.values(yearDataCache).forEach(yearData => {
        if (yearData.collections) {
            yearData.collections.forEach(col => {
                if (!collectionsData[col.id]) {
                    collectionsData[col.id] = {
                        ...col,
                        readings: [],
                        startDate: null,
                        endDate: null
                    };
                }
            });
        }
    });

    // Second pass: gather all readings per collection
    Object.values(yearDataCache).forEach(yearData => {
        if (yearData.readings) {
            yearData.readings.forEach(reading => {
                if (reading.collection && collectionsData[reading.collection]) {
                    collectionsData[reading.collection].readings.push(reading);
                }
            });
        }
    });

    // Calculate date ranges
    Object.values(collectionsData).forEach(col => {
        if (col.readings.length > 0) {
            // Sort readings by date
            col.readings.sort((a, b) => a.date.localeCompare(b.date));
            col.startDate = col.readings[0].date;
            col.endDate = col.readings[col.readings.length - 1].date;
        }
    });

    // Update min/max years
    const yearsWithCollections = new Set();
    Object.values(collectionsData).forEach(col => {
        if (col.readings.length > 0) {
            col.readings.forEach(r => {
                yearsWithCollections.add(parseInt(r.date.substring(0, 4)));
            });
        }
    });

    if (yearsWithCollections.size > 0) {
        minYear = Math.min(...yearsWithCollections);
        maxYear = Math.max(...yearsWithCollections);
    }
}

/**
 * Get collections that have readings in the given year
 */
function getCollectionsForYear(year) {
    const yearStr = String(year);

    return Object.values(collectionsData)
        .filter(col => {
            // Check if any readings fall in this year
            return col.readings.some(r => r.date.startsWith(yearStr));
        })
        .sort((a, b) => {
            // Sort by start date
            if (!a.startDate) return 1;
            if (!b.startDate) return -1;
            return a.startDate.localeCompare(b.startDate);
        });
}

/**
 * Render collection cards for current year
 */
function renderCollections() {
    const collections = getCollectionsForYear(currentYear);

    collectionsList.innerHTML = '';

    if (collections.length === 0) {
        collectionsList.hidden = true;
        emptyState.hidden = false;
        return;
    }

    collectionsList.hidden = false;
    emptyState.hidden = true;

    collections.forEach(col => {
        const card = createCollectionCard(col);
        collectionsList.appendChild(card);
    });
}

/**
 * Create a collection card element
 */
function createCollectionCard(collection) {
    const card = document.createElement('a');
    card.className = 'collection-card';
    card.href = collection.url || `collections/${collection.id}.html`;
    card.style.setProperty('--collection-color', collection.color || 'var(--accent-color)');

    // Header with dot and name
    const header = document.createElement('div');
    header.className = 'collection-header';

    const dot = document.createElement('span');
    dot.className = 'collection-dot';

    const name = document.createElement('h3');
    name.className = 'collection-name';
    name.textContent = collection.name;

    header.appendChild(dot);
    header.appendChild(name);

    // Dates
    const dates = document.createElement('div');
    dates.className = 'collection-dates';
    dates.textContent = formatDateRange(collection.startDate, collection.endDate);

    // Description
    const description = document.createElement('p');
    description.className = 'collection-description';
    description.textContent = collection.description || '';

    // Arrow
    const arrow = document.createElement('span');
    arrow.className = 'collection-arrow';
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');

    card.appendChild(header);
    card.appendChild(dates);
    if (collection.description) {
        card.appendChild(description);
    }
    card.appendChild(arrow);

    return card;
}

/**
 * Format date range for display
 */
function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '';

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
        if (startMonth === endMonth) {
            return `${startMonth} ${startYear}`;
        }
        return `${startMonth} - ${endMonth} ${startYear}`;
    }

    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Show/hide loading state
 */
function showLoading(show) {
    loadingState.hidden = !show;
    if (show) {
        collectionsList.hidden = true;
        emptyState.hidden = true;
    }
}
