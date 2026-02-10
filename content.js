// NMT Interface Enhancer Content Script

console.log("NMT Interface Enhancer Loaded");

// --- UTILS ---

function triggerChange(element) {
  const event = new Event('change', { bubbles: true });
  element.dispatchEvent(event);
}


function injectStyles() {
  const link = document.createElement('link');
  link.href = chrome.runtime.getURL('styles.css');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  console.log('NMT Extension: Styles injected');
}

// --- FEATURES ---

function addBackground() {
  const bg = document.createElement('div');
  bg.id = 'nmt-bg-overlay';

  // Curated list of high-quality bird images from Unsplash
  // Curated list of high-quality bird images from Unsplash
  const birdImages = [
    "https://images.unsplash.com/photo-kdgMXLF52_k?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Northern Cardinal
    "https://images.unsplash.com/photo-oqYHtXrLXLo?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Owl
    "https://images.unsplash.com/photo-K_RlYhnKoh8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Hummingbird
    "https://images.unsplash.com/photo-q_bx5FSjSqc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Blue Jay
    "https://images.unsplash.com/photo-vUNQaTtZeOo?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Kingfisher
    "https://images.unsplash.com/photo-_WG7sZN7Wbk?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Robin
    "https://images.unsplash.com/photo-h9ELZGXz4_Y?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Sparrow
    "https://images.unsplash.com/photo-_ILykIaWpI4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Eagle
    "https://images.unsplash.com/photo-CCBY51J5XBA?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Parrot
    "https://images.unsplash.com/photo-RO7JbbItqoY?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"  // Swan
  ];

  // Get Report ID to use as seed
  const reportId = window.location.pathname.split('/').pop(); // "132280"
  let index = 0;

  if (reportId && !isNaN(parseInt(reportId))) {
    index = parseInt(reportId) % birdImages.length;
  }

  const selectedImage = birdImages[index];
  console.log(`NMT Extension: Selected bird image index ${index} for Report ${reportId}`);

  bg.style.backgroundImage = `url("${selectedImage}")`;
  document.body.appendChild(bg);
}

// --- PROGRESS TRACKING ---

function updateProgress() {
  // 1. Identify Current Part (A, B, C, D)
  // We check the URL or page content. URL is /Reports/Edit/... 
  // The active tab might be inferred from the "active" class on tabs or hidden inputs.
  // For now, let's look for the visible header text like "Part A", "Part B".

  let currentPart = null;
  const h2s = Array.from(document.querySelectorAll('h2, h3'));
  const partHeader = h2s.find(h => h.innerText.includes('Part '));
  if (partHeader) {
    const match = partHeader.innerText.match(/Part ([A-D])/);
    if (match) currentPart = `Part ${match[1]}`;
  }

  // 2. Calculate Progress
  const selects = document.querySelectorAll('select');
  const total = selects.length;
  let answered = 0;
  selects.forEach(s => {
    if (s.value && s.value !== "") answered++;
  });

  const percentage = total === 0 ? 0 : Math.round((answered / total) * 100);

  // 3. Update Bottom Bar
  let progressBar = document.getElementById('nmt-progress-bar');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'nmt-progress-bar';
    progressBar.innerHTML = `<div id="nmt-progress-fill"></div><span id="nmt-progress-text">0%</span>`;
    document.body.appendChild(progressBar);
  }
  document.getElementById('nmt-progress-fill').style.width = `${percentage}%`;
  document.getElementById('nmt-progress-text').innerText = `${answered} / ${total} (${percentage}%)`;

  // 4. Update Current Part in Storage & Nav Loop
  const reportId = window.location.pathname.split('/').pop(); // Extract "132280" from url
  if (currentPart && reportId) {
    localStorage.setItem(`nmt_progress_${reportId}_${currentPart}`, percentage);
    updateNavButtons(); // Refresh visuals
  }

  // 5. Highlight Active Section
  if (currentPart) {
    // Remove active class from all
    const allBtns = document.querySelectorAll('#nmt-nav-container button');
    allBtns.forEach(b => b.classList.remove('active-nav-btn'));

    // Add to current
    // currentPart is "Part A", id is "nmt-nav-Part-A"
    const activeId = `nmt-nav-${currentPart.replace(' ', '-')}`;
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) {
      activeBtn.classList.add('active-nav-btn');
    }
  }
}

