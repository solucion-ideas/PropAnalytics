/**
 * Script para reducir el dataset a solo 5 proyectos representativos
 */

const fs = require('fs');
const path = require('path');

// IDs de proyectos a mantener
const proyectosSeleccionados = [
  'mitikah',           // CDMX - Premium residencial
  'torre-koi',         // Monterrey - Residencial lujo
  'reforma-222',       // CDMX - Corporativo/Mixed use
  'andares-puerta-hierro', // Guadalajara - Residencial
  'shark-tower'        // Cancún - Turístico/Inversión
];

console.log('Simplificando proyecto a 5 proyectos seleccionados...\n');
console.log('Proyectos a mantener:', proyectosSeleccionados.join(', '));
console.log('');

// 1. Filtrar proyectos.json
console.log('[1/5] Filtrando proyectos.json...');
const proyectosPath = path.join(__dirname, 'data', 'proyectos.json');
const proyectosData = JSON.parse(fs.readFileSync(proyectosPath, 'utf8'));

const proyectosFiltrados = proyectosData.proyectos.filter(p =>
  proyectosSeleccionados.includes(p.id)
);

proyectosData.proyectos = proyectosFiltrados;
fs.writeFileSync(proyectosPath, JSON.stringify(proyectosData, null, 2), 'utf8');
console.log(`   ✓ Proyectos reducidos de ${proyectosData.proyectos.length + 10} a ${proyectosFiltrados.length}`);

// 2. Filtrar inmuebles-comparables.json
console.log('[2/5] Filtrando inmuebles-comparables.json...');
const comparablesPath = path.join(__dirname, 'data', 'inmuebles-comparables.json');
const comparablesData = JSON.parse(fs.readFileSync(comparablesPath, 'utf8'));

const comparablesFiltrados = comparablesData.comparables.filter(c =>
  proyectosSeleccionados.includes(c.proyectoId)
);

comparablesData.comparables = comparablesFiltrados;
comparablesData.metadata.totalComparables = comparablesFiltrados.length;
comparablesData.metadata.proyectos = proyectosFiltrados.length;

fs.writeFileSync(comparablesPath, JSON.stringify(comparablesData, null, 2), 'utf8');
console.log(`   ✓ Comparables reducidos a ${comparablesFiltrados.length}`);

// 3. Filtrar capas-informacion.json
console.log('[3/5] Filtrando capas-informacion.json...');
const capasPath = path.join(__dirname, 'data', 'capas-informacion.json');
const capasData = JSON.parse(fs.readFileSync(capasPath, 'utf8'));

const capasFiltradas = capasData.capas.filter(c =>
  proyectosSeleccionados.includes(c.proyectoId)
);

capasData.capas = capasFiltradas;
capasData.metadata.totalProyectos = proyectosFiltrados.length;

fs.writeFileSync(capasPath, JSON.stringify(capasData, null, 2), 'utf8');
console.log(`   ✓ Capas reducidas a ${capasFiltradas.length} proyectos`);

// 4. Filtrar poligonos.json
console.log('[4/5] Filtrando poligonos.json...');
const poligonosPath = path.join(__dirname, 'data', 'poligonos.json');
const poligonosData = JSON.parse(fs.readFileSync(poligonosPath, 'utf8'));

const poligonosFiltrados = poligonosData.poligonos.filter(p =>
  proyectosSeleccionados.includes(p.proyectoId)
);

poligonosData.poligonos = poligonosFiltrados;
poligonosData.metadata.totalPoligonos = poligonosFiltrados.length;
poligonosData.metadata.proyectos = proyectosFiltrados.length;

fs.writeFileSync(poligonosPath, JSON.stringify(poligonosData, null, 2), 'utf8');
console.log(`   ✓ Polígonos reducidos a ${poligonosFiltrados.length}`);

// 5. Filtrar analisis-mercado.json (si existe)
console.log('[5/5] Filtrando analisis-mercado.json...');
const analisisPath = path.join(__dirname, 'data', 'analisis-mercado.json');

if (fs.existsSync(analisisPath)) {
  const analisisData = JSON.parse(fs.readFileSync(analisisPath, 'utf8'));

  const nuevoAnalisis = {};
  proyectosSeleccionados.forEach(id => {
    if (analisisData.analisis[id]) {
      nuevoAnalisis[id] = analisisData.analisis[id];
    }
  });

  analisisData.analisis = nuevoAnalisis;
  analisisData.metadata.totalProyectos = proyectosFiltrados.length;

  fs.writeFileSync(analisisPath, JSON.stringify(analisisData, null, 2), 'utf8');
  console.log(`   ✓ Análisis de mercado reducido a ${Object.keys(nuevoAnalisis).length} proyectos`);
} else {
  console.log(`   ! Archivo analisis-mercado.json no encontrado (se generará después)`);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('✓ Simplificación completada!');
console.log('');
console.log('Resumen:');
console.log(`  • Proyectos: ${proyectosFiltrados.length}`);
console.log(`  • Comparables: ${comparablesFiltrados.length} (${Math.round(comparablesFiltrados.length / proyectosFiltrados.length)} por proyecto)`);
console.log(`  • POIs: ${capasFiltradas.reduce((sum, c) => sum + c.capas.reduce((s, capa) => s + capa.puntos.length, 0), 0)}`);
console.log(`  • Polígonos: ${poligonosFiltrados.length} (${Math.round(poligonosFiltrados.length / proyectosFiltrados.length)} por proyecto)`);
console.log('');
console.log('Proyectos seleccionados:');
proyectosFiltrados.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.nombre} (${p.ubicacion.ciudad})`);
});
console.log('═══════════════════════════════════════════════════════════');
