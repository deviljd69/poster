// ===== DOM references =====
const body = document.body;
const darkModeToggle = document.getElementById('darkModeToggle');
const uploadArea = document.getElementById('uploadArea');
const browseBtn = document.getElementById('browseBtn');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const notification = document.getElementById('notification');

const ratioButtons = document.querySelectorAll('.ratio-btn');
const generateBtn = document.getElementById('generateBtn');
const postersGrid = document.getElementById('postersGrid');

const refImageBtn = document.getElementById('refImageBtn');
const refImageInput = document.getElementById('refImageInput');

const previewModal = document.getElementById('previewModal');
const closeModal = document.getElementById('closeModal');
const fullPreview = document.getElementById('fullPreview');

const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const customConcept = document.getElementById('customConcept');
const conceptBox = document.getElementById('conceptBox');

const refineToggle = document.getElementById('refineToggle');
const resolutionSelect = document.getElementById('resolutionSelect');

// ===== State =====
let uploadedImage = null; // data URL for preview
let selectedRatio = '9:16';
let posters = [];

// ===== Helpers =====
function showNotification(message) {
  if (!notification) return;
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 2500);
}

function ratioToPixels(ratio, longSide) {
  const long = longSide ? parseInt(longSide, 10) : null;
  switch (ratio) {
    case '9:16':
      return long ? { width: Math.round((9/16)*long), height: long } : { width: 768, height: 1365 };
    case '16:9':
      return long ? { width: long, height: Math.round((9/16)*long) } : { width: 1365, height: 768 };
    case '1:1':
      return long ? { width: long, height: long } : { width: 1024, height: 1024 };
    case '3:4':
      return long ? { width: Math.round((3/4)*long), height: long } : { width: 900, height: 1200 };
    case '4:3':
      return long ? { width: long, height: Math.round((3/4)*long) } : { width: 1200, height: 900 };
    default:
      return { width: 1024, height: 1024 };
  }
}

function buildBasePrompt(concept, ratio, width, height) {
  return `
You are an image prompt designer for cinematic product posters. Create a single, stunning, photorealistic poster that:
- Preserves the product's original lighting, texture, and color fidelity.
- Matches this aspect ratio: ${ratio} (target ~${width}x${height}).
- Emphasizes premium, cinematic mood with depth, soft volumetric lighting, subtle film grain.
- Composition: rule of thirds, clear focal subject, tasteful negative space.
- Background: cohesive to concept, no watermarks, no text, no logos.

Concept:
${concept}

Output: A single image only.`.trim();
}

async function refinePromptIfEnabled(prompt) {
  if (!refineToggle || !refineToggle.checked) return prompt;
  const res = await fetch('/api/refine-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error(await res.text());
  const { refined } = await res.json();
  return `${refined}\n\nNo text, no watermarks, no logos.`;
}

async function generateImage(prompt, width, height) {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width, height })
  });
  if (!res.ok) throw new Error(await res.text());
  const { base64 } = await res.json();
  return `data:image/png;base64,${base64}`;
}

