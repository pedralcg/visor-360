// assets/js/app.js
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Referencias DOM ---
  const mapEl         = document.getElementById('map');
  const modal         = document.getElementById('viewerModal');
  const viewerContainer = document.getElementById('viewerContainer');
  const closeBtn      = document.getElementById('closeBtn');
  const listEl        = document.getElementById('panoramaList');
  const searchInput   = document.getElementById('searchInput');
  const sortSelect    = document.getElementById('sortSelect');
  const resultsCountEl = document.getElementById('resultsCount');
  const spinner       = document.getElementById('listSpinner');
  const yearEl        = document.getElementById('year');

  if (!mapEl || !modal || !viewerContainer || !closeBtn || !listEl ||
      !searchInput || !sortSelect || !resultsCountEl || !spinner) {
    console.error('Faltan elementos esenciales en el DOM.');
    return;
  }

  // --- Año dinámico ---
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  // --- Resolución de rutas (GitHub Pages vs localhost) ---
  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.origin + '/';
    }
    const pathParts = window.location.pathname.split('/').filter(p => p !== '');
    const repoName = pathParts[0];
    return `${window.location.origin}/${repoName}/`;
  };

  const baseUrl = getBaseUrl();

  const resolvePath = (path) => {
    if (!path) return '';
    if (/^(https?:|data:|\/\/)/i.test(path)) return path;
    return new URL(path.replace(/^\/+/, ''), baseUrl).href;
  };

  // --- Inicializar mapa ---
  const map = L.map(mapEl).setView([37.99, -1.12], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  setTimeout(() => { try { map.invalidateSize(); } catch (e) { console.warn('invalidateSize:', e); } }, 300);

  // --- Icono personalizado ---
  const cameraIcon = L.divIcon({
    html: `
      <div class="camera-marker" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="11" fill="#1e5c2e" stroke="#164a23" stroke-width="2"/>
          <path d="M9 9L7 7H5C4.45 7 4 7.45 4 8V16C4 16.55 4.45 17 5 17H19C19.55 17 20 16.55 20 16V8C20 7.45 19.55 7 19 7H17L15 9H9Z" fill="white"/>
          <circle cx="12" cy="12.5" r="2.5" fill="#1e5c2e"/>
          <circle cx="12" cy="12.5" r="1" fill="white"/>
        </svg>
      </div>
    `,
    className: 'custom-camera-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  // --- Estado de la aplicación ---
  let panoramas  = [];
  let activeFile = null;  // URL del panorama activo (string, no referencia DOM)
  let triggerEl  = null;  // Elemento que abrió el modal (para devolver el foco al cerrar)

  // --- Visor 360 — error en DOM (sin alert) ---
  const showViewerError = (msg) => {
    viewerContainer.innerHTML = '';
    const err = document.createElement('div');
    err.className = 'viewer-error';
    err.setAttribute('role', 'alert');
    err.textContent = msg;
    viewerContainer.appendChild(err);
  };

  // --- Visor 360 ---
  let viewerInstance = null;

  const openViewer = (panoramaUrl, caption) => {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => closeBtn.focus());

    if (!(window.PhotoSphereViewer?.Viewer)) {
      showViewerError('Photo Sphere Viewer no disponible. Revisa los scripts incluidos.');
      return;
    }

    if (viewerInstance) {
      try { viewerInstance.destroy(); } catch (err) { console.warn(err); }
      viewerInstance = null;
    }

    viewerContainer.innerHTML = '';
    viewerContainer.style.minHeight = '400px';

    // Spinner mientras carga la imagen 360°
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'viewer-loading';
    loadingDiv.innerHTML = '<div class="spinner" aria-hidden="true"></div><p>Cargando imagen 360°…</p>';
    viewerContainer.appendChild(loadingDiv);

    try {
      viewerInstance = new PhotoSphereViewer.Viewer({
        container: viewerContainer,
        panorama: panoramaUrl,
        caption: caption || '',
        navbar: ['autorotate', 'zoom', 'fullscreen']
      });

      viewerInstance.on('ready', () => {
        viewerContainer.querySelector('.viewer-loading')?.remove();
      });

      viewerInstance.on('panorama-error', (e) => {
        console.error('Error cargando panorama:', e);
        showViewerError('No se pudo cargar la imagen 360°.');
      });
    } catch (err) {
      console.error('Error inicializando PhotoSphereViewer:', err);
      showViewerError('Error al inicializar el visor 360°.');
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
    if (triggerEl) { triggerEl.focus(); triggerEl = null; }
  };

  closeBtn.addEventListener('click', closeViewer);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeViewer(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewer(); });

  // --- Popup del mapa ---
  function createPopupContent(p) {
    return `
      <div class="popup-360">
        <strong>${escapeHtml(p.title || 'Sin título')}</strong>
        ${p.description ? `<p class="description">${escapeHtml(p.description)}</p>` : ''}
        <small>Fecha: ${escapeHtml(p.date || '')}</small>
        <div style="margin-top:8px;">
          <button class="open-360" type="button"
            data-file="${escapeHtml(p.file || '')}"
            data-title="${escapeHtml(p.title || '')}">Ver 360°</button>
        </div>
      </div>
    `;
  }

  // --- Activar item en la lista ---
  function setActiveItem(file) {
    activeFile = file;
    listEl.querySelectorAll('li[data-file]').forEach(li => {
      const isActive = li.dataset.file === file;
      li.classList.toggle('active', isActive);
      li.toggleAttribute('aria-current', isActive);
      if (isActive) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  // --- Crear elemento de lista para un panorama ---
  function createListItem(p) {
    const li = document.createElement('li');
    li.className = 'panorama-item';
    li.dataset.title = p.title || '';
    li.dataset.file  = p.file  || '';

    // Thumbnail con manejo seguro de errores (sin onerror inline)
    let thumbEl;
    if (p.thumbnail) {
      thumbEl = document.createElement('img');
      thumbEl.src     = p.thumbnail;
      thumbEl.alt     = `Vista previa de ${escapeHtml(p.title || '')}`;
      thumbEl.loading = 'lazy';
      thumbEl.width   = 90;
      thumbEl.height  = 65;
      thumbEl.addEventListener('error', () => {
        const placeholder = document.createElement('div');
        placeholder.className = 'thumb-placeholder';
        placeholder.innerHTML = `<span>${escapeHtml(p.title || 'Sin imagen')}</span>`;
        thumbEl.replaceWith(placeholder);
      });
    } else {
      thumbEl = document.createElement('div');
      thumbEl.className = 'thumb-placeholder';
      thumbEl.innerHTML = `<span>${escapeHtml(p.title || 'Sin imagen')}</span>`;
    }

    const meta = document.createElement('div');
    meta.className = 'panorama-meta';
    meta.innerHTML = `
      <strong>${escapeHtml(p.title || 'Sin título')}</strong>
      ${p.description
        ? `<div class="panorama-desc" title="${escapeHtml(p.description)}">${escapeHtml(truncate(p.description, 120))}</div>`
        : ''}
      <small class="panorama-date">${escapeHtml(p.date || '')}</small>
    `;

    const btn = document.createElement('button');
    btn.className     = 'open-360';
    btn.type          = 'button';
    btn.dataset.file  = p.file  || '';
    btn.dataset.title = p.title || '';
    btn.innerHTML     = '<i class="fas fa-camera" aria-hidden="true"></i> Ver 360°';

    li.appendChild(thumbEl);
    li.appendChild(meta);
    li.appendChild(btn);
    return li;
  }

  // --- Renderizar lista ---
  function renderList(items) {
    listEl.innerHTML = '';

    if (!items || items.length === 0) {
      const q = (searchInput.value || '').trim();
      resultsCountEl.textContent = q
        ? `Sin resultados para "${q}".`
        : 'No se han encontrado panorámicas.';
      return;
    }

    resultsCountEl.textContent = `Mostrando ${items.length} panorámica${items.length !== 1 ? 's' : ''}.`;
    items.forEach(p => listEl.appendChild(createListItem(p)));

    // Restaurar estado activo si el item sigue visible tras el filtrado
    if (activeFile) setActiveItem(activeFile);
  }

  // --- Filtrar y ordenar ---
  function updateList() {
    const q         = (searchInput.value || '').trim().toLowerCase();
    const sortOrder = sortSelect.value;

    const filtered = panoramas
      .filter(p => {
        const title = (p.title || '').toLowerCase();
        const desc  = (p.description || '').toLowerCase();
        const date  = (p.date || '').toLowerCase();
        return !q || title.includes(q) || desc.includes(q) || date.includes(q);
      })
      .sort((a, b) => {
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
    spinner.removeAttribute('aria-hidden');
    spinner.style.display = 'block';
    try {
      const GJ_URL = './data/panoramas.geojson';
      // Cache-busting solo en desarrollo local
      const url = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? `${GJ_URL}?t=${Date.now()}`
        : GJ_URL;

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const geojson = await resp.json();

      panoramas = [];

      const layer = L.geoJSON(geojson, {
        pointToLayer: (feature, latlng) => L.marker(latlng, { icon: cameraIcon }),
        onEachFeature: (feature, layerMarker) => {
          const p = feature.properties ? { ...feature.properties } : {};
          p.file      = resolvePath(p.file);
          p.thumbnail = resolvePath(p.thumbnail);
          p._marker   = layerMarker;
          panoramas.push(p);
          layerMarker.bindPopup(createPopupContent(p));
        }
      }).addTo(map);

      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });

      updateList();
      setTimeout(() => { map.invalidateSize(); }, 300);
    } catch (err) {
      console.error('Error cargando panoramas:', err);
      listEl.innerHTML = '<li class="error">No se pudieron cargar las panorámicas.</li>';
    } finally {
      spinner.style.display = 'none';
      spinner.setAttribute('aria-hidden', 'true');
    }
  };

  loadPanoramas();

  // --- Sincronizar lista al abrir popup desde el mapa ---
  map.on('popupopen', (e) => {
    const source = e.popup._source;
    if (!source?.getLatLng) return;
    const markerLatLng = source.getLatLng();
    const found = panoramas.find(p => p._marker && p._marker.getLatLng().equals(markerLatLng));
    if (found) setActiveItem(found.file);
  });

  // --- Delegación global de clicks en .open-360 ---
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.open-360');
    if (!btn) return;

    const file  = btn.dataset.file;
    const title = btn.dataset.title || '';
    if (!file) return;

    triggerEl = btn;
    setActiveItem(file);

    const found = panoramas.find(p => p.file === file);
    if (found?._marker) {
      map.setView(found._marker.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
      found._marker.openPopup();
    }

    openViewer(file, title);
  });
});
