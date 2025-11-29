// ===== DAILY READING PAGE JAVASCRIPT =====
// Settings, verse selection, modals, and copy functionality

// ===== SETTINGS MENU =====
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
const verseCard = document.getElementById('verseCard');
const audioSection = document.getElementById('audioSection');
const bibleContent = document.getElementById('bibleContent');
const footnotesSection = document.getElementById('footnotesSection');

// Toggle settings menu
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('active');
});

// Close settings menu when clicking outside
document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsMenu.classList.remove('active');
    }
});

// Settings toggles
document.getElementById('toggleImage').addEventListener('change', (e) => {
    verseCard.classList.toggle('hidden', !e.target.checked);
    savePreference('showImage', e.target.checked);
});

document.getElementById('toggleAudio').addEventListener('change', (e) => {
    audioSection.classList.toggle('hidden', !e.target.checked);
    savePreference('showAudio', e.target.checked);
});

document.getElementById('toggleFootnotes').addEventListener('change', (e) => {
    if (!e.target.checked) {
        bibleContent.classList.add('hide-footnotes');
        footnotesSection.classList.add('hidden');
    } else {
        bibleContent.classList.remove('hide-footnotes');
        footnotesSection.classList.remove('hidden');
    }
    savePreference('showFootnotes', e.target.checked);
});

document.getElementById('toggleCrossrefs').addEventListener('change', (e) => {
    bibleContent.classList.toggle('hide-crossrefs', !e.target.checked);
    savePreference('showCrossrefs', e.target.checked);
});

// ===== VERSE CARD COPY FUNCTIONALITY =====
// The verse card image already has text baked in by Pillow - just copy the image directly
// Note: Clipboard API requires PNG format, so we convert WebP to PNG via canvas
const verseCardCopyBtn = document.getElementById('verseCardCopyBtn');
if (verseCardCopyBtn) {
    verseCardCopyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        const verseCardImage = document.querySelector('.verse-card-image');
        if (!verseCardImage) return;

        try {
            // Create a canvas to convert image to PNG (required by Clipboard API)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Create a new image to ensure it's loaded
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

            // Convert to PNG blob (required format for clipboard)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            // Show success feedback
            verseCardCopyBtn.textContent = '\u2713';
            verseCardCopyBtn.classList.add('copied');

            setTimeout(() => {
                verseCardCopyBtn.textContent = '\uD83D\uDCCB';
                verseCardCopyBtn.classList.remove('copied');
            }, 2000);

        } catch (err) {
            console.log('Copy failed:', err);
            // Fallback: open image in new tab for manual save
            window.open(verseCardImage.src, '_blank');
        }
    });
}

// ===== MODAL POPUP FOR FOOTNOTES/CROSSREFS =====
const modalOverlay = document.getElementById('modalOverlay');
const modalPopup = document.getElementById('modalPopup');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

// Handle footnote clicks
document.querySelectorAll('.fn').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const footnoteText = link.getAttribute('data-footnote');
        const verseRef = link.closest('p').querySelector('.verse-num').textContent.trim();

        showModal('Footnote', `<span class="verse-ref">Verse ${verseRef}</span><p>${footnoteText}</p>`, 'footnote', e);
    });
});

// Handle crossref clicks
document.querySelectorAll('.cr').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const crossrefText = link.getAttribute('data-crossref') || 'John 1:1-3';

        showModal('Cross Reference', `
            <span class="verse-ref">${crossrefText}</span>
            <p>In the beginning was the Word, and the Word was with God, and the Word was God.</p>
            <a href="https://www.esv.org/${crossrefText.replace(/\s+/g, '+')}" target="_blank" class="esv-link">
                View on ESV.org \u2192
            </a>
        `, 'crossref', e);
    });
});

function showModal(title, content, type, event) {
    modalTitle.textContent = title;
    modalTitle.className = `modal-title ${type}`;
    modalContent.innerHTML = content;

    // Position modal ABOVE the click location (not below)
    const rect = event.target.getBoundingClientRect();
    modalPopup.style.bottom = `${window.innerHeight - rect.top - window.scrollY + 10}px`;
    modalPopup.style.top = 'auto';
    modalPopup.style.left = `${Math.max(20, rect.left + window.scrollX - 100)}px`;

    modalOverlay.classList.add('active');
    modalPopup.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
    modalPopup.classList.remove('active');
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// ESC key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeSidePanel();
    }
});