function updateNavButtons() {
  const startParts = ['Part A', 'Part B', 'Part C', 'Part D'];
  const navContainer = document.getElementById('nmt-nav-container');
  if (!navContainer) return;

  const reportId = window.location.pathname.split('/').pop(); // "132280"

  const buttons = navContainer.querySelectorAll('button');
  buttons.forEach(btn => {
    const partName = btn.dataset.partName; // "Part A"
    const storedPct = parseInt(localStorage.getItem(`nmt_progress_${reportId}_${partName}`) || '0');

    // Visual Logic: "Fill up"
    // We use a linear-gradient background.
    // If 100%, maybe turn green or gold.

    if (storedPct >= 100) {
      btn.style.background = '#27ae60'; // Green
      btn.style.color = 'white';
    } else {
      // Gradient: Bottom-up fill
      // light-gray top, filled color bottom
      // linear-gradient(to top, #3498db 0%, #3498db 50%, #bdc3c7 50%, #bdc3c7 100%)
      btn.style.background = `linear-gradient(to top, #3498db ${storedPct}%, #bdc3c7 ${storedPct}%)`;
      btn.style.color = storedPct > 50 ? 'white' : '#2c3e50';
    }

    // Optional: show % on hover title
    btn.title = `${partName}: ${storedPct}% Complete`;
  });
}


function addNavigation() {
  const parts = ['Part A', 'Part B', 'Part C', 'Part D'];

  let navContainer = document.getElementById('nmt-nav-container');
  if (!navContainer) {
    navContainer = document.createElement('div');
    navContainer.id = 'nmt-nav-container';
    document.body.appendChild(navContainer);
  } else {
    navContainer.innerHTML = ''; // Request redraw
  }

  parts.forEach(partName => {
    const btn = document.createElement('button');
    btn.innerText = partName.split(' ')[1]; // "A"
    btn.dataset.partName = partName;
    btn.id = `nmt-nav-${partName.replace(' ', '-')}`; // nmt-nav-Part-A

    btn.addEventListener('click', (e) => {
      const realBtn = document.querySelector(`button[name="section"][value="${partName}"]`) ||
        document.querySelector(`input[name="section"][value="${partName}"]`);
      if (realBtn) realBtn.click();
      else alert(`Could not find button for ${partName}.`);
    });

    navContainer.appendChild(btn);
  });

  updateNavButtons(); // Initial render from storage
}

// --- DROPDOWNS ---

function enhanceDropdowns() {
  const selects = document.querySelectorAll('select');

  selects.forEach(select => {
    if (select.dataset.nmtEnhanced) return;

    const options = Array.from(select.options);
    const values = options.map(o => o.value).filter(v => v);
    const texts = options.map(o => o.text).filter(t => t);

    const isNumeric = values.every(v => !isNaN(parseInt(v)));
    const maxVal = isNumeric ? Math.max(...values.map(v => parseInt(v))) : 0;

    // Two-way sync handler
    const syncHandler = () => {
      updateProgress(); // Re-calculate progress on any change
    };
    select.addEventListener('change', syncHandler);

    if (isNumeric && maxVal > 5) {
      enhanceAsSlider(select, values);
    } else if (texts.includes('High') && texts.includes('Low')) {
      enhanceAsButtons(select, options);
    }

    select.dataset.nmtEnhanced = "true";
  });

  // Initial progress calc
  updateProgress();
}

