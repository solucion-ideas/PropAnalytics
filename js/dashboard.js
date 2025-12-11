/**
 * PropAnalytics - Dashboard JavaScript
 * Professional Real Estate Analytics Platform
 */

// ============================================
// Global Variables
// ============================================
let map = null;
let currentProject = null;
let comparablesData = null;
let capasData = null;
let poligonosData = null;
let analisisMercadoData = null;
let proyectos = [];

// Layer Groups
const layerGroups = {
  comparables: null,
  transporte: null,
  educacion: null,
  salud: null,
  comercio: null,
  recreacion: null,
  radiosInfluencia: null,
  zonasNSE: null,
  heatMapPrecios: null
};

// Map Layers
let streetLayer = null;
let satelliteLayer = null;
let isSatellite = false;

// Charts
let priceDistChart = null;
let propertyTypeChart = null;
let nseChart = null;
let priceRangeChart = null;
let priceTrendsChart = null;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);

  try {
    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('proyecto') || 'mitikah';

    // Load all data
    await loadAllData(projectId);

    // Initialize components
    initMap();
    initCharts();
    initEventListeners();
    initPanels();

    // Render data
    renderProjectInfo();
    renderMapLayers();
    renderPolygons();
    renderComparablesTable();
    renderKPIs();
    renderInfrastructure();
    renderAmenities();
    renderMarketAnalysis();

    // Update charts with data
    updateCharts();

  } catch (error) {
    console.error('Error initializing dashboard:', error);
  } finally {
    showLoading(false);
  }
});

// ============================================
// Data Loading
// ============================================
async function loadAllData(projectId) {
  try {
    // Load projects
    const projectsRes = await fetch('data/proyectos.json');
    const projectsData = await projectsRes.json();
    proyectos = projectsData.proyectos;
    currentProject = proyectos.find(p => p.id === projectId) || proyectos[0];

    // Load comparables
    const comparablesRes = await fetch('data/inmuebles-comparables.json');
    comparablesData = await comparablesRes.json();

    // Load layers data
    const capasRes = await fetch('data/capas-informacion.json');
    capasData = await capasRes.json();

    // Load polygons data
    const poligonosRes = await fetch('data/poligonos.json');
    poligonosData = await poligonosRes.json();

    // Load market analysis data
    const analisisRes = await fetch('data/analisis-mercado.json');
    analisisMercadoData = await analisisRes.json();

  } catch (error) {
    console.error('Error loading data:', error);
    // Use fallback data if needed
  }
}

// ============================================
// Map Initialization
// ============================================
function initMap() {
  const { lat, lng } = currentProject.ubicacion;

  // Create map
  map = L.map('map', {
    center: [lat, lng],
    zoom: 15,
    zoomControl: false
  });

  // Street layer (dark theme)
  streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  });

  // Satellite layer
  satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: '&copy; Esri'
  });

  // Add default layer
  streetLayer.addTo(map);

  // Initialize layer groups
  Object.keys(layerGroups).forEach(key => {
    layerGroups[key] = L.layerGroup().addTo(map);
  });

  // Add main project marker
  addMainProjectMarker();
}

