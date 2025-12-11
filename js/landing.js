/**
 * PropAnalytics - Landing Page JavaScript
 * Professional Real Estate Analytics Platform
 */

// Global Variables
let proyectos = [];
let miniMap = null;
let fullMap = null;
let projectMarkers = [];

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
  await loadProyectos();
  initParticles();
  initHeaderScroll();
  initDropdown();
  initMiniMap();
  initCountAnimation();
  initMapModal();
});

// Load Projects Data
async function loadProyectos() {
  try {
    const response = await fetch('data/proyectos.json');
    const data = await response.json();
    proyectos = data.proyectos;
    renderProjectsList();
  } catch (error) {
    console.error('Error loading projects:', error);
    // Fallback data
    proyectos = getFallbackProjects();
    renderProjectsList();
  }
}

// Fallback Projects Data
function getFallbackProjects() {
  return [
    {
      id: "mitikah",
      nombre: "Torre Mitikah",
      ubicacion: { ciudad: "Ciudad de Mexico", estado: "CDMX", lat: 19.3589, lng: -99.1623 },
      caracteristicas: { niveles: 65, estatus: "Operando" },
      imagen: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200"
    },
    {
      id: "torre-koi",
      nombre: "Torre KOI",
      ubicacion: { ciudad: "Monterrey", estado: "Nuevo Leon", lat: 25.6514, lng: -100.3358 },
      caracteristicas: { niveles: 64, estatus: "Operando" },
      imagen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200"
    },
    {
      id: "be-grand-pedregal",
      nombre: "Be Grand Alto Pedregal",
      ubicacion: { ciudad: "Ciudad de Mexico", estado: "CDMX", lat: 19.3067, lng: -99.1874 },
      caracteristicas: { niveles: 32, estatus: "Operando" },
      imagen: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1200"
    },
    {
      id: "andares-puerta-hierro",
      nombre: "Torres Landmark Andares",
      ubicacion: { ciudad: "Guadalajara", estado: "Jalisco", lat: 20.7108, lng: -103.4125 },
      caracteristicas: { niveles: 42, estatus: "En comercializacion" },
      imagen: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200"
    },
    {
      id: "bosque-real",
      nombre: "Central Park Bosque Real",
      ubicacion: { ciudad: "Huixquilucan", estado: "Estado de Mexico", lat: 19.3982, lng: -99.2847 },
      caracteristicas: { niveles: 27, estatus: "En construccion" },
      imagen: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
    }
  ];
}

// Render Projects List in Dropdown
function renderProjectsList() {
  const dropdownMenu = document.getElementById('dropdownMenu');
  if (!dropdownMenu) return;

  dropdownMenu.innerHTML = proyectos.map(proyecto => `
    <a href="dashboard.html?proyecto=${proyecto.id}" class="dropdown-item">
      <div class="dropdown-item-icon">
        <i class="fas fa-building"></i>
      </div>
      <div class="dropdown-item-info">
        <h4>${proyecto.nombre}</h4>
        <p>${proyecto.ubicacion.ciudad}, ${proyecto.ubicacion.estado} - ${proyecto.caracteristicas.niveles} niveles</p>
      </div>
      <i class="fas fa-chevron-right ms-auto opacity-50"></i>
    </a>
  `).join('');
}

