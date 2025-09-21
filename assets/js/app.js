// assets/js/app.js
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Referencias DOM ---
  const mapEl = document.getElementById('map');
  const modal = document.getElementById('viewerModal');
  const viewerContainer = document.getElementById('viewerContainer');
  const closeBtn = document.getElementById('closeBtn');
  const listEl = document.getElementById('panoramaList');

  if (!mapEl || !modal || !viewerContainer || !closeBtn || !listEl) {
    console.error('❌ Faltan elementos esenciales en el DOM.');
    return;
  }

  // --- Controles búsqueda/orden ---
  const controlsEl = document.createElement('div');
  controlsEl.className = 'panorama-controls';
  controlsEl.innerHTML = `
    <input id="searchInput" type="search" placeholder="Buscar título, descripción o fecha..." aria-label="Buscar panorámicas" />
    <select id="sortSelect" aria-label="Ordenar panorámicas">
      <option value="desc">Más recientes</option>
      <option value="asc">Más antiguos</option>
    </select>
  `;
  listEl.parentNode.insertBefore(controlsEl, listEl);

  const searchInput = controlsEl.querySelector('#searchInput');
  const sortSelect = controlsEl.querySelector('#sortSelect');
  const resultsCountEl = document.createElement('p');
  resultsCountEl.className = 'results-count';
  listEl.parentNode.insertBefore(resultsCountEl, listEl);

  // --- Spinner ---
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = `<div class="spinner" aria-hidden="true"></div><p aria-live="polite">Cargando panorámicas...</p>`;
  listEl.parentNode.insertBefore(spinner, listEl);

  // --- Utilidades ---
  const escapeHtml = (s = '') =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );

  const truncate = (s = '', n = 120) =>
    (s.length > n) ? s.slice(0, n).trim() + '…' : s;

  const debounce = (fn, delay = 300) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  // --- Inicializar mapa ---
  const map = L.map(mapEl).setView([37.99, -1.12], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 300);

  // --- Icono personalizado ---
  const cameraIcon = L.divIcon({
    html: `
      <div class="camera-marker" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="11" fill="#6c5ce7" stroke="#5a4bcf" stroke-width="2"/>
          <path d="M9 9L7 7H5C4.45 7 4 7.45 4 8V16C4 16.55 4.45 17 5 17H19C19.55 17 20 16.55 20 16V8C20 7.45 19.55 7 19 7H17L15 9H9Z" fill="white"/>
          <circle cx="12" cy="12.5" r="2.5" fill="#6c5ce7"/>
          <circle cx="12" cy="12.5" r="1" fill="white"/>
        </svg>
      </div>
    `,
    className: 'custom-camera-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  // --- Visor 360 ---
  let viewerInstance = null;

  const openViewer = (panoramaUrl, caption) => {
    if (!(window.PhotoSphereViewer?.Viewer)) {
      alert('Photo Sphere Viewer no disponible. Revisa los scripts incluidos.');
      return;
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    if (viewerInstance) {
      try { viewerInstance.destroy(); } catch (err) { console.warn(err); }
      viewerInstance = null;
    }
    viewerContainer.innerHTML = '';
    viewerContainer.style.minHeight = '400px';

    try {
      viewerInstance = new PhotoSphereViewer.Viewer({
        container: viewerContainer,
        panorama: panoramaUrl,
        caption: caption || '',
        navbar: ['autorotate', 'zoom', 'fullscreen']
      });

      viewerInstance.on('ready', () => {
        console.log('✅ PSV listo:', panoramaUrl);
      });

      viewerInstance.on('panorama-error', (e) => {
        console.error('❌ Error cargando panorama:', e);
        alert('No se pudo cargar la imagen 360º.');
        closeViewer();
      });
    } catch (err) {
      console.error('❌ Error inicializando PhotoSphereViewer:', err);
      closeViewer();
    }
  };

  const closeViewer = () => {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    if (viewerInstance) {
      try { viewerInstance.destroy(); } catch (err) { console.warn(err); }
      viewerInstance = null;
    }
    viewerContainer.innerHTML = '';
  };

  closeBtn.addEventListener('click', closeViewer);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeViewer(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewer(); });

  // --- Array panoramas ---
  let panoramas = [];
  let currentActive = null;

  function createPopupContent(p) {
    return `
      <div class="popup-360">
        <strong>${escapeHtml(p.title || 'Sin título')}</strong>
        ${p.description ? `<p class="description">${escapeHtml(p.description)}</p>` : ''}
        <small>Fecha: ${escapeHtml(p.date || '')}</small>
        <div style="margin-top:8px;">
          <button class="open-360" type="button" data-file="${escapeHtml(p.file || '')}" data-title="${escapeHtml(p.title || '')}">Ver 360º</button>
        </div>
      </div>
    `;
  }

  function renderList(items) {
    listEl.innerHTML = '';
    resultsCountEl.textContent = `Mostrando ${items.length} panorámicas.`;
    
    if (!items || items.length === 0) {
      const liEmpty = document.createElement('li');
      liEmpty.className = 'empty';
      liEmpty.textContent = 'No se han encontrado panorámicas.';
      listEl.appendChild(liEmpty);
      return;
    }

    items.forEach((p) => {
      const li = document.createElement('li');
      li.className = 'panorama-item';
      li.dataset.title = escapeHtml(p.title || '');

      const truncatedDesc = truncate(p.description || '', 120);

      const thumbHTML = p.thumbnail
        ? `<img src="${escapeHtml(p.thumbnail)}" alt="Vista previa de ${escapeHtml(p.title || '')}" loading="lazy" onerror="this.outerHTML = '<div class=\'thumb-placeholder\'><span>Vista previa de ${escapeHtml(p.title || '')}</span></div>';">`
        : `<div class="thumb-placeholder"><span>Vista previa de ${escapeHtml(p.title || '')}</span></div>`;

      li.innerHTML = `
        ${thumbHTML}
        <div class="panorama-meta">
          <strong>${escapeHtml(p.title || 'Sin título')}</strong>
          ${p.description ? `<div class="panorama-desc" title="${escapeHtml(p.description)}">${truncatedDesc}</div>` : ''}
          <small class="panorama-date">${escapeHtml(p.date || '')}</small>
        </div>
        <button class="open-360" type="button" data-file="${escapeHtml(p.file || '')}" data-title="${escapeHtml(p.title || '')}">
          <i class="fas fa-camera"></i> Ver 360º
        </button>
      `;
      listEl.appendChild(li);
    });
    
    if (currentActive) {
      const activeItem = listEl.querySelector(`[data-title="${currentActive.dataset.title}"]`);
      if (activeItem) {
        activeItem.classList.add('active');
      }
    }
  }

  function updateList() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const sortOrder = sortSelect.value;

    let filtered = panoramas.filter(p => {
      const title = (p.title || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const date = (p.date || '').toLowerCase();
      return !q || title.includes(q) || desc.includes(q) || date.includes(q);
    });

    filtered.sort((a, b) => {
      const da = Date.parse(a.date) || 0;
      const db = Date.parse(b.date) || 0;
      return sortOrder === 'asc' ? da - db : db - da;
    });

    renderList(filtered);
  }

  searchInput.addEventListener('input', debounce(updateList, 300));
  sortSelect.addEventListener('change', updateList);

  // --- Cargar GeoJSON ---
  const loadPanoramas = async () => {
    spinner.style.display = 'block';
    try {
      const resp = await fetch(`./data/panoramas.geojson?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const geojson = await resp.json();

      const getBaseUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return window.location.origin + '/';
        } else {
          const pathParts = window.location.pathname.split('/').filter(p => p !== '');
          const repoName = pathParts[0];
          return `${window.location.origin}/${repoName}/`;
        }
      };
      
      const baseUrl = getBaseUrl();
      console.log('Base URL:', baseUrl);

      const resolvePath = (path) => {
        if (!path) return '';
        if (/^(https?:|data:|\/\/)/i.test(path)) return path;
        return new URL(path.replace(/^\/+/, ''), baseUrl).href;
      };

      panoramas = [];

      const layer = L.geoJSON(geojson, {
        pointToLayer: (feature, latlng) => L.marker(latlng, { icon: cameraIcon }),
        onEachFeature: (feature, layerMarker) => {
          const p = feature.properties ? { ...feature.properties } : {};
          p.file = resolvePath(p.file);
          p.thumbnail = resolvePath(p.thumbnail);
          p._marker = layerMarker;
          console.debug('Panorama resuelto:', p);
          panoramas.push(p);
          layerMarker.bindPopup(createPopupContent(p));
        }
      }).addTo(map);

      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });

      updateList();
      setTimeout(() => { map.invalidateSize(); }, 300);
    } catch (err) {
      console.error('❌ Error cargando panoramas:', err);
      listEl.innerHTML = '<li class="error">No se pudieron cargar las panorámicas.</li>';
    } finally {
      spinner.style.display = 'none';
    }
  };

  loadPanoramas();

  // --- Delegación global ---
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.open-360');
    if (!btn) return;

    const file = btn.dataset.file;
    const title = btn.dataset.title || '';
    if (!file) return;

    if (currentActive) {
      currentActive.classList.remove('active');
    }

    const listItem = btn.closest('li');
    if (listItem) {
      listItem.classList.add('active');
      currentActive = listItem;
    }

    const found = panoramas.find(p => p.file === file);
    if (found && found._marker) {
      map.setView(found._marker.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
      found._marker.openPopup();
    }

    openViewer(file, title);
  });
});