// ============================================
// Map Markers
// ============================================
function addMainProjectMarker() {
  const { lat, lng } = currentProject.ubicacion;

  const mainIcon = L.divIcon({
    className: 'main-project-marker',
    html: `
      <div style="
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #3182ce 0%, #6b46c1 100%);
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 20px rgba(49, 130, 206, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <i class="fas fa-building" style="color: white; font-size: 18px;"></i>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 4px 20px rgba(49, 130, 206, 0.6); }
          50% { box-shadow: 0 4px 40px rgba(49, 130, 206, 0.9); }
          100% { box-shadow: 0 4px 20px rgba(49, 130, 206, 0.6); }
        }
      </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });

  const marker = L.marker([lat, lng], { icon: mainIcon }).addTo(map);

  marker.bindPopup(`
    <div style="min-width: 280px; font-family: 'Inter', sans-serif;">
      <h4 style="font-size: 1.1rem; font-weight: 700; color: #1a365d; margin-bottom: 0.5rem;">
        ${currentProject.nombre}
      </h4>
      <p style="color: #718096; font-size: 0.85rem; margin-bottom: 0.75rem;">
        <i class="fas fa-map-marker-alt" style="color: #3182ce;"></i>
        ${currentProject.ubicacion.direccion}
      </p>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.8rem;">
        <div><strong>${currentProject.caracteristicas.niveles}</strong> niveles</div>
        <div><strong>${currentProject.caracteristicas.unidades}</strong> unidades</div>
        <div><strong>${currentProject.caracteristicas.altura}m</strong> altura</div>
        <div><strong>${formatCurrency(currentProject.departamentos.precioM2Promedio)}</strong>/m2</div>
      </div>
    </div>
  `);
}

function renderMapLayers() {
  const projectId = currentProject.id;
  // Filter comparables by project ID
  const projectComparables = comparablesData.comparables?.filter(c => c.proyectoId === projectId) || [];
  // Find project layers
  const projectCapasObj = capasData.capas?.find(c => c.proyectoId === projectId);
  const projectCapas = projectCapasObj?.capas || [];

  // Clear existing markers
  Object.values(layerGroups).forEach(group => group.clearLayers());

  // Add comparables markers
  projectComparables.forEach(comp => {
    const marker = createComparableMarker(comp);
    layerGroups.comparables.addLayer(marker);
  });

  // Add points of interest
  projectCapas.forEach(capa => {
    const categoria = capa.categoria;
    const puntos = capa.puntos || [];
    const color = capa.color || '#3498db';

    puntos.forEach(point => {
      const marker = createPOIMarker(point, categoria, color);
      if (layerGroups[categoria]) {
        layerGroups[categoria].addLayer(marker);
      }
    });
  });

  // Update counts
  updateLayerCounts();

  // Set initial layer visibility based on checkboxes
  document.querySelectorAll('.layer-checkbox[data-layer]').forEach(checkbox => {
    const layer = checkbox.dataset.layer;
    if (checkbox.checked) {
      map.addLayer(layerGroups[layer]);
    } else {
      map.removeLayer(layerGroups[layer]);
    }
  });
}

// ============================================
// Polygons Rendering
// ============================================
function renderPolygons() {
  const projectId = currentProject.id;
  const projectPolygons = poligonosData.poligonos?.filter(p => p.proyectoId === projectId) || [];

  if (projectPolygons.length === 0) return;

  // Clear existing polygons
  if (layerGroups.radiosInfluencia) layerGroups.radiosInfluencia.clearLayers();
  if (layerGroups.zonasNSE) layerGroups.zonasNSE.clearLayers();
  if (layerGroups.heatMapPrecios) layerGroups.heatMapPrecios.clearLayers();

  // Separate polygons by type
  const radiosInfluencia = projectPolygons.filter(p => p.tipo === 'radio-influencia');
  const zonasNSE = projectPolygons.filter(p => p.tipo === 'zona-nse');
  const zonasPrecios = projectPolygons.filter(p => p.tipo === 'zona-precio');

  // Render radios de influencia
  radiosInfluencia.forEach(radio => {
    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const leafletCoords = radio.coordenadas.map(coord => [coord[1], coord[0]]);

    const polygon = L.polygon(leafletCoords, {
      color: radio.estilo.color,
      fillColor: radio.estilo.fillColor,
      fillOpacity: radio.estilo.fillOpacity,
      weight: radio.estilo.weight,
      dashArray: radio.estilo.dashArray
    });

    polygon.bindPopup(`
      <div style="font-family: 'Inter', sans-serif;">
        <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">${radio.nombre}</h5>
        <p style="font-size: 0.8rem; color: #718096; margin: 0;">${radio.descripcion}</p>
        <p style="font-size: 0.75rem; color: #a0aec0; margin-top: 0.5rem;">
          <strong>Radio:</strong> ${radio.metadata.radio} km<br>
          <strong>Área:</strong> ${radio.metadata.area.toFixed(2)} km²
        </p>
      </div>
    `);

    layerGroups.radiosInfluencia.addLayer(polygon);
  });

  // Render zonas NSE
  zonasNSE.forEach(zona => {
    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const leafletCoords = zona.coordenadas.map(coord => [coord[1], coord[0]]);

    const polygon = L.polygon(leafletCoords, {
      color: zona.estilo.color,
      fillColor: zona.estilo.fillColor,
      fillOpacity: zona.estilo.fillOpacity,
      weight: zona.estilo.weight
    });

    const caracteristicas = zona.metadata.caracteristicas;
    polygon.bindPopup(`
      <div style="font-family: 'Inter', sans-serif;">
        <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">${zona.nombre}</h5>
        <div style="font-size: 0.8rem; color: #718096;">
          <p style="margin: 0.25rem 0;"><strong>Nivel:</strong> ${zona.metadata.nivel}</p>
          <p style="margin: 0.25rem 0;"><strong>Ingreso:</strong> ${caracteristicas.ingreso}</p>
          <p style="margin: 0.25rem 0;"><strong>Vivienda:</strong> ${caracteristicas.vivienda}</p>
          <p style="margin: 0.25rem 0;"><strong>Vehículos:</strong> ${caracteristicas.vehiculos}</p>
        </div>
      </div>
    `);

    layerGroups.zonasNSE.addLayer(polygon);
  });

  // Render heat map de precios
  zonasPrecios.forEach(zona => {
    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const leafletCoords = zona.coordenadas.map(coord => [coord[1], coord[0]]);

    const polygon = L.polygon(leafletCoords, {
      color: zona.estilo.color,
      fillColor: zona.estilo.fillColor,
      fillOpacity: zona.estilo.fillOpacity,
      weight: zona.estilo.weight
    });

    polygon.bindPopup(`
      <div style="font-family: 'Inter', sans-serif;">
        <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">${zona.nombre}</h5>
        <div style="font-size: 0.8rem; color: #718096;">
          <p style="margin: 0.25rem 0;"><strong>Rango:</strong> ${zona.metadata.rango}</p>
          <p style="margin: 0.25rem 0;"><strong>Precio/m²:</strong> ${formatCurrency(zona.metadata.precioMinM2)} - ${formatCurrency(zona.metadata.precioMaxM2)}</p>
        </div>
      </div>
    `);

    layerGroups.heatMapPrecios.addLayer(polygon);
  });

  // Don't add polygon layers to map initially - they'll be added when checkboxes are checked
  // Remove them from the map since they were added in initMap
  if (layerGroups.radiosInfluencia && map.hasLayer(layerGroups.radiosInfluencia)) {
    map.removeLayer(layerGroups.radiosInfluencia);
  }
  if (layerGroups.zonasNSE && map.hasLayer(layerGroups.zonasNSE)) {
    map.removeLayer(layerGroups.zonasNSE);
  }
  if (layerGroups.heatMapPrecios && map.hasLayer(layerGroups.heatMapPrecios)) {
    map.removeLayer(layerGroups.heatMapPrecios);
  }

  console.log('Polígonos renderizados:', {
    radios: radiosInfluencia.length,
    nse: zonasNSE.length,
    precios: zonasPrecios.length,
    totalLayersRadios: layerGroups.radiosInfluencia.getLayers().length,
    totalLayersNSE: layerGroups.zonasNSE.getLayers().length,
    totalLayersPrecios: layerGroups.heatMapPrecios.getLayers().length
  });
}

function createComparableMarker(comp) {
  const icon = L.divIcon({
    className: 'comparable-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${getPropertyColor(comp.estadoInmueble)};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: bold;
      ">
        <i class="fas fa-home" style="font-size: 11px;"></i>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  const marker = L.marker([comp.ubicacion.lat, comp.ubicacion.lng], { icon: icon });

  marker.bindPopup(createComparablePopup(comp), {
    maxWidth: 320
  });

  marker.on('click', () => {
    highlightTableRow(comp.id);
  });

  return marker;
}

function createPOIMarker(point, tipo, color) {
  const iconClass = getIconClass(tipo);

  const icon = L.divIcon({
    className: 'poi-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <i class="${iconClass}" style="font-size: 10px; color: white;"></i>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const marker = L.marker([point.ubicacion.lat, point.ubicacion.lng], { icon: icon });

  marker.bindPopup(`
    <div style="font-family: 'Inter', sans-serif;">
      <h5 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem;">${point.nombre}</h5>
      <p style="font-size: 0.8rem; color: #718096; margin-bottom: 0.5rem;">
        <i class="${iconClass}" style="color: ${color};"></i> ${capitalizeFirst(tipo)}
      </p>
      <p style="font-size: 0.75rem; color: #a0aec0;">
        <i class="fas fa-ruler"></i> A ${point.distancia} km del proyecto
      </p>
    </div>
  `);

  return marker;
}

function createComparablePopup(comp) {
  const imageHtml = comp.imagen ? `
    <div style="width: 100%; height: 150px; overflow: hidden; border-radius: 8px; margin-bottom: 0.75rem;">
      <img src="${comp.imagen}" alt="${comp.direccion}" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
  ` : '';

  return `
    <div style="min-width: 280px; font-family: 'Inter', sans-serif;">
      ${imageHtml}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
        <div>
          <h5 style="font-size: 0.95rem; font-weight: 600; color: #1a365d; margin-bottom: 0.25rem;">${comp.direccion}</h5>
          <span style="
            padding: 0.2rem 0.5rem;
            background: ${getBadgeColor(comp.estadoInmueble)};
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 600;
          ">${comp.estadoInmueble}</span>
        </div>
        <span style="font-size: 0.75rem; color: #718096;">${comp.tipo}</span>
      </div>

      <div style="
        background: #f7fafc;
        border-radius: 8px;
        padding: 0.75rem;
        margin-bottom: 0.75rem;
      ">
        <div style="font-size: 1.25rem; font-weight: 700; color: #38a169; margin-bottom: 0.25rem;">
          ${formatCurrency(comp.precioMXN)}
        </div>
        <div style="font-size: 0.8rem; color: #718096;">
          ${formatCurrency(comp.precioM2MXN)}/m2
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; font-size: 0.75rem; color: #4a5568;">
        <div style="text-align: center;">
          <div style="font-weight: 600;">${comp.superficieM2}</div>
          <div style="color: #a0aec0;">m2</div>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: 600;">${comp.recamaras}</div>
          <div style="color: #a0aec0;">recamaras</div>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: 600;">${comp.banos}</div>
          <div style="color: #a0aec0;">banos</div>
        </div>
      </div>

      <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0; font-size: 0.7rem; color: #a0aec0;">
        <i class="fas fa-calendar-alt"></i> Avaluo: ${formatDate(comp.fechaAvaluo)}
        &nbsp;|&nbsp;
        <i class="fas fa-clock"></i> ${comp.edad} anos
      </div>
    </div>
  `;
}

// ============================================
// Tables
// ============================================
function renderComparablesTable() {
  const projectId = currentProject.id;
  const comparables = comparablesData.comparables?.filter(c => c.proyectoId === projectId) || [];
  const tbody = document.getElementById('comparablesTableBody');

  tbody.innerHTML = comparables.map(comp => `
    <tr data-id="${comp.id}" onclick="focusOnMarker('${comp.id}', ${comp.ubicacion.lat}, ${comp.ubicacion.lng})">
      <td><i class="fas fa-map-marker-alt text-info me-2"></i>${comp.direccion}</td>
      <td>${comp.tipo}</td>
      <td class="price">${formatCurrency(comp.precioMXN)}</td>
      <td>${formatCurrency(comp.precioM2MXN)}</td>
      <td>${comp.superficieM2} m2</td>
      <td><i class="fas fa-bed me-1 opacity-50"></i>${comp.recamaras}</td>
      <td><i class="fas fa-bath me-1 opacity-50"></i>${comp.banos}</td>
      <td>${comp.edad} anos</td>
      <td><span class="badge ${getBadgeClass(comp.estadoInmueble)}">${comp.estadoInmueble}</span></td>
      <td>${formatDate(comp.fechaAvaluo)}</td>
    </tr>
  `).join('');

  // Update count
  document.getElementById('tableCount').textContent = `${comparables.length} registros`;

  // Update mini stats - calculate from comparables
  if (comparables.length > 0) {
    const avgPriceM2 = comparables.reduce((sum, c) => sum + c.precioM2MXN, 0) / comparables.length;
    const avgSurface = comparables.reduce((sum, c) => sum + c.superficieM2, 0) / comparables.length;
    document.getElementById('avgPriceM2').textContent = formatCurrency(Math.round(avgPriceM2));
    document.getElementById('avgSurface').textContent = `${Math.round(avgSurface)} m2`;
  }
}

function highlightTableRow(compId) {
  document.querySelectorAll('#comparablesTableBody tr').forEach(row => {
    row.classList.remove('highlighted');
    if (row.dataset.id === compId) {
      row.classList.add('highlighted');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// Global function for table click
window.focusOnMarker = function(id, lat, lng) {
  map.setView([lat, lng], 17);
  highlightTableRow(id);
};

// ============================================
// Project Info
// ============================================
function renderProjectInfo() {
  document.getElementById('projectName').textContent = currentProject.nombre;
  document.getElementById('projectLocation').textContent =
    `${currentProject.ubicacion.colonia}, ${currentProject.ubicacion.ciudad}`;
  document.getElementById('projectStatus').textContent = currentProject.caracteristicas.estatus;

  // Update status badge color
  const statusBadge = document.getElementById('projectStatus');
  if (currentProject.caracteristicas.estatus === 'Operando') {
    statusBadge.style.background = 'rgba(56, 161, 105, 0.2)';
    statusBadge.style.borderColor = 'rgba(56, 161, 105, 0.3)';
    statusBadge.style.color = '#38a169';
  } else if (currentProject.caracteristicas.estatus.includes('construccion')) {
    statusBadge.style.background = 'rgba(214, 158, 46, 0.2)';
    statusBadge.style.borderColor = 'rgba(214, 158, 46, 0.3)';
    statusBadge.style.color = '#d69e2e';
  }

  // Render project image
  if (currentProject.imagen) {
    const imageSection = document.getElementById('projectImageSection');
    imageSection.innerHTML = `
      <div style="position: relative; width: 100%; height: 220px; overflow: hidden; border-radius: var(--radius-lg);">
        <img src="${currentProject.imagen}" alt="${currentProject.nombre}"
             style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
          <p style="color: white; font-size: 0.9rem; font-weight: 600; margin: 0;">
            ${currentProject.nombre}
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 0.75rem; margin: 0.25rem 0 0 0;">
            <i class="fas fa-map-marker-alt"></i> ${currentProject.ubicacion.direccion}
          </p>
        </div>
      </div>
    `;
  }
}

function renderKPIs() {
  const projectId = currentProject.id;
  const stats = comparablesData[projectId]?.estadisticas || {};
  const capas = capasData[projectId] || {};

  // Price per m2
  document.getElementById('kpiPriceM2').textContent =
    formatCurrency(currentProject.departamentos.precioM2Promedio);
  document.getElementById('kpiPriceChange').innerHTML =
    `<i class="fas fa-arrow-up"></i> ${currentProject.plusvalia.tasaAnualPromedio}%`;

  // Units
  document.getElementById('kpiUnits').textContent =
    formatNumber(currentProject.caracteristicas.unidades);
  document.getElementById('kpiUnitsStatus').textContent =
    currentProject.caracteristicas.tipoDesarrollo;

  // Height
  document.getElementById('kpiHeight').textContent =
    `${currentProject.caracteristicas.altura}m`;
  document.getElementById('kpiLevels').textContent =
    `${currentProject.caracteristicas.niveles} niveles`;

  // Appreciation
  document.getElementById('kpiAppreciation').textContent =
    `${currentProject.plusvalia.tasaAnualPromedio}%`;

  // Zone indicators
  if (capas.demografiaZona) {
    document.getElementById('kpiPopulation').textContent =
      formatNumber(capas.demografiaZona.poblacionTotal);
    document.getElementById('kpiDensity').textContent =
      `${formatNumber(capas.demografiaZona.densidadHabKm2)}/km2`;
  }

  if (capas.indicadoresEconomicos) {
    document.getElementById('kpiVacancy').textContent =
      `${capas.indicadoresEconomicos.tasaVacancia}%`;
    document.getElementById('kpiCapRate').textContent =
      `${capas.indicadoresEconomicos.capRate}%`;
  }
}

function renderInfrastructure() {
  const projectId = currentProject.id;
  const capas = capasData[projectId] || {};
  const container = document.getElementById('infrastructureList');

  if (!capas.puntosInteres) return;

  const poi = capas.puntosInteres;
  let html = '';

  // Transport
  if (poi.transporte?.length) {
    html += createInfraSection('Transporte', 'fa-subway', '#3498db', poi.transporte.slice(0, 3));
  }

  // Commercial
  if (poi.comercio?.length) {
    html += createInfraSection('Comercio', 'fa-shopping-bag', '#f1c40f', poi.comercio.slice(0, 3));
  }

  // Health
  if (poi.salud?.length) {
    html += createInfraSection('Salud', 'fa-hospital', '#2ecc71', poi.salud.slice(0, 2));
  }

  container.innerHTML = html;
}

function createInfraSection(title, icon, color, items) {
  return `
    <div style="margin-bottom: 1rem;">
      <div style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--neutral-300);
      ">
        <i class="fas ${icon}" style="color: ${color};"></i>
        ${title}
      </div>
      ${items.map(item => `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255,255,255,0.03);
          border-radius: var(--radius-sm);
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
        ">
          <span style="color: var(--neutral-300);">${item.nombre}</span>
          <span style="color: var(--neutral-500);">${item.distanciaKm} km</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAmenities() {
  const container = document.getElementById('amenitiesList');
  const amenities = currentProject.amenidades || [];

  container.innerHTML = amenities.map(amenity => `
    <span style="
      padding: 0.375rem 0.75rem;
      background: rgba(49, 130, 206, 0.15);
      border: 1px solid rgba(49, 130, 206, 0.25);
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      color: var(--primary-light);
    ">${amenity}</span>
  `).join('');
}

// ============================================
// Market Analysis Rendering
// ============================================
function renderMarketAnalysis() {
  if (!analisisMercadoData || !analisisMercadoData.analisis) {
    console.warn('Market analysis data not loaded');
    return;
  }

  const projectId = currentProject.id;
  const analisis = analisisMercadoData.analisis[projectId];

  if (!analisis) {
    console.warn(`No market analysis found for project: ${projectId}`);
    return;
  }

  // Render Market KPIs
  const resumen = analisis.resumen;

  // DOM (Days on Market)
  const domEl = document.getElementById('kpiDOM');
  if (domEl) {
    domEl.textContent = `${resumen.domPromedio} días`;
  }
  const domStatusEl = document.getElementById('kpiDOMStatus');
  if (domStatusEl) {
    const domChange = resumen.domPromedio < 60 ? 'Rápido' : resumen.domPromedio < 90 ? 'Medio' : 'Lento';
    const domColor = resumen.domPromedio < 60 ? '#38a169' : resumen.domPromedio < 90 ? '#d69e2e' : '#e53e3e';
    domStatusEl.textContent = domChange;
    domStatusEl.style.color = domColor;
  }

  // Inventory
  const inventoryEl = document.getElementById('kpiInventory');
  if (inventoryEl) {
    inventoryEl.textContent = `${resumen.inventarioActual}`;
  }
  const inventoryMesesEl = document.getElementById('kpiInventoryMeses');
  if (inventoryMesesEl) {
    const mesesInventario = analisis.indicadores.ofertaDemanda.mesesInventario;
    inventoryMesesEl.textContent = `${mesesInventario} meses stock`;
  }

  // Absorption Rate
  const absorptionEl = document.getElementById('kpiAbsorption');
  if (absorptionEl) {
    const velocidad = analisis.inversion.metricas.velocidadVenta;
    absorptionEl.textContent = `${velocidad}`;
  }

  // Market Trend
  const trendEl = document.getElementById('kpiTrend');
  if (trendEl) {
    trendEl.textContent = resumen.tendencia;
  }
  const trendChangeEl = document.getElementById('kpiTrendChange');
  if (trendChangeEl) {
    const trendIcon = resumen.tendencia === 'Alcista' ? 'fa-arrow-up' : 'fa-arrow-down';
    const trendColor = resumen.tendencia === 'Alcista' ? '#38a169' : '#e53e3e';
    const trendClass = resumen.tendencia === 'Alcista' ? 'positive' : 'negative';
    trendChangeEl.innerHTML = `<i class="fas ${trendIcon}"></i> ${resumen.variacionAnual.toFixed(1)}% anual`;
    trendChangeEl.className = `kpi-change ${trendClass}`;
  }

  // Investment Metrics
  const roiEl = document.getElementById('kpiROI');
  if (roiEl) {
    roiEl.textContent = `${analisis.inversion.rendimiento.roi}%`;
  }

  const rentIncomeEl = document.getElementById('kpiRentIncome');
  if (rentIncomeEl) {
    rentIncomeEl.textContent = formatCurrency(analisis.inversion.alquiler.alquilerMensual);
  }

  const totalReturnEl = document.getElementById('kpiTotalReturn');
  if (totalReturnEl) {
    totalReturnEl.textContent = `${analisis.inversion.rendimiento.rendimientoTotal}%`;
  }

  const paybackEl = document.getElementById('kpiPayback');
  if (paybackEl) {
    paybackEl.textContent = `${analisis.inversion.rendimiento.paybackYears} años`;
  }

  // Update Price Trends Chart
  if (priceTrendsChart) {
    const historico = analisis.historicoPrecio;
    const prediccion = analisis.prediccionPrecio;

    // Get last 12 months of historical data
    const last12Months = historico.slice(-12);

    // Combine labels
    const labels = [
      ...last12Months.map(m => m.mes),
      ...prediccion.map(m => m.mes)
    ];

    // Historical data (last 12 months)
    const historicalData = last12Months.map(m => m.precioPromedioM2);

    // Add null values for prediction period in historical dataset
    const historicalWithNulls = [
      ...historicalData,
      ...new Array(prediccion.length).fill(null)
    ];

    // Prediction data (prepend last historical value for continuity)
    const predictionData = [
      ...new Array(last12Months.length - 1).fill(null),
      last12Months[last12Months.length - 1].precioPromedioM2,
      ...prediccion.map(m => m.precioPredichoM2)
    ];

    priceTrendsChart.data.labels = labels;
    priceTrendsChart.data.datasets[0].data = historicalWithNulls;
    priceTrendsChart.data.datasets[1].data = predictionData;
    priceTrendsChart.update();
  }

  console.log('Market analysis rendered for project:', projectId);
}

// ============================================
// Charts
// ============================================
function initCharts() {
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#a0aec0',
          font: { size: 11 }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#718096' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#718096' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  // Price Distribution Chart
  const priceCtx = document.getElementById('priceDistChart').getContext('2d');
  priceDistChart = new Chart(priceCtx, {
    type: 'line',
    data: {
      labels: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
      datasets: [{
        label: 'Precio/m2',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#3182ce',
        backgroundColor: 'rgba(49, 130, 206, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      ...chartDefaults,
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Property Type Chart
  const typeCtx = document.getElementById('propertyTypeChart').getContext('2d');
  propertyTypeChart = new Chart(typeCtx, {
    type: 'doughnut',
    data: {
      labels: ['Departamentos', 'Casas', 'Penthouses'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#3182ce', '#6b46c1', '#0d9488'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#a0aec0',
            padding: 15,
            font: { size: 11 }
          }
        }
      }
    }
  });

  // NSE Chart
  const nseCtx = document.getElementById('nseChart').getContext('2d');
  nseChart = new Chart(nseCtx, {
    type: 'bar',
    data: {
      labels: ['A/B', 'C+', 'C', 'C-', 'D/E'],
      datasets: [{
        label: 'Distribucion NSE',
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          '#6b46c1',
          '#3182ce',
          '#0d9488',
          '#dd6b20',
          '#e53e3e'
        ],
        borderRadius: 4
      }]
    },
    options: {
      ...chartDefaults,
      indexAxis: 'y',
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Price Range Mini Chart
  const priceRangeCtx = document.getElementById('priceRangeChart').getContext('2d');
  priceRangeChart = new Chart(priceRangeCtx, {
    type: 'bar',
    data: {
      labels: ['<$4M', '$4-8M', '$8-15M', '$15-25M', '>$25M'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: '#3182ce',
        borderRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: '#718096', font: { size: 8 } },
          grid: { display: false }
        },
        y: {
          display: false,
          grid: { display: false }
        }
      }
    }
  });

  // Price Trends Chart (Market Analysis)
  const priceTrendsCtx = document.getElementById('priceTrendsChart')?.getContext('2d');
  if (priceTrendsCtx) {
    priceTrendsChart = new Chart(priceTrendsCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Histórico',
            data: [],
            borderColor: '#3182ce',
            backgroundColor: 'rgba(49, 130, 206, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0
          },
          {
            label: 'Predicción',
            data: [],
            borderColor: '#6b46c1',
            backgroundColor: 'rgba(107, 70, 193, 0.1)',
            fill: true,
            tension: 0.4,
            borderDash: [5, 5],
            pointRadius: 0
          }
        ]
      },
      options: {
        ...chartDefaults,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#a0aec0',
              font: { size: 10 },
              usePointStyle: true,
              padding: 10
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(26, 32, 44, 0.95)',
            titleColor: '#fff',
            bodyColor: '#cbd5e0',
            borderColor: '#3182ce',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }
}

function updateCharts() {
  const projectId = currentProject.id;
  const comparables = comparablesData.comparables?.filter(c => c.proyectoId === projectId) || [];
  const projectCapasObj = capasData.capas?.find(c => c.proyectoId === projectId);
  const capas = projectCapasObj || {};

  // Price trend data (simulated)
  const basePrice = currentProject.departamentos.precioM2Promedio;
  const priceTrend = [
    basePrice * 0.92,
    basePrice * 0.94,
    basePrice * 0.96,
    basePrice * 0.98,
    basePrice * 0.99,
    basePrice
  ];
  priceDistChart.data.datasets[0].data = priceTrend.map(p => Math.round(p));
  priceDistChart.update();

  // Property type distribution
  const types = { departamento: 0, casa: 0, penthouse: 0 };
  comparables.forEach(c => {
    const tipo = c.tipo.toLowerCase();
    if (tipo.includes('penthouse')) types.penthouse++;
    else if (tipo.includes('casa')) types.casa++;
    else types.departamento++;
  });
  propertyTypeChart.data.datasets[0].data = [types.departamento, types.casa, types.penthouse];
  propertyTypeChart.update();

  // NSE Distribution
  if (capas.demografiaZona?.nse) {
    const nse = capas.demografiaZona.nse;
    nseChart.data.datasets[0].data = [nse.AB, nse.Cmas, nse.C, nse.Cmenos, nse.DE];
    nseChart.update();
  }

  // Price range distribution
  const priceRanges = [0, 0, 0, 0, 0];
  comparables.forEach(c => {
    const price = c.precioMXN / 1000000;
    if (price < 4) priceRanges[0]++;
    else if (price < 8) priceRanges[1]++;
    else if (price < 15) priceRanges[2]++;
    else if (price < 25) priceRanges[3]++;
    else priceRanges[4]++;
  });
  priceRangeChart.data.datasets[0].data = priceRanges;
  priceRangeChart.update();
}

// ============================================
// Event Listeners
// ============================================
function initEventListeners() {
  // Map controls
  document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
  document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());

  document.getElementById('centerProject').addEventListener('click', () => {
    const { lat, lng } = currentProject.ubicacion;
    map.setView([lat, lng], 15);
  });

  document.getElementById('toggleSatellite').addEventListener('click', () => {
    isSatellite = !isSatellite;
    if (isSatellite) {
      map.removeLayer(streetLayer);
      map.addLayer(satelliteLayer);
    } else {
      map.removeLayer(satelliteLayer);
      map.addLayer(streetLayer);
    }
  });

  document.getElementById('fullscreen').addEventListener('click', () => {
    const mapContainer = document.querySelector('.map-container');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapContainer.requestFullscreen();
    }
  });

  // Layer toggles
  document.querySelectorAll('.layer-checkbox[data-layer]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const layer = e.target.dataset.layer;
      const parent = e.target.closest('.layer-item');

      if (e.target.checked) {
        map.addLayer(layerGroups[layer]);
        parent.classList.add('active');
      } else {
        map.removeLayer(layerGroups[layer]);
        parent.classList.remove('active');
      }
    });
  });

  // Polygon toggles
  document.querySelectorAll('.layer-checkbox[data-polygon]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const polygon = e.target.dataset.polygon;
      const parent = e.target.closest('.layer-item');

      if (e.target.checked) {
        map.addLayer(layerGroups[polygon]);
        parent.classList.add('active');
      } else {
        map.removeLayer(layerGroups[polygon]);
        parent.classList.remove('active');
      }
    });
  });

  // Price range filter
  document.getElementById('priceRange').addEventListener('input', (e) => {
    document.getElementById('priceMax').textContent = formatCurrency(parseInt(e.target.value));
  });

  // Surface range filter
  document.getElementById('surfaceRange').addEventListener('input', (e) => {
    document.getElementById('surfaceMax').textContent = `${e.target.value} m2`;
  });

  // Apply filters
  document.getElementById('applyFilters').addEventListener('click', applyFilters);

  // Reset filters
  document.getElementById('resetFilters').addEventListener('click', resetFilters);

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.dataset.tab;
      switchTab(tab);
    });
  });

  // Export data button
  document.getElementById('exportData').addEventListener('click', exportDataToCSV);

  // Notifications button
  document.getElementById('showNotifications').addEventListener('click', showNotificationsPanel);

  // Theme toggle button
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);

  // Load saved theme on init
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcon('light');
    updateMapTileLayer('light');
  }
}

// ============================================
// Tab Switching
// ============================================
function switchTab(tabName) {
  // Update active tab button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Update panel title based on active tab
  const panelTitle = document.querySelector('.panel-title');
  const titles = {
    'analysis': 'Analisis de Proyecto',
    'market': 'Analisis de Mercado',
    'demographics': 'Analisis Demografico'
  };
  panelTitle.textContent = titles[tabName] || 'Analisis de Proyecto';

  // Get all panel sections
  const panelSections = document.querySelectorAll('.panel-section');

  // Hide all sections first
  panelSections.forEach(section => {
    section.style.display = 'none';
  });

  // Show sections based on active tab
  switch(tabName) {
    case 'analysis':
      showAnalysisView(panelSections);
      break;
    case 'market':
      showMarketView(panelSections);
      break;
    case 'demographics':
      showDemographicsView(panelSections);
      break;
  }

  // Open right panel if closed
  document.getElementById('panelRight').classList.remove('collapsed');
}

function showAnalysisView(sections) {
  // Show all sections for analysis view (default view)
  sections.forEach(section => {
    section.style.display = 'block';
  });
}

function showMarketView(sections) {
  // Show only market-related sections
  sections.forEach(section => {
    const title = section.querySelector('.panel-section-title');
    if (title) {
      const titleText = title.textContent.toLowerCase();
      // Show price distribution, property types, and zone indicators
      if (titleText.includes('precio') ||
          titleText.includes('inmueble') ||
          titleText.includes('zona') ||
          titleText.includes('resumen')) {
        section.style.display = 'block';
      }
    }
  });
}

function showDemographicsView(sections) {
  // Show only demographics-related sections
  sections.forEach(section => {
    const title = section.querySelector('.panel-section-title');
    if (title) {
      const titleText = title.textContent.toLowerCase();
      // Show demographic profile, zone indicators, and infrastructure
      if (titleText.includes('socioeconómico') ||
          titleText.includes('socioeconomico') ||
          titleText.includes('zona') ||
          titleText.includes('infraestructura') ||
          titleText.includes('población') ||
          titleText.includes('poblacion')) {
        section.style.display = 'block';
      }
    }
  });
}

// ============================================
// Panels
// ============================================
function initPanels() {
  // Toggle right panel
  document.getElementById('togglePanel').addEventListener('click', () => {
    document.getElementById('panelRight').classList.toggle('collapsed');
  });

  document.getElementById('closePanel').addEventListener('click', () => {
    document.getElementById('panelRight').classList.add('collapsed');
  });

  // Toggle filters sidebar
  document.getElementById('toggleFilters').addEventListener('click', () => {
    document.getElementById('sidebarLeft').classList.toggle('open');
  });

  document.getElementById('collapseSidebar').addEventListener('click', () => {
    document.getElementById('sidebarLeft').classList.toggle('collapsed');
  });

  // Toggle bottom panel
  document.getElementById('panelBottomHeader').addEventListener('click', () => {
    document.getElementById('panelBottom').classList.toggle('collapsed');
  });

  // Close popup
  document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('infoPopup').classList.remove('show');
  });
}

// ============================================
// Filters
// ============================================
function applyFilters() {
  const projectId = currentProject.id;
  const comparables = comparablesData.comparables?.filter(c => c.proyectoId === projectId) || [];

  const maxPrice = parseInt(document.getElementById('priceRange').value);
  const maxSurface = parseInt(document.getElementById('surfaceRange').value);
  const ageFilter = document.getElementById('ageFilter').value;

  const typeFilters = {
    departamento: document.querySelector('[data-type="departamento"]').checked,
    casa: document.querySelector('[data-type="casa"]').checked,
    penthouse: document.querySelector('[data-type="penthouse"]').checked
  };

  // Filter comparables
  layerGroups.comparables.clearLayers();

  comparables.forEach(comp => {
    let show = true;

    // Price filter
    if (comp.precioMXN > maxPrice) show = false;

    // Surface filter
    if (comp.superficieM2 > maxSurface) show = false;

    // Age filter
    if (ageFilter !== 'all') {
      const age = comp.edad;
      if (ageFilter === 'new' && age > 2) show = false;
      if (ageFilter === 'recent' && (age < 3 || age > 5)) show = false;
      if (ageFilter === 'medium' && (age < 6 || age > 15)) show = false;
      if (ageFilter === 'old' && age < 16) show = false;
    }

    // Type filter
    const tipo = comp.tipo.toLowerCase();
    if (tipo.includes('penthouse') && !typeFilters.penthouse) show = false;
    else if (tipo.includes('casa') && !typeFilters.casa) show = false;
    else if (!tipo.includes('casa') && !tipo.includes('penthouse') && !typeFilters.departamento) show = false;

    if (show) {
      const marker = createComparableMarker(comp);
      layerGroups.comparables.addLayer(marker);
    }
  });

  // Update table
  updateFilteredTable(comparables.filter(comp => {
    let show = true;
    if (comp.precioMXN > maxPrice) show = false;
    if (comp.superficieM2 > maxSurface) show = false;
    return show;
  }));

  // Update count
  updateLayerCounts();
}

function resetFilters() {
  document.getElementById('priceRange').value = 50000000;
  document.getElementById('priceMax').textContent = '$50M';
  document.getElementById('surfaceRange').value = 500;
  document.getElementById('surfaceMax').textContent = '500 m2';
  document.getElementById('ageFilter').value = 'all';

  document.querySelectorAll('[data-type]').forEach(cb => cb.checked = true);

  renderMapLayers();
  renderComparablesTable();
}

function updateFilteredTable(filtered) {
  const tbody = document.getElementById('comparablesTableBody');

  tbody.innerHTML = filtered.map(comp => `
    <tr data-id="${comp.id}" onclick="focusOnMarker('${comp.id}', ${comp.ubicacion.lat}, ${comp.ubicacion.lng})">
      <td><i class="fas fa-map-marker-alt text-info me-2"></i>${comp.direccion}</td>
      <td>${comp.tipo}</td>
      <td class="price">${formatCurrency(comp.precioMXN)}</td>
      <td>${formatCurrency(comp.precioM2MXN)}</td>
      <td>${comp.superficieM2} m2</td>
      <td><i class="fas fa-bed me-1 opacity-50"></i>${comp.recamaras}</td>
      <td><i class="fas fa-bath me-1 opacity-50"></i>${comp.banos}</td>
      <td>${comp.edad} anos</td>
      <td><span class="badge ${getBadgeClass(comp.estadoInmueble)}">${comp.estadoInmueble}</span></td>
      <td>${formatDate(comp.fechaAvaluo)}</td>
    </tr>
  `).join('');

  document.getElementById('tableCount').textContent = `${filtered.length} registros`;
}

// ============================================
// Export & Notifications
// ============================================
function exportDataToCSV() {
  const projectId = currentProject.id;
  const comparables = comparablesData.comparables?.filter(c => c.proyectoId === projectId) || [];

  if (comparables.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // CSV Headers
  const headers = [
    'Direccion',
    'Tipo',
    'Precio (MXN)',
    'Precio/m2',
    'Superficie (m2)',
    'Recamaras',
    'Banos',
    'Edad',
    'Estado',
    'Fecha Avaluo',
    'Latitud',
    'Longitud'
  ];

  // Build CSV content
  let csvContent = headers.join(',') + '\n';

  comparables.forEach(comp => {
    const row = [
      `"${comp.direccion}"`,
      `"${comp.tipo}"`,
      comp.precioMXN,
      comp.precioM2MXN,
      comp.superficieM2,
      comp.recamaras,
      comp.banos,
      comp.edad,
      `"${comp.estadoInmueble}"`,
      comp.fechaAvaluo,
      comp.ubicacion.lat,
      comp.ubicacion.lng
    ];
    csvContent += row.join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `comparables_${currentProject.nombre}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Show success message
  showNotification('Datos exportados exitosamente', 'success');
}

function showNotificationsPanel() {
  const notifications = [
    {
      type: 'info',
      icon: 'fa-info-circle',
      color: '#3182ce',
      title: 'Nuevo proyecto disponible',
      message: 'Se ha agregado un nuevo proyecto en Polanco',
      time: 'Hace 2 horas'
    },
    {
      type: 'warning',
      icon: 'fa-exclamation-triangle',
      color: '#d69e2e',
      title: 'Actualizacion de precios',
      message: 'Los precios en la zona han aumentado un 3.2%',
      time: 'Hace 5 horas'
    },
    {
      type: 'success',
      icon: 'fa-check-circle',
      color: '#38a169',
      title: 'Analisis completado',
      message: 'El analisis de mercado se ha actualizado',
      time: 'Hace 1 dia'
    }
  ];

  // Create notification popup
  const popup = document.getElementById('infoPopup');
  const popupTitle = document.getElementById('popupTitle');
  const popupSubtitle = document.getElementById('popupSubtitle');
  const popupContent = document.getElementById('popupContent');

  popupTitle.textContent = 'Notificaciones';
  popupSubtitle.textContent = `${notifications.length} nuevas`;

  let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

  notifications.forEach(notif => {
    html += `
      <div style="
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: rgba(255,255,255,0.03);
        border-radius: var(--radius-md);
        border-left: 3px solid ${notif.color};
      ">
        <div style="flex-shrink: 0;">
          <i class="fas ${notif.icon}" style="color: ${notif.color}; font-size: 1.25rem;"></i>
        </div>
        <div style="flex: 1;">
          <h5 style="font-size: 0.9rem; font-weight: 600; color: var(--neutral-200); margin-bottom: 0.25rem;">
            ${notif.title}
          </h5>
          <p style="font-size: 0.8rem; color: var(--neutral-400); margin-bottom: 0.5rem;">
            ${notif.message}
          </p>
          <span style="font-size: 0.7rem; color: var(--neutral-500);">
            <i class="fas fa-clock"></i> ${notif.time}
          </span>
        </div>
      </div>
    `;
  });

  html += '</div>';
  popupContent.innerHTML = html;
  popup.classList.add('show');

  // Clear notification badge after 1 second
  setTimeout(() => {
    const badge = document.querySelector('.notification-badge');
    if (badge) badge.style.display = 'none';
  }, 1000);
}

function showNotification(message, type = 'info') {
  // Create temporary notification toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// ============================================
// Utility Functions
// ============================================
function updateLayerCounts() {
  const projectId = currentProject.id;
  const projectCapasObj = capasData.capas?.find(c => c.proyectoId === projectId);
  const projectCapas = projectCapasObj?.capas || [];

  document.getElementById('comparablesCount').textContent =
    `${layerGroups.comparables.getLayers().length} inmuebles`;

  // Count by category
  const counts = {
    transporte: 0,
    educacion: 0,
    salud: 0,
    comercio: 0,
    recreacion: 0
  };

  projectCapas.forEach(capa => {
    if (counts.hasOwnProperty(capa.categoria)) {
      counts[capa.categoria] = capa.puntos?.length || 0;
    }
  });

  document.getElementById('transporteCount').textContent = `${counts.transporte} puntos`;
  document.getElementById('educacionCount').textContent = `${counts.educacion} puntos`;
  document.getElementById('saludCount').textContent = `${counts.salud} puntos`;
  document.getElementById('comercioCount').textContent = `${counts.comercio} puntos`;
  document.getElementById('recreacionCount').textContent = `${counts.recreacion} puntos`;
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.style.display = 'flex';
  } else {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.style.opacity = '1';
    }, 300);
  }
}

function formatCurrency(amount) {
  if (amount >= 1000000) {
    return '$' + (amount / 1000000).toFixed(1) + 'M';
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatNumber(num) {
  return new Intl.NumberFormat('es-MX').format(num);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPropertyColor(estado) {
  switch (estado.toLowerCase()) {
    case 'nuevo': return '#38a169';
    case 'seminuevo': return '#3182ce';
    case 'usado': return '#d69e2e';
    case 'remodelado': return '#6b46c1';
    default: return '#e74c3c';
  }
}

function getBadgeColor(estado) {
  switch (estado.toLowerCase()) {
    case 'nuevo': return 'rgba(56, 161, 105, 0.2); color: #38a169';
    case 'seminuevo': return 'rgba(49, 130, 206, 0.2); color: #3182ce';
    case 'usado': return 'rgba(214, 158, 46, 0.2); color: #d69e2e';
    case 'remodelado': return 'rgba(107, 70, 193, 0.2); color: #6b46c1';
    default: return 'rgba(229, 62, 62, 0.2); color: #e53e3e';
  }
}

function getBadgeClass(estado) {
  switch (estado.toLowerCase()) {
    case 'nuevo': return 'badge-new';
    case 'seminuevo': return 'badge-new';
    case 'usado': return 'badge-used';
    case 'remodelado': return 'badge-remodeled';
    default: return 'badge-used';
  }
}

function getIconClass(tipo) {
  switch (tipo) {
    case 'transporte': return 'fas fa-subway';
    case 'educacion': return 'fas fa-graduation-cap';
    case 'salud': return 'fas fa-hospital';
    case 'comercio': return 'fas fa-shopping-bag';
    case 'recreacion': return 'fas fa-tree';
    default: return 'fas fa-map-marker-alt';
  }
}

// ============================================
// Theme Toggle
// ============================================
function toggleTheme() {
  const body = document.body;
  const isLight = body.classList.toggle('light-theme');

  // Save theme preference
  localStorage.setItem('theme', isLight ? 'light' : 'dark');

  // Update icon
  updateThemeIcon(isLight ? 'light' : 'dark');

  // Update map tile layer
  updateMapTileLayer(isLight ? 'light' : 'dark');

  // Show notification
  showNotification(`Tema ${isLight ? 'claro' : 'oscuro'} activado`, 'success');
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#toggleTheme i');
  if (theme === 'light') {
    icon.className = 'fas fa-moon';
  } else {
    icon.className = 'fas fa-sun';
  }
}

function updateMapTileLayer(theme) {
  if (!map) return;

  if (theme === 'light') {
    map.removeLayer(streetLayer);

    // Light theme map
    const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    });

    // Store reference and add to map
    window.lightMapLayer = lightLayer;
    lightLayer.addTo(map);
  } else {
    if (window.lightMapLayer) {
      map.removeLayer(window.lightMapLayer);
    }
    streetLayer.addTo(map);
  }
}
