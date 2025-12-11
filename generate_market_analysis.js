/**
 * Script para generar datos de análisis de mercado inmobiliario
 * Incluye: tendencias de precios, inventario, DOM, predicciones y ROI
 */

const fs = require('fs');
const path = require('path');

// Cargar datos de proyectos
const proyectosPath = path.join(__dirname, 'data', 'proyectos.json');
const proyectosData = JSON.parse(fs.readFileSync(proyectosPath, 'utf8'));
const proyectos = proyectosData.proyectos;

// Función para generar datos históricos de precios (últimos 24 meses)
function generatePriceHistory(precioActual, volatilidad = 0.08) {
  const meses = [];
  const now = new Date();

  // Generar tendencia alcista realista (3-8% anual)
  const tendenciaAnual = 0.03 + Math.random() * 0.05;
  const tendenciaMensual = tendenciaAnual / 12;

  for (let i = 23; i >= 0; i--) {
    const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);

    // Precio base con tendencia
    const factorTendencia = Math.pow(1 + tendenciaMensual, i);
    const precioBase = precioActual / factorTendencia;

    // Agregar volatilidad (variación mensual)
    const variacion = (Math.random() - 0.5) * volatilidad;
    const precio = Math.round(precioBase * (1 + variacion));

    // Generar DOM (días en mercado) - inversamente proporcional a la velocidad de venta
    const velocidadMercado = 0.7 + Math.random() * 0.6; // 0.7 a 1.3
    const dom = Math.round(60 / velocidadMercado + (Math.random() - 0.5) * 20);

    // Inventario disponible (unidades)
    const inventarioBase = 8 + Math.random() * 15;
    const inventario = Math.round(inventarioBase * (1 + Math.sin(i / 3) * 0.3));

    // Ventas del mes
    const ventasMes = Math.round(3 + Math.random() * 8);

    meses.push({
      fecha: fecha.toISOString().split('T')[0],
      mes: fecha.toLocaleString('es-MX', { month: 'short', year: '2-digit' }),
      precioPromedioM2: precio,
      dom: Math.max(15, Math.min(120, dom)),
      inventarioDisponible: Math.max(1, inventario),
      ventasMes: ventasMes,
      absorcionMensual: parseFloat((ventasMes / inventario * 100).toFixed(1)),
      precioMinimo: Math.round(precio * 0.92),
      precioMaximo: Math.round(precio * 1.08)
    });
  }

  return meses;
}

// Función para calcular predicción de precios (próximos 12 meses)
function generatePriceForecast(historico) {
  const prediccion = [];
  const ultimoMes = historico[historico.length - 1];
  const ultimoPrecio = ultimoMes.precioPromedioM2;

  // Calcular tendencia de los últimos 6 meses
  const ultimos6Meses = historico.slice(-6);
  const preciosUltimos6 = ultimos6Meses.map(m => m.precioPromedioM2);
  const tendencia6Meses = (preciosUltimos6[5] - preciosUltimos6[0]) / preciosUltimos6[0];
  const tendenciaMensual = tendencia6Meses / 6;

  // Proyectar próximos 12 meses
  const now = new Date();
  for (let i = 1; i <= 12; i++) {
    const fecha = new Date(now.getFullYear(), now.getMonth() + i, 1);

    // Precio predicho con tendencia suavizada
    const factorCrecimiento = 1 + (tendenciaMensual * 0.8); // Suavizar 20%
    const precioPredecido = Math.round(ultimoPrecio * Math.pow(factorCrecimiento, i));

    // Rango de confianza (±5%)
    const rangoConfianza = precioPredecido * 0.05;

    prediccion.push({
      fecha: fecha.toISOString().split('T')[0],
      mes: fecha.toLocaleString('es-MX', { month: 'short', year: '2-digit' }),
      precioPredichoM2: precioPredecido,
      rangoMinimo: Math.round(precioPredecido - rangoConfianza),
      rangoMaximo: Math.round(precioPredecido + rangoConfianza),
      confianza: Math.max(60, 95 - i * 2) // Disminuye con el tiempo
    });
  }

  return prediccion;
}