// ===== SIDE PANEL FOR COMMENTARY/DEVOTIONAL =====
const sidePanelOverlay = document.getElementById('sidePanelOverlay');
const sidePanel = document.getElementById('sidePanel');
const sidePanelHeader = document.getElementById('sidePanelHeader');
const sidePanelTitle = document.getElementById('sidePanelTitle');
const sidePanelContent = document.getElementById('sidePanelContent');
const sidePanelClose = document.getElementById('sidePanelClose');

document.getElementById('commentaryBtn').addEventListener('click', () => {
    // Reset scroll position BEFORE opening
    sidePanel.scrollTop = 0;

    sidePanelTitle.textContent = 'Commentary on Genesis 1:1-13';
    sidePanelHeader.classList.remove('devotional');
    sidePanelContent.innerHTML = `
        <h3>The Beginning of Creation</h3>
        <p>The opening words of Genesis establish the foundation of all biblical theology: "In the beginning, God created." This simple yet profound statement declares God's sovereignty, power, and intentionality in creation.</p>

        <h3>God's Creative Method</h3>
        <p>Throughout these verses, we see a pattern: God speaks, and it comes into being. This demonstrates the power of God's word and sets a precedent for understanding how God continues to work in the world.</p>

        <h3>The Progressive Revelation</h3>
        <p>Days 1-3 show God creating and separating: light from darkness, waters above from waters below, and sea from dry land. Each act of creation builds upon the previous, showing God's ordered and purposeful design.</p>

        <p><i>Commentary content would continue here, pulled from external sources...</i></p>
    `;
    openSidePanel();

    // Scroll to top anchor within this page
    document.getElementById('scroll-top-anchor').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('devotionalBtn').addEventListener('click', () => {
    // Reset scroll position BEFORE opening
    sidePanel.scrollTop = 0;

    sidePanelTitle.textContent = 'Daily Devotional';
    sidePanelHeader.classList.add('devotional');
    sidePanelContent.innerHTML = `
        <h3>Created with Purpose</h3>
        <p>As we read about God creating the world, we're reminded that nothing in creation is random or purposeless. God spoke everything into existence with intentionality and love.</p>

        <h3>Reflection</h3>
        <p>Just as God brought order out of chaos in creation, He desires to bring order to the chaos in our lives. Where do you see disorder today? Where do you need God's creative power to speak light into your darkness?</p>

        <h3>Prayer</h3>
        <p>Lord, help me to remember that You are the Creator of all things, including me. Just as You spoke light into the darkness at creation, speak into my life today. Bring order where there is chaos, and help me to rest in Your purposeful design. Amen.</p>

        <p><i>Devotional content would continue here, pulled from external sources...</i></p>
    `;
    openSidePanel();

    // Scroll to top anchor within this page
    document.getElementById('scroll-top-anchor').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function openSidePanel() {
    sidePanelOverlay.classList.add('active');
    setTimeout(() => sidePanel.classList.add('active'), 10);
}

function closeSidePanel() {
    sidePanel.classList.remove('active');
    setTimeout(() => sidePanelOverlay.classList.remove('active'), 300);
}

sidePanelClose.addEventListener('click', closeSidePanel);
sidePanelOverlay.addEventListener('click', closeSidePanel);

// ===== PREFERENCES (LocalStorage) =====
function savePreference(key, value) {
    localStorage.setItem(`sjlc_${key}`, JSON.stringify(value));
}

function loadPreferences() {
    const prefs = {
        showImage: JSON.parse(localStorage.getItem('sjlc_showImage') ?? 'true'),
        showAudio: JSON.parse(localStorage.getItem('sjlc_showAudio') ?? 'true'),
        showFootnotes: JSON.parse(localStorage.getItem('sjlc_showFootnotes') ?? 'true'),
        showCrossrefs: JSON.parse(localStorage.getItem('sjlc_showCrossrefs') ?? 'true')
    };

    // Apply preferences
    document.getElementById('toggleImage').checked = prefs.showImage;
    document.getElementById('toggleAudio').checked = prefs.showAudio;
    document.getElementById('toggleFootnotes').checked = prefs.showFootnotes;
    document.getElementById('toggleCrossrefs').checked = prefs.showCrossrefs;

    verseCard.classList.toggle('hidden', !prefs.showImage);
    audioSection.classList.toggle('hidden', !prefs.showAudio);

    if (!prefs.showFootnotes) {
        bibleContent.classList.add('hide-footnotes');
        footnotesSection.classList.add('hidden');
    }

    if (!prefs.showCrossrefs) {
        bibleContent.classList.add('hide-crossrefs');
    }
}

// Load preferences on page load
loadPreferences();

// ===== VERSE SELECTION SYSTEM =====
class VerseSelector {
    constructor() {
        this.selectedVerses = new Map(); // verse ID -> {book, chapter, verse, text, element}
        this.bibleContentEl = document.getElementById('bibleContent');
        this.copyFab = document.getElementById('copyFab');
        this.copyBtn = document.getElementById('copyVerseBtn');
        this.clearBtn = document.getElementById('clearSelectionBtn');
        this.verseCountBadge = document.getElementById('verseCountBadge');
        this.toast = document.getElementById('verseToast');

        if (this.bibleContentEl) {
            this.init();
        }
    }

    init() {
        this.wrapVerses();
        this.attachEventListeners();
    }

    // Parse and wrap each verse in a span for selection
    wrapVerses() {
        const paragraphs = this.bibleContentEl.querySelectorAll('p[id^="p"]');

        paragraphs.forEach(p => {
            const verseNums = Array.from(p.querySelectorAll('.verse-num, .chapter-num'));

            verseNums.forEach((verseNum, index) => {
                const verseId = verseNum.id; // e.g., v01001014-1
                if (!verseId) return;

                // Parse verse info from ID (format: v[book][chapter][verse]-1)
                const match = verseId.match(/v(\d{2})(\d{3})(\d{3})-/);
                if (!match) return;

                const [, bookNum, chapterNum, verseNumParsed] = match;
                const book = this.getBookName(parseInt(bookNum));
                const chapter = parseInt(chapterNum);
                const verse = parseInt(verseNumParsed);

                // Find the text between this verse number and the next
                const nextVerseNum = verseNums[index + 1];
                const nodesToWrap = [];
                let currentNode = verseNum.nextSibling;

                while (currentNode && currentNode !== nextVerseNum) {
                    if (currentNode.nodeType === Node.TEXT_NODE && currentNode.textContent.trim()) {
                        nodesToWrap.push(currentNode);
                    } else if (currentNode.nodeType === Node.ELEMENT_NODE &&
                              !currentNode.classList.contains('verse-num') &&
                              !currentNode.classList.contains('chapter-num')) {
                        // Include elements but track footnotes separately
                        nodesToWrap.push(currentNode);
                    }
                    currentNode = currentNode.nextSibling;
                }

                // Create wrapper span
                if (nodesToWrap.length > 0) {
                    const wrapper = document.createElement('span');
                    wrapper.className = 'verse-wrapper';
                    wrapper.dataset.verseId = verseId;
                    wrapper.dataset.book = book;
                    wrapper.dataset.chapter = chapter;
                    wrapper.dataset.verse = verse;

                    // Insert wrapper after verse number
                    verseNum.parentNode.insertBefore(wrapper, verseNum.nextSibling);

                    // Move nodes into wrapper
                    nodesToWrap.forEach(node => {
                        wrapper.appendChild(node);
                    });
                }
            });
        });
    }

    // Attach event listeners
    attachEventListeners() {
        // Verse click selection
        this.bibleContentEl.addEventListener('click', (e) => {
            const verseWrapper = e.target.closest('.verse-wrapper');
            if (verseWrapper && !e.target.closest('.footnote') && !e.target.closest('.crossref')) {
                this.toggleVerseSelection(verseWrapper);
            }
        });

        // Copy button
        this.copyBtn.addEventListener('click', () => {
            this.copySelectedVerses();
        });

        // Clear button
        this.clearBtn.addEventListener('click', () => {
            this.clearSelection();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+C to copy selected verses
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && this.selectedVerses.size > 0) {
                e.preventDefault();
                this.copySelectedVerses();
            }
            // ESC key to clear selections
            if (e.key === 'Escape' && this.selectedVerses.size > 0) {
                this.clearSelection();
            }
        });

        // Click outside to clear (but not when clicking modals/overlays)
        document.addEventListener('click', (e) => {
            // Don't clear if clicking on modal overlay, modal popup, or their children
            const isModalClick = e.target.closest('.modal-overlay') ||
                                e.target.closest('.modal-popup') ||
                                e.target.closest('.side-panel-overlay') ||
                                e.target.closest('.side-panel');

            if (!isModalClick &&
                !this.bibleContentEl.contains(e.target) &&
                !this.copyFab.contains(e.target) &&
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
                    // Vibrate if supported
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }, 500);
            }
        });

        this.bibleContentEl.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });

        this.bibleContentEl.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
    }

    // Toggle verse selection
    toggleVerseSelection(verseWrapper) {
        const verseId = verseWrapper.dataset.verseId;

        if (this.selectedVerses.has(verseId)) {
            // Deselect
            this.selectedVerses.delete(verseId);
            verseWrapper.classList.remove('selected');
        } else {
            // Select
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

    // Clean text (remove footnotes, verse numbers, extra spaces)
    cleanText(verseWrapper) {
        const clone = verseWrapper.cloneNode(true);

        // Remove footnote and crossref elements
        clone.querySelectorAll('.footnote, .crossref').forEach(el => el.remove());

        // Get text content and clean it up
        return clone.textContent
            .replace(/\[\d+\]/g, '')  // Remove any remaining footnote markers
            .replace(/\(\w+\)/g, '')  // Remove cross-reference markers
            .replace(/\s+/g, ' ')     // Normalize spaces
            .trim();
    }

    // Update FAB visibility and count
    updateFab() {
        const count = this.selectedVerses.size;
        const copyBtn = document.getElementById('copyVerseBtn');
        const clearBtn = document.getElementById('clearSelectionBtn');

        if (count > 0) {
            this.copyFab.classList.add('visible');
            this.verseCountBadge.textContent = count;
            // Reset button state when showing FAB
            copyBtn.disabled = false;
            copyBtn.innerHTML = '\uD83D\uDCCB<span class="verse-count-badge" id="verseCountBadge">' + count + '</span>';
            clearBtn.style.display = 'flex'; // Show X button
        } else {
            this.copyFab.classList.remove('visible');
        }
    }

    // Copy selected verses to clipboard
    async copySelectedVerses() {
        if (this.selectedVerses.size === 0) return;

        const formattedText = this.formatSelectedVerses();
        const copyBtn = document.getElementById('copyVerseBtn');
        const clearBtn = document.getElementById('clearSelectionBtn');

        // Disable button to prevent double-clicks
        copyBtn.disabled = true;

        // Hide X button and change icon to checkmark (no badge)
        clearBtn.style.display = 'none';
        copyBtn.innerHTML = '\u2713';

        try {
            await navigator.clipboard.writeText(formattedText);
            this.showToast('Verses copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            this.fallbackCopy(formattedText);
            return; // fallbackCopy handles the rest
        }

        // Wait 1.5 seconds, then clear selection
        setTimeout(() => {
            this.clearSelection();
        }, 1500);
    }

    // Format selected verses with references
    formatSelectedVerses() {
        const verses = Array.from(this.selectedVerses.values())
            .sort((a, b) => {
                if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                return a.verse - b.verse;
            });

        if (verses.length === 0) return '';

        const book = verses[0].book;
        const chapter = verses[0].chapter;

        // Build reference
        let reference = `${book} ${chapter}:`;
        const verseNumbers = verses.map(v => v.verse);

        // Check if consecutive
        const isConsecutive = verseNumbers.every((num, idx) =>
            idx === 0 || num === verseNumbers[idx - 1] + 1
        );

        if (isConsecutive && verseNumbers.length > 1) {
            reference += `${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`;
        } else {
            reference += verseNumbers.join(', ');
        }

        // Build text
        const text = verses.map(v => v.text).join(' ');

        return `${reference} - ${text}`;
    }

    // Fallback copy method
    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        const copyBtn = document.getElementById('copyVerseBtn');
        const clearBtn = document.getElementById('clearSelectionBtn');
        copyBtn.disabled = true;

        // Hide X button and change icon to checkmark (no badge)
        clearBtn.style.display = 'none';
        copyBtn.innerHTML = '\u2713';

        try {
            document.execCommand('copy');
            this.showToast('Verses copied to clipboard!');
        } catch (err) {
            this.showToast('Failed to copy verses');
            copyBtn.disabled = false; // Re-enable on failure
            clearBtn.style.display = 'flex'; // Show X button again on failure
            this.updateFab(); // Reset button state
        }

        document.body.removeChild(textarea);

        // Wait 1.5 seconds, then clear selection
        setTimeout(() => {
            this.clearSelection();
        }, 1500);
    }

    // Show toast notification
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    // Clear all selections
    clearSelection() {
        this.selectedVerses.forEach(verse => {
            verse.element.classList.remove('selected');
        });
        this.selectedVerses.clear();
        this.updateFab();
    }

    // Get book name from number
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

// Initialize verse selector when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new VerseSelector();
    });
} else {
    new VerseSelector();
}