function renderPosters() {
  postersGrid.innerHTML = '';
  posters.forEach(poster => {
    const el = document.createElement('div');
    el.className = 'poster-item';
    el.innerHTML = `
      <div class="poster-thumb" style="background-image: url('${poster.image}')">
        <i class="fas fa-camera" style="display:none;"></i>
      </div>
      <div class="poster-actions">
        <div class="action-btn download-btn" data-id="${poster.id}">
          <i class="fas fa-download"></i>
        </div>
        <div class="action-btn delete-btn" data-id="${poster.id}">
          <i class="fas fa-trash"></i>
        </div>
      </div>
      <button class="refine-btn" data-id="${poster.id}">
        <i class="fas fa-edit"></i> Refine Poster
      </button>
    `;
    postersGrid.appendChild(el);

    const thumb = el.querySelector('.poster-thumb');
    const downloadBtn = el.querySelector('.download-btn');
    const deleteBtn = el.querySelector('.delete-btn');

    thumb.addEventListener('click', () => {
      fullPreview.src = poster.image;
      previewModal.style.display = 'flex';
    });
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const link = document.createElement('a');
      link.href = poster.image;
      link.download = `poster-${poster.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Poster downloaded!');
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      posters = posters.filter(p => p.id !== poster.id);
      renderPosters();
      showNotification('Poster deleted');
    });
  });
}

// ===== Event bindings after DOM ready =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize concept display
  if (customConcept && conceptBox) {
    const updateConcept = () => {
      if (customConcept.value.trim()) {
        conceptBox.textContent = customConcept.value.trim();
      } else {
        conceptBox.textContent =
`"Imagine a sleek smartwatch glowing under stormy skies atop a futuristic cityscape at night. 
Rain reflects its luminous interface, symbolizing human resilience against chaos. 
The scene evokes a cyberpunk thriller where time is power—each second counts."`;
      }
    };
    updateConcept();
    customConcept.addEventListener('input', updateConcept);
  }

  // Dark mode toggle + persisted preference
  if (darkModeToggle) {
    // Apply saved on load
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      body.classList.add('dark');
      const icon = darkModeToggle.querySelector('i');
      if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    }
    darkModeToggle.addEventListener('click', () => {
      body.classList.toggle('dark');
      const icon = darkModeToggle.querySelector('i');
      if (icon) {
        if (body.classList.contains('dark')) {
          icon.classList.remove('fa-moon'); icon.classList.add('fa-sun');
        } else {
          icon.classList.remove('fa-sun'); icon.classList.add('fa-moon');
        }
      }
      localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  // Ratio selection
  ratioButtons.forEach(button => {
    button.addEventListener('click', () => {
      ratioButtons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      selectedRatio = button.dataset.ratio;
      showNotification(`Aspect ratio set to ${selectedRatio}`);
    });
  });

  // Upload: browse
  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    });
  }

  // Upload: drag & drop
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#4f46e5';
      uploadArea.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
      uploadArea.style.backgroundColor = '';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      uploadArea.style.backgroundColor = '';
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFileUpload(file);
    });
  }

  // Reference image uploaded
  if (refImageBtn && refImageInput) {
    refImageBtn.addEventListener('click', () => refImageInput.click());
    refImageInput.addEventListener('change', (e) => {
      if (e.target.files?.length) showNotification('Reference image uploaded');
    });
  }

  // Modal close
  if (closeModal && previewModal) {
    closeModal.addEventListener('click', () => previewModal.style.display = 'none');
    window.addEventListener('click', (e) => {
      if (e.target === previewModal) previewModal.style.display = 'none';
    });
  }

  // History
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', () => {
      showNotification(`Viewing ${posters.length} generated posters`);
    });
  }

  // Generate poster
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      if (!uploadedImage) {
        showNotification('Please upload a product image first');
        return;
      }
      const concept = (customConcept?.value || conceptBox?.textContent || '').trim();
      const longSide = resolutionSelect?.value === 'auto' ? null : resolutionSelect?.value;
      const { width, height } = ratioToPixels(selectedRatio, longSide);

      const basePrompt = buildBasePrompt(concept, selectedRatio, width, height);

      generateBtn.disabled = true;
      generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

      try {
        const refined = await refinePromptIfEnabled(basePrompt);
        const imgDataUrl = await generateImage(refined, width, height);

        const poster = {
          id: Date.now(),
          image: imgDataUrl,
          concept,
          ratio: selectedRatio,
          timestamp: new Date().toLocaleString()
        };
        posters.push(poster);
        renderPosters();
        showNotification('Cinematic poster generated!');
      } catch (err) {
        console.error(err);
        showNotification(err.message || 'Generation failed');
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate Poster';
      }
    });
  }
});

// ===== Upload Handler =====
function handleFileUpload(file) {
  if (!file.type.match(/^image\//)) {
    showNotification('Please upload an image file (JPG, PNG, WEBP)');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showNotification('File size exceeds 5MB limit');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImage = e.target.result; // data URL
    if (imagePreview) {
      imagePreview.src = uploadedImage;
      imagePreview.style.display = 'block';
    }
    showNotification('Product image uploaded successfully!');
  };
  reader.onerror = () => showNotification('Failed to read file');
  reader.readAsDataURL(file);
}