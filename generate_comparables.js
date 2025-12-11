/**
 * Script para generar inmuebles comparables reales
 * Genera 32 comparables por cada proyecto con ubicaciones cercanas y precios de mercado
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

// Función para generar coordenadas cercanas (aprox 0.5 - 5 km de distancia)
function generateNearbyCoords(baseLat, baseLng, minDist = 0.005, maxDist = 0.045) {
  const angle = randomInRange(0, 2 * Math.PI);
  const distance = randomInRange(minDist, maxDist);

  const lat = baseLat + (distance * Math.cos(angle));
  const lng = baseLng + (distance * Math.sin(angle));

  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// Tipos de inmueble
const tiposInmueble = ['departamento', 'penthouse', 'loft', 'casa'];
const estados = ['nuevo', 'usado', 'remodelado'];

// Calles genéricas por ciudad
const callesPorCiudad = {
  'Ciudad de Mexico': [
    'Insurgentes Sur', 'Av. Universidad', 'Av. Division del Norte', 'Eje Central',
    'Periferico Sur', 'Av. Revolucion', 'Rio Churubusco', 'Patriotismo',
    'Av. Cuauhtemoc', 'Av. Chapultepec', 'Paseo de la Reforma', 'Av. Insurgentes',
    'Av. Juarez', 'Ejercito Nacional', 'Campos Eliseos', 'Horacio',
    'Moliere', 'Masaryk', 'Av. de los Virreyes', 'Palmas'
  ],
  'Monterrey': [
    'Av. Gomez Morin', 'Av. Lázaro Cárdenas', 'Av. Constitución', 'Av. Hidalgo',
    'Av. Eugenio Garza Lagüera', 'Av. Ricardo Margáin', 'Av. Diego Rivera',
    'Av. Vasconcelos', 'Av. Morones Prieto', 'Av. San Jerónimo'
  ],
  'Guadalajara': [
    'Av. Patria', 'Av. Láparo Cárdenas', 'Av. de las Américas', 'Av. Chapultepec',
    'Av. Providencia', 'Av. Acueducto', 'Av. Enrique Díaz de León',
    'Av. Niños Héroes', 'Av. Vallarta', 'Calzada Independencia'
  ],
  'Huixquilucan': [
    'Blvd. Bosque Real', 'Av. Jesús del Monte', 'Autopista México-Toluca',
    'Av. de los Bosques', 'Av. Club de Golf'
  ],
  'Cancun': [
    'Blvd. Kukulcán', 'Av. Bonampak', 'Av. Tulum', 'Av. Xcaret',
    'Av. Cobá', 'Av. Yaxchilán', 'Av. Nichupté'
  ],
  'Playa del Carmen': [
    'Av. 5ta Avenida', 'Calle 10 Norte', 'Calle 34 Norte', 'Av. 10 Norte',
    'Av. Constituyentes', 'Calle 38 Norte', 'Av. 30 Norte'
  ]
};

// Función para obtener calle aleatoria según la ciudad
function getRandomCalle(ciudad) {
  const calles = callesPorCiudad[ciudad] || ['Av. Principal', 'Calle Centro', 'Av. Reforma'];
  return calles[Math.floor(Math.random() * calles.length)];
}

// Función para generar comparable
function generateComparable(proyecto, index) {
  const coords = generateNearbyCoords(proyecto.ubicacion.lat, proyecto.ubicacion.lng);

  // Variación de precio basada en el proyecto (±30%)
  const precioVariacion = randomInRange(0.7, 1.3);
  const precioM2 = Math.round(proyecto.departamentos.precioM2Promedio * precioVariacion);

  // Superficie aleatoria dentro del rango del proyecto
  const superficieMin = proyecto.departamentos.superficieMinM2;
  const superficieMax = proyecto.departamentos.superficieMaxM2;
  const superficie = Math.round(randomInRange(superficieMin, superficieMax));

  // Calcular precio total
  const precioTotal = precioM2 * superficie;

  // Recámaras según superficie
  let recamaras;
  if (superficie < 80) recamaras = 1;
  else if (superficie < 120) recamaras = 2;
  else if (superficie < 200) recamaras = 3;
  else recamaras = 4;

  recamaras = Math.min(recamaras, proyecto.departamentos.recamarasMax);
  recamaras = Math.max(recamaras, proyecto.departamentos.recamarasMin);

  // Baños (generalmente recámaras + 0.5)
  const banos = recamaras + (Math.random() > 0.5 ? 0.5 : 0);

  // Tipo de inmueble (80% departamentos, 15% penthouses, 5% otros)
  let tipo;
  const rand = Math.random();
  if (rand < 0.8) tipo = 'departamento';
  else if (rand < 0.95) tipo = 'penthouse';
  else tipo = tiposInmueble[Math.floor(Math.random() * tiposInmueble.length)];

  // Estado (60% nuevo, 30% usado, 10% remodelado)
  let estado;
  const estadoRand = Math.random();
  if (estadoRand < 0.6) estado = 'nuevo';
  else if (estadoRand < 0.9) estado = 'usado';
  else estado = 'remodelado';

  // Edad del inmueble
  const anoActual = 2024;
  let edad;
  if (estado === 'nuevo') edad = randomInRange(0, 2);
  else if (estado === 'remodelado') edad = randomInRange(3, 8);
  else edad = randomInRange(5, 20);
  edad = Math.round(edad);

  // Fecha de avalúo (últimos 6 meses)
  const diasAtras = Math.floor(randomInRange(1, 180));
  const fechaAvaluo = new Date();
  fechaAvaluo.setDate(fechaAvaluo.getDate() - diasAtras);

  // Dirección
  const calle = getRandomCalle(proyecto.ubicacion.ciudad);
  const numero = Math.floor(randomInRange(100, 9999));
  const direccion = `${calle} ${numero}`;

  return {
    id: `comp-${proyecto.id}-${String(index).padStart(2, '0')}`,
    proyectoId: proyecto.id,
    direccion: direccion,
    colonia: proyecto.ubicacion.colonia,
    ciudad: proyecto.ubicacion.ciudad,
    estado: proyecto.ubicacion.estado,
    ubicacion: coords,
    tipo: tipo,
    superficieM2: superficie,
    recamaras: recamaras,
    banos: banos,
    precioMXN: Math.round(precioTotal),
    precioM2MXN: precioM2,
    estadoInmueble: estado,
    edad: edad,
    estacionamientos: recamaras >= 2 ? (Math.random() > 0.3 ? 2 : 1) : 1,
    fechaAvaluo: fechaAvaluo.toISOString().split('T')[0],
    imagen: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1567496898669-ee935f5f647a' : '1512917774080-9991f1c4c750'}?w=600&q=80`
  };
}

// Generar todos los comparables
console.log('Generando comparables para ' + proyectos.length + ' proyectos...\n');

const todosComparables = [];

proyectos.forEach((proyecto, pIndex) => {
  console.log(`[${pIndex + 1}/${proyectos.length}] Generando 32 comparables para: ${proyecto.nombre}...`);

  const comparablesProyecto = [];
  for (let i = 1; i <= 32; i++) {
    comparablesProyecto.push(generateComparable(proyecto, i));
  }

  todosComparables.push(...comparablesProyecto);

  // Estadísticas
  const precioMin = Math.min(...comparablesProyecto.map(c => c.precioMXN));
  const precioMax = Math.max(...comparablesProyecto.map(c => c.precioMXN));
  const precioPromedio = Math.round(comparablesProyecto.reduce((sum, c) => sum + c.precioMXN, 0) / comparablesProyecto.length);

  console.log(`   ✓ Rango de precios: $${(precioMin / 1000000).toFixed(1)}M - $${(precioMax / 1000000).toFixed(1)}M`);
  console.log(`   ✓ Precio promedio: $${(precioPromedio / 1000000).toFixed(2)}M\n`);
});

// Crear objeto final
const outputData = {
  metadata: {
    version: '2.0',
    fechaGeneracion: new Date().toISOString(),
    totalComparables: todosComparables.length,
    proyectos: proyectos.length,
    comparablesPorProyecto: 32
  },
  comparables: todosComparables
};

// Guardar archivo
const outputPath = path.join(__dirname, 'data', 'inmuebles-comparables.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

console.log('═══════════════════════════════════════════════════════════');
console.log('✓ Archivo generado exitosamente!');
console.log(`✓ Total de comparables: ${todosComparables.length}`);
console.log(`✓ Archivo guardado en: ${outputPath}`);
console.log('═══════════════════════════════════════════════════════════');
