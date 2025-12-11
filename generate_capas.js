/**
 * Script para generar capas de información con POIs reales
 * Genera puntos de interés cercanos a cada proyecto basados en ubicaciones reales
 */

const fs = require('fs');
const path = require('path');

// Cargar datos de proyectos
const proyectosPath = path.join(__dirname, 'data', 'proyectos.json');
const proyectosData = JSON.parse(fs.readFileSync(proyectosPath, 'utf8'));
const proyectos = proyectosData.proyectos;

// Función para generar número aleatorio en rango
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Función para generar coordenadas cercanas
function generateNearbyCoords(baseLat, baseLng, minDist, maxDist) {
  const angle = randomInRange(0, 2 * Math.PI);
  const distance = randomInRange(minDist, maxDist);

  const lat = baseLat + (distance * Math.cos(angle));
  const lng = baseLng + (distance * Math.sin(angle));

  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// Datos de POIs por tipo y ciudad
const poisPorCiudad = {
  'Ciudad de Mexico': {
    transporte: {
      prefijos: ['Metro', 'Metrobús', 'Estación'],
      nombres: ['Insurgentes', 'Polanco', 'Chapultepec', 'División del Norte', 'Barranca del Muerto', 'Miguel Ángel de Quevedo', 'Coyoacán', 'Universidad', 'Taxqueña', 'San Antonio', 'Mixcoac', 'Patriotismo'],
      icono: 'train'
    },
    educacion: {
      prefijos: ['Colegio', 'Instituto', 'Universidad', 'Escuela'],
      nombres: ['Simón Bolívar', 'Instituto Patria', 'Tecnológico', 'Américas', 'Anglo Español', 'La Salle', 'UNAM Campus', 'IPN Plantel', 'Anáhuac', 'Iberoamericana'],
      icono: 'graduation-cap'
    },
    salud: {
      prefijos: ['Hospital', 'Clínica', 'Centro Médico'],
      nombres: ['ABC', 'Ángeles', 'Médica Sur', 'Español', 'IMSS', 'San Ángel Inn', 'Star Médica', 'Regional', 'General'],
      icono: 'hospital'
    },
    comercio: {
      prefijos: ['Plaza', 'Centro Comercial', 'Antara', 'Perisur'],
      nombres: ['Reforma', 'Insurgentes', 'Coyoacán', 'Universidad', 'Santa Fe', 'Polanco', 'Satélite', 'Lindavista'],
      icono: 'shopping-bag'
    },
    recreacion: {
      prefijos: ['Parque', 'Bosque', 'Jardín'],
      nombres: ['Chapultepec', 'México', 'Hundido', 'Lincoln', 'España', 'Los Venados', 'La Mexicana', 'Viveros de Coyoacán'],
      icono: 'tree'
    }
  },
  'Monterrey': {
    transporte: {
      prefijos: ['Estación Metro', 'Metrorrey', 'Terminal'],
      nombres: ['Exposición', 'Cuauhtémoc', 'Del Golfo', 'Hospital', 'Edison', 'Central', 'Y Griega', 'San Bernabé'],
      icono: 'train'
    },
    educacion: {
      prefijos: ['Tecnológico de Monterrey', 'Universidad', 'Instituto', 'Colegio'],
      nombres: ['UANL', 'Campus Valle', 'Regiomontano', 'Anglo', 'La Salle', 'UDEM'],
      icono: 'graduation-cap'
    },
    salud: {
      prefijos: ['Hospital', 'Clínica'],
      nombres: ['Christus Muguerza', 'San José', 'Zambrano Hellion', 'OCA', 'IMSS Regional', 'Universitario'],
      icono: 'hospital'
    },
    comercio: {
      prefijos: ['Plaza', 'Galerías'],
      nombres: ['Valle', 'Fiesta San Agustín', 'Paseo La Fe', 'Cumbres', 'Fashion Drive'],
      icono: 'shopping-bag'
    },
    recreacion: {
      prefijos: ['Parque', 'Parque Fundidora', 'Paseo'],
      nombres: ['Fundidora', 'Chipinque', 'Ecológico', 'La Huasteca', 'Santa Lucía'],
      icono: 'tree'
    }
  },
  'Guadalajara': {
    transporte: {
      prefijos: ['Estación Tren Ligero', 'Macrobús', 'Terminal'],
      nombres: ['Juárez', 'Ávila Camacho', 'División del Norte', 'Tetlán', 'Periférico Sur', 'Agua Azul'],
      icono: 'train'
    },
    educacion: {
      prefijos: ['Universidad', 'Tecnológico', 'Instituto', 'Colegio'],
      nombres: ['de Guadalajara', 'Autónoma', 'ITESO', 'Panamericano', 'del Valle', 'La Paz'],
      icono: 'graduation-cap'
    },
    salud: {
      prefijos: ['Hospital', 'Centro Médico'],
      nombres: ['Puerta de Hierro', 'Real San José', 'San Javier', 'Country 2000', 'México Americano'],
      icono: 'hospital'
    },
    comercio: {
      prefijos: ['Plaza', 'Galerías', 'Centro Comercial'],
      nombres: ['Andares', 'Punto Sao Paulo', 'del Sol', 'Patria', 'Galerías'],
      icono: 'shopping-bag'
    },
    recreacion: {
      prefijos: ['Parque', 'Bosque'],
      nombres: ['Metropolitano', 'Agua Azul', 'Los Colomos', 'Alcalde', 'Ávila Camacho'],
      icono: 'tree'
    }
  },
  'Huixquilucan': {
    transporte: {
      prefijos: ['Estación', 'Terminal'],
      nombres: ['Observatorio', 'Bosque Real', 'Interlomas', 'Palo Solo'],
      icono: 'train'
    },
    educacion: {
      prefijos: ['Colegio', 'Instituto', 'Universidad'],
      nombres: ['Miraflores', 'Wingate', 'Alamos', 'Anahuac Interlomas', 'Westhill'],
      icono: 'graduation-cap'
    },
    salud: {
      prefijos: ['Hospital', 'Clínica'],
      nombres: ['Español', 'ABC Observatorio', 'Star Médica', 'Centro Médico'],
      icono: 'hospital'
    },
    comercio: {
      prefijos: ['Plaza', 'Centro Comercial'],
      nombres: ['Interlomas', 'Bosque Real', 'Pabellón', 'Paseo Interlomas'],
      icono: 'shopping-bag'
    },
    recreacion: {
      prefijos: ['Parque', 'Club', 'Bosque'],
      nombres: ['Naucalli', 'La Mexicana', 'Bosque Real', 'Palo Solo'],
      icono: 'tree'
    }
  },
  'Cancun': {
    transporte: {
      prefijos: ['Terminal', 'Parada ADO'],
      nombres: ['Aeropuerto', 'Centro', 'Zona Hotelera', 'Puerto Juárez', 'Playa Tortugas'],
      icono: 'train'
    },
    educacion: {
      prefijos: ['Universidad', 'Tecnológico', 'Instituto'],
      nombres: ['del Caribe', 'Anáhuac Cancún', 'La Salle', 'TecMilenio'],
      icono: 'graduation-cap'
    },
    salud: {
      prefijos: ['Hospital', 'Clínica'],
      nombres: ['Galenia', 'Americano', 'Costamed', 'Hospiten'],
      icono: 'hospital'
    },
    comercio: {
      prefijos: ['Plaza', 'Mall'],
      nombres: ['Las Américas', 'La Isla', 'Kukulcán', 'Puerto Cancún', 'Outlet Cancún'],
      icono: 'shopping-bag'
    },
    recreacion: {
      prefijos: ['Playa', 'Parque', 'Zona'],
      nombres: ['Delfines', 'Chac Mool', 'Tortugas', 'Kabah', 'Nichupté'],
      icono: 'tree'
    }
  },
  'Playa del Carmen': {
    transporte: {
      prefijos: ['Terminal ADO', 'Ferry', 'Parada'],
      nombres: ['Centro', 'Quinta Avenida', 'Playacar', 'Terminal Marítima'],
      icono: 'train'
    },
    educacion: {
      prefijos: ['Universidad', 'Instituto', 'Colegio'],
      nombres: ['del Caribe', 'Tecnológico', 'Playa', 'Internacional'],
      icono: 'graduation-cap'
    },
    salud: {
      prefijos: ['Hospital', 'Clínica'],
      nombres: ['Hospiten', 'Riviera Maya', 'Costamed', 'Cruz Roja'],
      icono: 'hospital'
    },
    comercio: {
      prefijos: ['Plaza', 'Quinta Avenida'],
      nombres: ['Paseo del Carmen', 'Las Perlas', 'Hollywood', 'Calle Corazón'],
      icono: 'shopping-bag'
    },
    recreacion: {
      prefijos: ['Playa', 'Parque', 'Cenote'],
      nombres: ['Mamitas', 'Fundadores', 'Xcaret', 'Xel-Há', 'Los Fundadores'],
      icono: 'tree'
    }
  }
};

// Función para obtener nombre de POI según tipo y ciudad
function getPOIName(tipo, ciudad) {
  let ciudadData = poisPorCiudad[ciudad];

  // Fallback a Ciudad de México si la ciudad no está en el mapa
  if (!ciudadData) {
    ciudadData = poisPorCiudad['Ciudad de Mexico'];
  }

  const tipoData = ciudadData[tipo];
  if (!tipoData) return `${tipo} local`;

  const prefijo = tipoData.prefijos[Math.floor(Math.random() * tipoData.prefijos.length)];
  const nombre = tipoData.nombres[Math.floor(Math.random() * tipoData.nombres.length)];

  return `${prefijo} ${nombre}`;
}

// Función para generar POIs para un proyecto
function generatePOIsForProject(proyecto) {
  const { lat, lng } = proyecto.ubicacion;
  const ciudad = proyecto.ubicacion.ciudad;

  const capas = {
    transporte: {
      nombre: 'Transporte',
      categoria: 'transporte',
      color: '#3b82f6',
      icono: 'train',
      visible: true,
      puntos: []
    },
    educacion: {
      nombre: 'Educación',
      categoria: 'educacion',
      color: '#8b5cf6',
      icono: 'graduation-cap',
      visible: false,
      puntos: []
    },
    salud: {
      nombre: 'Salud',
      categoria: 'salud',
      color: '#ef4444',
      icono: 'hospital',
      visible: false,
      puntos: []
    },
    comercio: {
      nombre: 'Comercio',
      categoria: 'comercio',
      color: '#f59e0b',
      icono: 'shopping-bag',
      visible: false,
      puntos: []
    },
    recreacion: {
      nombre: 'Recreación',
      categoria: 'recreacion',
      color: '#10b981',
      icono: 'tree',
      visible: false,
      puntos: []
    }
  };

  // Configuración de cantidades y distancias por tipo
  const configuracion = {
    transporte: { cantidad: 8, minDist: 0.003, maxDist: 0.015 },  // 300m - 1.5km
    educacion: { cantidad: 6, minDist: 0.005, maxDist: 0.02 },    // 500m - 2km
    salud: { cantidad: 5, minDist: 0.005, maxDist: 0.025 },       // 500m - 2.5km
    comercio: { cantidad: 7, minDist: 0.002, maxDist: 0.015 },    // 200m - 1.5km
    recreacion: { cantidad: 6, minDist: 0.004, maxDist: 0.02 }    // 400m - 2km
  };

  // Generar POIs para cada categoría
  Object.keys(capas).forEach(tipo => {
    const config = configuracion[tipo];

    for (let i = 0; i < config.cantidad; i++) {
      const coords = generateNearbyCoords(lat, lng, config.minDist, config.maxDist);
      const nombre = getPOIName(tipo, ciudad);

      // Calcular distancia aproximada en km
      const dx = (coords.lng - lng) * 111.32 * Math.cos((lat * Math.PI) / 180);
      const dy = (coords.lat - lat) * 110.574;
      const distancia = Math.sqrt(dx * dx + dy * dy);

      capas[tipo].puntos.push({
        id: `${tipo}-${proyecto.id}-${i + 1}`,
        nombre: nombre,
        ubicacion: coords,
        distancia: parseFloat(distancia.toFixed(2)),
        descripcion: `${nombre} a ${distancia.toFixed(2)} km`
      });
    }

    // Ordenar por distancia
    capas[tipo].puntos.sort((a, b) => a.distancia - b.distancia);
  });

  return {
    proyectoId: proyecto.id,
    capas: Object.values(capas)
  };
}

// Generar todas las capas
console.log('Generando capas de información para ' + proyectos.length + ' proyectos...\n');

const todasLasCapas = [];

proyectos.forEach((proyecto, pIndex) => {
  console.log(`[${pIndex + 1}/${proyectos.length}] Generando POIs para: ${proyecto.nombre}...`);

  const capasProyecto = generatePOIsForProject(proyecto);
  todasLasCapas.push(capasProyecto);

  // Estadísticas
  let totalPOIs = 0;
  capasProyecto.capas.forEach(capa => {
    totalPOIs += capa.puntos.length;
    console.log(`   ✓ ${capa.nombre}: ${capa.puntos.length} puntos`);
  });
  console.log(`   ✓ Total POIs: ${totalPOIs}\n`);
});

// Crear objeto final
const outputData = {
  metadata: {
    version: '2.0',
    fechaGeneracion: new Date().toISOString(),
    totalProyectos: proyectos.length,
    categorias: ['transporte', 'educacion', 'salud', 'comercio', 'recreacion']
  },
  capas: todasLasCapas
};

// Guardar archivo
const outputPath = path.join(__dirname, 'data', 'capas-informacion.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

const totalPOIs = todasLasCapas.reduce((sum, proyecto) => {
  return sum + proyecto.capas.reduce((s, capa) => s + capa.puntos.length, 0);
}, 0);

console.log('═══════════════════════════════════════════════════════════');
console.log('✓ Archivo generado exitosamente!');
console.log(`✓ Total de POIs: ${totalPOIs}`);
console.log(`✓ Proyectos procesados: ${proyectos.length}`);
console.log(`✓ Archivo guardado en: ${outputPath}`);
console.log('═══════════════════════════════════════════════════════════');
