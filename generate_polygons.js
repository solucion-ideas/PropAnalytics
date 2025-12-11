/**
 * Script para generar polígonos con coordenadas reales
 * Genera 11 polígonos por proyecto: radios de influencia, zonas NSE y mapa de precios
 */

const fs = require('fs');
const path = require('path');

// Cargar datos de proyectos
const proyectosPath = path.join(__dirname, 'data', 'proyectos.json');
const proyectosData = JSON.parse(fs.readFileSync(proyectosPath, 'utf8'));
const proyectos = proyectosData.proyectos;

// Función para generar círculo de coordenadas
function generateCircleCoords(centerLat, centerLng, radiusKm, points = 32) {
  const coords = [];
  const radiusInDegrees = radiusKm / 111.32; // Aproximación: 1 grado ≈ 111.32 km

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusInDegrees * Math.cos(angle);
    const dy = radiusInDegrees * Math.sin(angle) / Math.cos((centerLat * Math.PI) / 180);

    coords.push([
      parseFloat((centerLng + dy).toFixed(6)),
      parseFloat((centerLat + dx).toFixed(6))
    ]);
  }

  return coords;
}

// Función para generar polígono irregular (para zonas NSE y precios)
function generateIrregularPolygon(centerLat, centerLng, avgRadius, irregularity = 0.3, points = 12) {
  const coords = [];
  const radiusInDegrees = avgRadius / 111.32;

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    // Agregar variación aleatoria al radio
    const variation = 1 + (Math.random() - 0.5) * irregularity;
    const radius = radiusInDegrees * variation;

    const dx = radius * Math.cos(angle);
    const dy = radius * Math.sin(angle) / Math.cos((centerLat * Math.PI) / 180);

    coords.push([
      parseFloat((centerLng + dy).toFixed(6)),
      parseFloat((centerLat + dx).toFixed(6))
    ]);
  }

  return coords;
}

// Función para generar offset de coordenadas
function offsetCoords(lat, lng, offsetKm, angle) {
  const offsetDegrees = offsetKm / 111.32;
  const dx = offsetDegrees * Math.cos(angle);
  const dy = offsetDegrees * Math.sin(angle) / Math.cos((lat * Math.PI) / 180);

  return {
    lat: lat + dx,
    lng: lng + dy
  };
}

// Función para generar polígonos para un proyecto
function generatePolygonsForProject(proyecto) {
  const { lat, lng } = proyecto.ubicacion;
  const poligonos = [];

  // 1. Radios de influencia (3 círculos concéntricos)
  const radiosInfluencia = [
    { radio: 0.5, nombre: '500m', color: 'rgba(59, 130, 246, 0.2)', borde: '#3b82f6' },
    { radio: 1.0, nombre: '1 km', color: 'rgba(139, 92, 246, 0.15)', borde: '#8b5cf6' },
    { radio: 2.0, nombre: '2 km', color: 'rgba(236, 72, 153, 0.1)', borde: '#ec4899' }
  ];

  radiosInfluencia.forEach((radio, index) => {
    poligonos.push({
      id: `radio-${proyecto.id}-${index + 1}`,
      proyectoId: proyecto.id,
      tipo: 'radio-influencia',
      nombre: `Radio ${radio.nombre}`,
      descripcion: `Área de influencia de ${radio.nombre}`,
      coordenadas: generateCircleCoords(lat, lng, radio.radio),
      estilo: {
        fillColor: radio.color,
        fillOpacity: 0.3,
        color: radio.borde,
        weight: 2,
        dashArray: '5, 5'
      },
      visible: index === 0, // Solo el primero visible por defecto
      metadata: {
        radio: radio.radio,
        area: Math.PI * radio.radio * radio.radio
      }
    });
  });

  // 2. Zonas por Nivel Socioeconómico (5 zonas irregulares)
  const zonasNSE = [
    {
      nivel: 'A/B',
      nombre: 'NSE Alto',
      color: 'rgba(16, 185, 129, 0.25)',
      offset: { km: 0.8, angle: Math.PI / 4 },
      radius: 1.2
    },
    {
      nivel: 'C+',
      nombre: 'NSE Medio Alto',
      color: 'rgba(59, 130, 246, 0.25)',
      offset: { km: 1.2, angle: -Math.PI / 3 },
      radius: 1.5
    },
    {
      nivel: 'C',
      nombre: 'NSE Medio',
      color: 'rgba(245, 158, 11, 0.25)',
      offset: { km: 1.5, angle: Math.PI },
      radius: 1.3
    },
    {
      nivel: 'D+',
      nombre: 'NSE Medio Bajo',
      color: 'rgba(249, 115, 22, 0.25)',
      offset: { km: 1.8, angle: -Math.PI / 6 },
      radius: 1.4
    },
    {
      nivel: 'D',
      nombre: 'NSE Bajo',
      color: 'rgba(239, 68, 68, 0.25)',
      offset: { km: 2.2, angle: 2 * Math.PI / 3 },
      radius: 1.6
    }
  ];

  zonasNSE.forEach((zona, index) => {
    const centro = offsetCoords(lat, lng, zona.offset.km, zona.offset.angle);

    poligonos.push({
      id: `nse-${proyecto.id}-${index + 1}`,
      proyectoId: proyecto.id,
      tipo: 'zona-nse',
      nombre: zona.nombre,
      descripcion: `Zona de nivel socioeconómico ${zona.nivel}`,
      coordenadas: generateIrregularPolygon(centro.lat, centro.lng, zona.radius, 0.4),
      estilo: {
        fillColor: zona.color,
        fillOpacity: 0.4,
        color: zona.color.replace('0.25', '0.8'),
        weight: 2
      },
      visible: false,
      metadata: {
        nivel: zona.nivel,
        caracteristicas: getNSECaracteristicas(zona.nivel)
      }
    });
  });

  // 3. Mapa de precios (3 zonas de calor de precios)
  const zonasPrecios = [
    {
      rango: 'premium',
      nombre: 'Zona Premium',
      color: 'rgba(220, 38, 38, 0.3)',
      offset: { km: 0.6, angle: 0 },
      radius: 0.9
    },
    {
      rango: 'alto',
      nombre: 'Zona Precio Alto',
      color: 'rgba(245, 158, 11, 0.3)',
      offset: { km: 1.3, angle: Math.PI / 2 },
      radius: 1.2
    },
    {
      rango: 'medio',
      nombre: 'Zona Precio Medio',
      color: 'rgba(34, 197, 94, 0.3)',
      offset: { km: 1.8, angle: -Math.PI / 2 },
      radius: 1.5
    }
  ];

  zonasPrecios.forEach((zona, index) => {
    const centro = offsetCoords(lat, lng, zona.offset.km, zona.offset.angle);
    const precioBase = proyecto.departamentos.precioM2Promedio;

    let precioZona;
    if (zona.rango === 'premium') {
      precioZona = { min: precioBase * 1.2, max: precioBase * 1.5 };
    } else if (zona.rango === 'alto') {
      precioZona = { min: precioBase * 0.9, max: precioBase * 1.2 };
    } else {
      precioZona = { min: precioBase * 0.6, max: precioBase * 0.9 };
    }

    poligonos.push({
      id: `precio-${proyecto.id}-${index + 1}`,
      proyectoId: proyecto.id,
      tipo: 'zona-precio',
      nombre: zona.nombre,
      descripcion: `Rango de precios: $${Math.round(precioZona.min / 1000)}k - $${Math.round(precioZona.max / 1000)}k MXN/m²`,
      coordenadas: generateIrregularPolygon(centro.lat, centro.lng, zona.radius, 0.35),
      estilo: {
        fillColor: zona.color,
        fillOpacity: 0.5,
        color: zona.color.replace('0.3', '1'),
        weight: 2
      },
      visible: false,
      metadata: {
        rango: zona.rango,
        precioMinM2: Math.round(precioZona.min),
        precioMaxM2: Math.round(precioZona.max)
      }
    });
  });

  return poligonos;
}

