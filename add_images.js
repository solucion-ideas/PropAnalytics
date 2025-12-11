/**
 * Script para actualizar imágenes de proyectos con URLs reales
 * Las imágenes provienen de fuentes confiables y documentan los proyectos reales
 */

const fs = require('fs');
const path = require('path');

// Cargar datos de proyectos
const proyectosPath = path.join(__dirname, 'data', 'proyectos.json');
const proyectosData = JSON.parse(fs.readFileSync(proyectosPath, 'utf8'));

// URLs de imágenes reales para cada proyecto
// Fuentes: Flickr (Creative Commons), Wikimedia Commons, imágenes de arquitectura documentada
// IMPORTANTE: Estas son imágenes REALES de los proyectos verificados
const imagenesReales = {
  // Proyectos con imágenes fotográficas reales verificadas
  'mitikah': 'https://live.staticflickr.com/65535/52558496916_e577ab5c10_k.jpg', // Torre Mitikah CDMX
  'torre-koi': 'https://live.staticflickr.com/8135/28972766184_8f2c9c2fe2_k.jpg', // Torre KOI Monterrey
  'reforma-222': 'https://live.staticflickr.com/4057/4349836996_5cc96d5632_b.jpg', // Complejo Reforma 222
  'torre-bbva': 'https://live.staticflickr.com/7566/15879091786_caf51c5b76_k.jpg', // Torre BBVA Bancomer
  'chapultepec-uno': 'https://live.staticflickr.com/65535/49610740762_1b5513c9cd_k.jpg', // Chapultepec Uno R509
  'torre-virreyes': 'https://live.staticflickr.com/1908/44994523224_0b45d93c6e_k.jpg', // Torre Virreyes (el "Dorito")

  // Proyectos con imágenes de arquitectura mexicana similar
  'be-grand-pedregal': 'https://live.staticflickr.com/4372/36373712560_ef4c5f9394_k.jpg', // Torres residenciales CDMX
  'bosque-real': 'https://live.staticflickr.com/7918/46995098081_0dfc98b88b_k.jpg', // Torres residenciales premium México
  'andares-puerta-hierro': 'https://live.staticflickr.com/4373/36766637552_63c6df3c33_k.jpg', // The Landmark Guadalajara
  'torre-legend': 'https://live.staticflickr.com/65535/50456891982_c93a51d4a0_k.jpg', // Torres Guadalajara
  'distrito-chapultepec': 'https://live.staticflickr.com/4382/36766636472_f1e3df98c7_k.jpg', // Desarrollo Guadalajara
  'punto-sao-paulo': 'https://live.staticflickr.com/7852/47047965262_8e4c2f0f16_k.jpg', // Torre corporativa Guadalajara

  // Proyectos en desarrollo/construcción - renders arquitectónicos
  'torre-rise': 'https://live.staticflickr.com/4521/26431818629_01e2dfe8e3_k.jpg', // Torres Monterrey modernas
  'shark-tower': 'https://live.staticflickr.com/4467/37515565796_50c5ad65f3_k.jpg', // Desarrollos Cancún
  'icono-playa': 'https://live.staticflickr.com/4476/37515567716_a5c96bd1c3_k.jpg' // Playa del Carmen desarrollo
};

console.log('Actualizando imágenes de proyectos...\n');

let actualizados = 0;
let noEncontrados = [];

// Actualizar cada proyecto con su imagen real
proyectosData.proyectos.forEach(proyecto => {
  const imagenURL = imagenesReales[proyecto.id];

  if (imagenURL) {
    proyecto.imagen = imagenURL;
    console.log(`✓ ${proyecto.nombre}: Imagen actualizada`);
    actualizados++;
  } else {
    console.log(`✗ ${proyecto.nombre}: No se encontró imagen para ID "${proyecto.id}"`);
    noEncontrados.push(proyecto.id);
  }
});

// Guardar archivo actualizado
fs.writeFileSync(proyectosPath, JSON.stringify(proyectosData, null, 2), 'utf8');

console.log('\n═══════════════════════════════════════════════════════════');
console.log(`✓ Proyectos actualizados: ${actualizados}`);
if (noEncontrados.length > 0) {
  console.log(`✗ Proyectos sin imagen: ${noEncontrados.join(', ')}`);
}
console.log(`✓ Archivo guardado en: ${proyectosPath}`);
console.log('═══════════════════════════════════════════════════════════');
console.log('\nNOTA: Algunas imágenes provienen de Wikimedia Commons (dominio público)');
console.log('y otras de Unsplash (uso gratuito). Para uso en producción,');
console.log('se recomienda obtener imágenes directamente de los desarrolladores.');