// Función para generar métricas de inversión
function generateInvestmentMetrics(proyecto, historico) {
  const precioM2 = proyecto.departamentos.precioM2Promedio;
  const superficiePromedio = 85 + Math.random() * 45; // 85-130 m2
  const precioPropiedad = Math.round(precioM2 * superficiePromedio);

  // Ingresos por alquiler (0.4% - 0.7% del valor mensual)
  const tasaAlquiler = 0.004 + Math.random() * 0.003;
  const alquilerMensual = Math.round(precioPropiedad * tasaAlquiler);
  const alquilerAnual = alquilerMensual * 12;

  // Gastos operativos (25-35% del ingreso bruto)
  const gastosOperativos = Math.round(alquilerAnual * (0.25 + Math.random() * 0.1));
  const ingresoNeto = alquilerAnual - gastosOperativos;

  // ROI y CAP Rate
  const roi = parseFloat((ingresoNeto / precioPropiedad * 100).toFixed(2));
  const capRate = roi; // Simplificado

  // Apreciación anual (de tendencia histórica)
  const precioHace12Meses = historico[12].precioPromedioM2;
  const apreciacionAnual = parseFloat(((precioM2 - precioHace12Meses) / precioHace12Meses * 100).toFixed(2));

  // Rendimiento total (ROI + Apreciación)
  const rendimientoTotal = parseFloat((roi + apreciacionAnual).toFixed(2));

  // Tiempo de recuperación
  const paybackYears = parseFloat((precioPropiedad / ingresoNeto).toFixed(1));

  // Ocupación promedio (85-97%)
  const tasaOcupacion = 85 + Math.random() * 12;

  return {
    inversion: {
      superficieM2: Math.round(superficiePromedio),
      precioM2: precioM2,
      precioTotal: precioPropiedad,
      enganche20: Math.round(precioPropiedad * 0.2),
      financiamiento80: Math.round(precioPropiedad * 0.8)
    },
    alquiler: {
      alquilerMensual: alquilerMensual,
      alquilerAnual: alquilerAnual,
      tasaOcupacion: parseFloat(tasaOcupacion.toFixed(1)),
      ingresoNetoAnual: ingresoNeto,
      gastosOperativos: gastosOperativos,
      desglose: {
        mantenimiento: Math.round(gastosOperativos * 0.35),
        administracion: Math.round(gastosOperativos * 0.25),
        seguros: Math.round(gastosOperativos * 0.20),
        impuestos: Math.round(gastosOperativos * 0.20)
      }
    },
    rendimiento: {
      roi: roi,
      capRate: capRate,
      apreciacionAnual: apreciacionAnual,
      rendimientoTotal: rendimientoTotal,
      paybackYears: paybackYears,
      valorProyectado5Anos: Math.round(precioPropiedad * Math.pow(1 + apreciacionAnual/100, 5))
    },
    metricas: {
      velocidadVenta: parseFloat((3 + Math.random() * 4).toFixed(1)), // unidades/mes
      absorcionMercado: parseFloat((15 + Math.random() * 25).toFixed(1)), // %
      precioCompetitivo: precioM2 < proyecto.departamentos.precioM2Promedio * 1.1 ? 'Alto' : 'Medio'
    }
  };
}

// Función para generar análisis de competencia
function generateCompetitionAnalysis(proyecto) {
  const competidores = [];
  const numCompetidores = 4 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numCompetidores; i++) {
    const variacionPrecio = -0.15 + Math.random() * 0.3;
    const precioCompetidor = Math.round(proyecto.departamentos.precioM2Promedio * (1 + variacionPrecio));

    competidores.push({
      nombre: `Proyecto ${String.fromCharCode(65 + i)}`,
      distanciaKm: parseFloat((0.5 + Math.random() * 2.5).toFixed(1)),
      precioM2: precioCompetidor,
      unidadesDisponibles: Math.round(5 + Math.random() * 30),
      entrega: `${2025 + Math.floor(Math.random() * 3)}`,
      amenidadesScore: Math.round(60 + Math.random() * 35)
    });
  }

  return competidores.sort((a, b) => a.distanciaKm - b.distanciaKm);
}

// Generar análisis para cada proyecto
console.log('Generando análisis de mercado inmobiliario...\n');

const analisisMercado = {};