// Función auxiliar para características de NSE
function getNSECaracteristicas(nivel) {
  const caracteristicas = {
    'A/B': {
      ingreso: 'Alto (>$85,000 MXN/mes)',
      vivienda: 'Residencial exclusivo',
      vehiculos: '2-3 autos de lujo'
    },
    'C+': {
      ingreso: 'Medio Alto ($35,000-$85,000 MXN/mes)',
      vivienda: 'Residencial medio-alto',
      vehiculos: '1-2 autos'
    },
    'C': {
      ingreso: 'Medio ($11,600-$35,000 MXN/mes)',
      vivienda: 'Departamentos/casas medianas',
      vehiculos: '1 auto'
    },
    'D+': {
      ingreso: 'Medio Bajo ($6,800-$11,600 MXN/mes)',
      vivienda: 'Vivienda de interés social',
      vehiculos: '0-1 auto básico'
    },
    'D': {
      ingreso: 'Bajo ($2,700-$6,800 MXN/mes)',
      vivienda: 'Vivienda económica',
      vehiculos: 'Transporte público'
    }
  };

  return caracteristicas[nivel] || {};
}

// Generar todos los polígonos
console.log('Generando polígonos para ' + proyectos.length + ' proyectos...\n');

const todosPoligonos = [];

proyectos.forEach((proyecto, pIndex) => {
  console.log(`[${pIndex + 1}/${proyectos.length}] Generando polígonos para: ${proyecto.nombre}...`);

  const poligonosProyecto = generatePolygonsForProject(proyecto);
  todosPoligonos.push(...poligonosProyecto);

  // Contar por tipo
  const porTipo = {
    'radio-influencia': 0,
    'zona-nse': 0,
    'zona-precio': 0
  };

  poligonosProyecto.forEach(p => porTipo[p.tipo]++);

  console.log(`   ✓ Radios de influencia: ${porTipo['radio-influencia']}`);
  console.log(`   ✓ Zonas NSE: ${porTipo['zona-nse']}`);
  console.log(`   ✓ Zonas de precio: ${porTipo['zona-precio']}`);
  console.log(`   ✓ Total: ${poligonosProyecto.length} polígonos\n`);
});

// Crear objeto final
const outputData = {
  metadata: {
    version: '2.0',
    fechaGeneracion: new Date().toISOString(),
    totalPoligonos: todosPoligonos.length,
    proyectos: proyectos.length,
    poligonosPorProyecto: 11,
    tipos: ['radio-influencia', 'zona-nse', 'zona-precio']
  },
  poligonos: todosPoligonos
};

// Guardar archivo
const outputPath = path.join(__dirname, 'data', 'poligonos.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

console.log('═══════════════════════════════════════════════════════════');
console.log('✓ Archivo generado exitosamente!');
console.log(`✓ Total de polígonos: ${todosPoligonos.length}`);
console.log(`✓ Proyectos procesados: ${proyectos.length}`);
console.log(`✓ Polígonos por proyecto: 11`);
console.log(`✓ Archivo guardado en: ${outputPath}`);
console.log('═══════════════════════════════════════════════════════════');