// Initialize Animated Particles
function initParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;

  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 15}s`;
    particle.style.animationDuration = `${15 + Math.random() * 10}s`;
    particle.style.opacity = Math.random() * 0.5 + 0.2;
    particle.style.width = `${Math.random() * 4 + 2}px`;
    particle.style.height = particle.style.width;
    particlesContainer.appendChild(particle);
  }
}

// Header Scroll Effect
function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Dropdown Functionality
function initDropdown() {
  const trigger = document.getElementById('dropdownTrigger');
  const menu = document.getElementById('dropdownMenu');
  const card = document.getElementById('projectListCard');

  if (!trigger || !menu) return;

  // Toggle dropdown on trigger click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    trigger.classList.toggle('active');
    menu.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!card.contains(e.target)) {
      trigger.classList.remove('active');
      menu.classList.remove('show');
    }
  });

  // Show dropdown on card hover (optional)
  card.addEventListener('mouseenter', () => {
    setTimeout(() => {
      trigger.classList.add('active');
      menu.classList.add('show');
    }, 300);
  });
}

// Initialize Mini Map
function initMiniMap() {
  const miniMapContainer = document.getElementById('miniMap');
  if (!miniMapContainer) return;

  // Create mini map
  miniMap = L.map('miniMap', {
    center: [23.6345, -102.5528], // Center of Mexico
    zoom: 4,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    attributionControl: false
  });

  // Add tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(miniMap);

  // Add project markers
  addProjectMarkers(miniMap, true);
}

// Initialize Map Modal
function initMapModal() {
  const mapModal = document.getElementById('mapModal');
  const openMapBtn = document.getElementById('openMapBtn');
  const mapCard = document.getElementById('mapCard');

  if (!mapModal) return;

  // Open modal on button click
  if (openMapBtn) {
    openMapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = new bootstrap.Modal(mapModal);
      modal.show();
    });
  }

  // Open modal on card click
  if (mapCard) {
    mapCard.addEventListener('click', () => {
      const modal = new bootstrap.Modal(mapModal);
      modal.show();
    });
  }

  // Initialize full map when modal opens
  mapModal.addEventListener('shown.bs.modal', () => {
    if (!fullMap) {
      fullMap = L.map('fullMap', {
        center: [23.6345, -102.5528],
        zoom: 5
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(fullMap);

      addProjectMarkers(fullMap, false);
    } else {
      fullMap.invalidateSize();
    }
  });
}

// Add Project Markers to Map
function addProjectMarkers(map, isMini) {
  proyectos.forEach(proyecto => {
    const { lat, lng } = proyecto.ubicacion;

    // Custom marker icon
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${isMini ? '12px' : '24px'};
          height: ${isMini ? '12px' : '24px'};
          background: linear-gradient(135deg, #3182ce 0%, #6b46c1 100%);
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 10px rgba(49, 130, 206, 0.5);
          cursor: pointer;
          transition: transform 0.2s ease;
        "></div>
      `,
      iconSize: [isMini ? 12 : 24, isMini ? 12 : 24],
      iconAnchor: [isMini ? 6 : 12, isMini ? 6 : 12]
    });

    const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);

    if (!isMini) {
      // Image HTML (if project has an image)
      const imageHtml = proyecto.imagen ? `
        <div style="
          width: 100%;
          height: 140px;
          overflow: hidden;
          border-radius: 8px 8px 0 0;
          margin: -8px -8px 12px -8px;
        ">
          <img src="${proyecto.imagen}" alt="${proyecto.nombre}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          ">
        </div>
      ` : '';

      // Add popup with project info
      const popupContent = `
        <div style="
          min-width: 250px;
          font-family: 'Inter', sans-serif;
        ">
          ${imageHtml}
          <h4 style="
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #1a365d;
          ">${proyecto.nombre}</h4>
          <p style="
            font-size: 0.85rem;
            color: #718096;
            margin-bottom: 0.75rem;
          ">
            <i class="fas fa-map-marker-alt" style="color: #3182ce;"></i>
            ${proyecto.ubicacion.ciudad}, ${proyecto.ubicacion.estado}
          </p>
          <div style="
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            font-size: 0.8rem;
          ">
            <span>
              <strong>${proyecto.caracteristicas.niveles}</strong> niveles
            </span>
            <span style="
              padding: 0.125rem 0.5rem;
              background: ${proyecto.caracteristicas.estatus === 'Operando' ? 'rgba(56, 161, 105, 0.2)' : 'rgba(214, 158, 46, 0.2)'};
              color: ${proyecto.caracteristicas.estatus === 'Operando' ? '#38a169' : '#d69e2e'};
              border-radius: 4px;
              font-weight: 600;
            ">${proyecto.caracteristicas.estatus}</span>
          </div>
          <a href="dashboard.html?proyecto=${proyecto.id}" style="
            display: inline-block;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, #3182ce 0%, #6b46c1 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.85rem;
            transition: transform 0.2s ease;
          ">
            <i class="fas fa-chart-line me-1"></i> Analizar proyecto
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Hover effect
      marker.on('mouseover', function() {
        this._icon.querySelector('div').style.transform = 'scale(1.2)';
      });

      marker.on('mouseout', function() {
        this._icon.querySelector('div').style.transform = 'scale(1)';
      });
    }

    projectMarkers.push(marker);
  });

  // Fit bounds to show all markers
  if (projectMarkers.length > 0 && !isMini) {
    const group = L.featureGroup(projectMarkers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

// Count Animation
function initCountAnimation() {
  const counters = document.querySelectorAll('.stat-value[data-count]');

  const animateCount = (element) => {
    const target = parseInt(element.getAttribute('data-count'));
    const suffix = element.textContent.includes('%') ? '%' : '';
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCount = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current) + suffix;
        requestAnimationFrame(updateCount);
      } else {
        element.textContent = target + suffix;
      }
    };

    updateCount();
  };

  // Intersection Observer to trigger animation when visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

// Change hero background based on hovered project
function changeHeroBackground(imageUrl) {
  const heroImage = document.getElementById('heroImage');
  if (heroImage && imageUrl) {
    heroImage.style.opacity = '0';
    setTimeout(() => {
      heroImage.src = imageUrl;
      heroImage.style.opacity = '1';
    }, 300);
  }
}

// Utility: Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Utility: Format number with commas
function formatNumber(num) {
  return new Intl.NumberFormat('es-MX').format(num);
}