proyectos.forEach((proyecto, index) => {
  console.log(`[${index + 1}/${proyectos.length}] Generando análisis para: ${proyecto.nombre}`);

  const precioM2 = proyecto.departamentos.precioM2Promedio;
  const historico = generatePriceHistory(precioM2);
  const prediccion = generatePriceForecast(historico);
  const metricas = generateInvestmentMetrics(proyecto, historico);
  const competencia = generateCompetitionAnalysis(proyecto);

  // Calcular métricas de mercado actuales
  const ultimoMes = historico[historico.length - 1];
  const mesAnterior = historico[historico.length - 2];
  const hace12Meses = historico[12];

  const variacionMensual = ((ultimoMes.precioPromedioM2 - mesAnterior.precioPromedioM2) / mesAnterior.precioPromedioM2 * 100).toFixed(2);
  const variacionAnual = ((ultimoMes.precioPromedioM2 - hace12Meses.precioPromedioM2) / hace12Meses.precioPromedioM2 * 100).toFixed(2);

  analisisMercado[proyecto.id] = {
    proyectoId: proyecto.id,
    proyectoNombre: proyecto.nombre,

    // Resumen ejecutivo
    resumen: {
      precioActualM2: precioM2,
      variacionMensual: parseFloat(variacionMensual),
      variacionAnual: parseFloat(variacionAnual),
      domPromedio: ultimoMes.dom,
      inventarioActual: ultimoMes.inventarioDisponible,
      tendencia: parseFloat(variacionAnual) > 0 ? 'Alcista' : 'Bajista',
      recomendacion: metricas.rendimiento.roi > 6 ? 'Compra' : 'Espera'
    },

    // Histórico de precios (24 meses)
    historicoPrecio: historico,

    // Predicción (12 meses)
    prediccionPrecio: prediccion,

    // Métricas de inversión
    inversion: metricas,

    // Análisis de competencia
    competencia: competencia,

    // Indicadores de mercado
    indicadores: {
      ofertaDemanda: {
        mesesInventario: parseFloat((ultimoMes.inventarioDisponible / ultimoMes.ventasMes).toFixed(1)),
        clasificacion: ultimoMes.inventarioDisponible / ultimoMes.ventasMes < 6 ? 'Vendedor' : 'Comprador',
        velocidadVenta: ultimoMes.ventasMes,
        absorcion: ultimoMes.absorcionMensual
      },
      liquidez: {
        dom: ultimoMes.dom,
        clasificacion: ultimoMes.dom < 45 ? 'Alta' : ultimoMes.dom < 75 ? 'Media' : 'Baja',
        comparativaZona: ultimoMes.dom - 5 + Math.random() * 10
      },
      valoracion: {
        precioM2Zona: Math.round(precioM2 * (0.95 + Math.random() * 0.1)),
        posicionamiento: precioM2 > (precioM2 * 1.05) ? 'Premium' : 'Competitivo',
        score: Math.round(70 + Math.random() * 25)
      }
    }
  };

  console.log(`   ✓ Histórico: ${historico.length} meses`);
  console.log(`   ✓ Predicción: ${prediccion.length} meses`);
  console.log(`   ✓ ROI: ${metricas.rendimiento.roi}%`);
  console.log(`   ✓ Competidores: ${competencia.length}\n`);
});

// Crear objeto final
const outputData = {
  metadata: {
    version: '1.0',
    fechaGeneracion: new Date().toISOString(),
    totalProyectos: proyectos.length,
    periodoHistorico: '24 meses',
    periodoPrediccion: '12 meses',
    descripcion: 'Análisis completo de mercado inmobiliario con tendencias, predicciones y métricas de inversión'
  },
  analisis: analisisMercado
};

// Guardar archivo
const outputPath = path.join(__dirname, 'data', 'analisis-mercado.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

console.log('═══════════════════════════════════════════════════════════');
console.log('✓ Análisis de mercado generado exitosamente!');
console.log(`✓ Proyectos analizados: ${proyectos.length}`);
console.log(`✓ Datos históricos: 24 meses por proyecto`);
console.log(`✓ Predicciones: 12 meses por proyecto`);
console.log(`✓ Archivo guardado en: ${outputPath}`);
console.log('═══════════════════════════════════════════════════════════');
console.log('\nDatos generados:');
console.log('- Tendencias de precios (histórico + predicción)');
console.log('- Días en mercado (DOM)');
console.log('- Análisis de inventario (oferta/demanda)');
console.log('- ROI y rendimientos de alquiler');
console.log('- Análisis de competencia');
console.log('- Métricas de valoración');