function enhanceAsSlider(select, values) {
  // Keep original visible? User said "overlay but not remove content". 
  // Maybe make it smaller or just sit there.
  // We'll put the slider *below* the select.

  const container = document.createElement('div');
  container.className = 'nmt-slider-wrapper';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = Math.min(...values.map(v => parseInt(v)));
  slider.max = Math.max(...values.map(v => parseInt(v)));
  slider.value = select.value || slider.min;
  slider.className = 'nmt-slider';

  const display = document.createElement('span');
  display.className = 'nmt-slider-value';
  display.innerText = select.value || '?';

  // TWO-WAY BINDING

  // 1. Slider -> Select
  // On Drag (Input): Update value visually ONLY. 
  // Do NOT touch the select element to avoid triggering site overhead.
  slider.addEventListener('input', () => {
    display.innerText = slider.value;
  });

  // On Drop (Change): Trigger the site's logic
  slider.addEventListener('change', () => {
    select.value = slider.value; // Ensure sync
    triggerChange(select); // Triggers site logic + our progress update
  });

  // 2. Select -> Slider
  select.addEventListener('change', () => {
    if (select.value) {
      slider.value = select.value;
      display.innerText = select.value;
    }
  });

  container.appendChild(slider);
  container.appendChild(display);

  select.parentNode.insertBefore(container, select.nextSibling);

  // Initial Set
  if (select.value) {
    slider.value = select.value;
    display.innerText = select.value;
  }
}

function enhanceAsButtons(select, options) {
  // Keep original visible

  const container = document.createElement('div');
  container.className = 'nmt-btn-group';

  const buttons = [];

  options.forEach(opt => {
    if (!opt.value) return;

    const btn = document.createElement('button');
    btn.innerText = opt.text;
    btn.type = 'button';
    btn.className = 'nmt-option-btn';
    if (select.value === opt.value) btn.classList.add('selected');

    // 1. Button -> Select
    btn.addEventListener('click', () => {
      // UI Update
      buttons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Logic Update
      select.value = opt.value;
      triggerChange(select);
    });

    buttons.push(btn);
    container.appendChild(btn);
  });

  // 2. Select -> Button
  select.addEventListener('change', () => {
    buttons.forEach(btn => {
      if (btn.innerText === select.options[select.selectedIndex].text) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  });

  select.parentNode.insertBefore(container, select.nextSibling);
}

// Initialize
// Initialize
function initExtension() {
  if (document.getElementById('nmt-nav-container')) return; // Already running?

  injectStyles();
  addBackground();
  addNavigation();
  enhanceDropdowns();
  highlightErrors();

  // Watch for dynamic changes (ASP.NET partials, etc.)
  const observer = new MutationObserver((mutations) => {
    let shouldUpdateErrors = false;
    let shouldEnhanceDropdowns = false;
    let shouldRestoreUI = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // If our UI elements were removed, put them back
        const removedIds = Array.from(mutation.removedNodes).map(n => n.id);
        if (removedIds.includes('nmt-nav-container') || removedIds.includes('nmt-bg-overlay')) {
          shouldRestoreUI = true;
        }

        // If new content added, check for errors/dropdowns
        if (mutation.addedNodes.length > 0) {
          shouldUpdateErrors = true;
          shouldEnhanceDropdowns = true;
        }
      }
    });

    if (shouldRestoreUI) {
      if (!document.getElementById('nmt-nav-container')) addNavigation();
      if (!document.getElementById('nmt-bg-overlay')) addBackground();
      updateProgress(); // Restore active halo
    }

    if (shouldUpdateErrors) highlightErrors();
    if (shouldEnhanceDropdowns) enhanceDropdowns();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtension);
} else {
  initExtension();
}

function highlightErrors() {
  // Find all rows with the specific red background color
  // The site uses bgcolor="#FFCFCF"
  const redRows = document.querySelectorAll('tr[bgcolor="#FFCFCF"], tr[bgcolor="#ffcfcf"]');
  redRows.forEach(tr => {
    tr.classList.add('nmt-error-row');
  });

  // Also listen for changes (if validation happens dynamically via AJAX/JS)
  // Simple polling or mutation observer could work, but let's try just running it once first.
  // If they submit and page reloads, this runs again.
}
