// NMT Interface Enhancer Content Script

console.log("NMT Interface Enhancer Loaded");

// --- UTILS ---

function triggerChange(element) {
  const event = new Event('change', { bubbles: true });
  element.dispatchEvent(event);
}

// --- FEATURES ---

function addBackground() {
  const bg = document.createElement('div');
  bg.id = 'nmt-bg-overlay';

  // Curated list of high-quality bird images from Unsplash
  const birdImages = [
    "https://images.unsplash.com/photo-1444464666168-49d633b86797?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Original
    "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Blue Jay
    "https://images.unsplash.com/photo-1480044965905-02098d419e96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Small bird on branch
    "https://images.unsplash.com/photo-1552728089-57bdde30ebd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Cardinal
    "https://images.unsplash.com/photo-1549608276-5786777e6587?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Yellow bird
    "https://images.unsplash.com/photo-1555169062-013468b47731?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Colorful parrot
    "https://images.unsplash.com/photo-1456885284447-7dd4bb8720bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Owl
    "https://images.unsplash.com/photo-1516233758813-a38d024919c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Swan
    "https://images.unsplash.com/photo-1522926193341-e9e6d9b8600d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", // Hummingbird
    "https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"  // Kingfisher
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
  slider.addEventListener('input', () => {
    display.innerText = slider.value;
    select.value = slider.value;
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addBackground();
    addNavigation();
    enhanceDropdowns();
  });
} else {
  // Sometimes DOM is ready but elements are inserted by JS. 
  // Small timeout helps, or just running it.
  addBackground();
  addNavigation();
  enhanceDropdowns();
}
