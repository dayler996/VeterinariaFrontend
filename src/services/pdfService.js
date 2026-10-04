import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCompanySettings } from './companyService';
import { getImageUrl } from '../utils/imageUtils';

/* ═══════════════════════════════════════════════════════════════
   PALETA Y CONSTANTES
   ═══════════════════════════════════════════════════════════════ */
const COLORS = {
  primary:     [37, 99, 235],    // #2563eb - Azul principal
  primaryDark: [30, 64, 175],    // #1e40af - Azul oscuro
  success:     [22, 163, 74],    // #16a34a - Verde
  danger:      [220, 38, 38],    // #dc2626 - Rojo
  warning:     [245, 158, 11],   // #f59e0b - Amarillo
  info:        [8, 145, 178],    // #0891b2 - Cian
  textDark:    [17, 24, 39],     // #111827 - Casi negro
  textMuted:   [107, 114, 128],  // #6b7280 - Gris
  textLight:   [156, 163, 175],  // #9ca3af - Gris claro
  border:      [229, 231, 235],  // #e5e7eb - Gris línea
  bgLight:     [249, 250, 251],  // #f9fafb - Fondo claro
  bgSection:   [243, 244, 246],  // #f3f4f6 - Fondo sección
  white:       [255, 255, 255],
};

const PAGE = {
  width: 210,        // A4 mm
  height: 297,
  marginLeft: 14,
  marginRight: 14,
  marginTop: 14,
  marginBottom: 22,
  contentWidth: 210 - 14 - 14, // = 182mm
};

/* Mapeo de estados a color semántico */
const ESTADOS_COLORES = {
  PAGADA: COLORS.success,
  PAGADO: COLORS.success,
  ACTIVO: COLORS.success,
  ACTIVA: COLORS.success,
  COMPLETADA: COLORS.success,
  COMPLETADO: COLORS.success,
  FINALIZADA: COLORS.success,
  ABONADA: COLORS.info,
  PENDIENTE: COLORS.warning,
  EN_PROCESO: COLORS.warning,
  ANULADA: COLORS.danger,
  ANULADO: COLORS.danger,
  CANCELADA: COLORS.danger,
  CANCELADO: COLORS.danger,
  INACTIVO: COLORS.textMuted,
  INACTIVA: COLORS.textMuted,
};

/* ═══════════════════════════════════════════════════════════════
   UTILIDADES
   ═══════════════════════════════════════════════════════════════ */

/** Convierte una URL a base64 (para meter imágenes en el PDF) */
const urlToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error al convertir URL a base64:', error);
    return null;
  }
};

/** Obtiene las dimensiones reales de una imagen en base64 */
const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = base64;
  });
};

/** Detecta el formato de imagen a partir del dataURL */
const detectImageFormat = (base64) => {
  if (!base64) return 'PNG';
  if (base64.includes('data:image/png')) return 'PNG';
  if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
  if (base64.includes('data:image/webp')) return 'WEBP';
  return 'PNG';
};

/** ¿El valor corresponde a un estado coloreable? */
const esEstadoColoreable = (valor) => {
  if (typeof valor !== 'string') return null;
  const clean = valor.trim().toUpperCase().replace(/\s+/g, '_');
  return ESTADOS_COLORES[clean] || null;
};

/** Espacio vertical garantizado, si no cabe → nueva página */
const ensureSpace = (doc, yPos, needed) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const limit = pageHeight - PAGE.marginBottom;
  if (yPos + needed > limit) {
    doc.addPage();
    return PAGE.marginTop + 5;
  }
  return yPos;
};

/* ═══════════════════════════════════════════════════════════════
   HEADER Y FOOTER
   ═══════════════════════════════════════════════════════════════ */

/**
 * Dibuja la cabecera con:
 * - Logo (si existe)
 * - Nombre de la empresa (grande, bold)
 * - Subtítulo
 * - Línea azul decorativa
 *
 * Devuelve la Y donde debe continuar el contenido.
 */
const dibujarHeader = async (doc, companyName, logoUrl) => {
  const yStart = PAGE.marginTop;
  const logoSize = 20;
  const logoX = PAGE.marginLeft;
  const textX = logoUrl ? logoX + logoSize + 5 : logoX;

  // Fondo blanco (por si acaso) + logo
  if (logoUrl) {
    try {
      const logoBase64 = await urlToBase64(getImageUrl(logoUrl));
      if (logoBase64) {
        const fmt = detectImageFormat(logoBase64);
        doc.addImage(logoBase64, fmt, logoX, yStart, logoSize, logoSize);
      }
    } catch (error) {
      console.error('Error cargando logo:', error);
    }
  }

  // Nombre empresa
  doc.setTextColor(...COLORS.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(companyName || 'Veterinaria', textX, yStart + 8);

  // Subtítulo
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Sistema de Gestión Veterinaria', textX, yStart + 15);

  // Línea decorativa: 2px gris + 1px azul
  const lineY = yStart + logoSize + 3;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginLeft, lineY, PAGE.width - PAGE.marginRight, lineY);

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(PAGE.marginLeft, lineY, PAGE.marginLeft + 30, lineY);

  return lineY + 8;
};

/**
 * Dibuja la banda con el título del documento:
 * - Fondo gris muy claro
 * - Título azul oscuro grande
 * - Fecha de generación
 */
const dibujarTituloDocumento = (doc, title, yPos) => {
  const boxHeight = 16;
  const boxWidth = PAGE.contentWidth;

  // Fondo de la banda
  doc.setFillColor(...COLORS.bgSection);
  doc.roundedRect(PAGE.marginLeft, yPos, boxWidth, boxHeight, 2, 2, 'F');

  // Barra azul a la izquierda
  doc.setFillColor(...COLORS.primary);
  doc.rect(PAGE.marginLeft, yPos, 1.5, boxHeight, 'F');

  // Título
  doc.setTextColor(...COLORS.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, PAGE.marginLeft + 5, yPos + 7);

  // Fecha
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Generado el ${new Date().toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })}`,
    PAGE.marginLeft + 5,
    yPos + 12.5
  );

  return yPos + boxHeight + 6;
};

/**
 * Dibuja el footer en TODAS las páginas al final.
 */
const dibujarFooterTodasPaginas = (doc, companyName) => {
  const totalPages = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 10;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Línea superior
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginLeft, footerY - 5, PAGE.width - PAGE.marginRight, footerY - 5);

    // Texto izquierda: nombre empresa
    doc.setTextColor(...COLORS.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(companyName || 'Veterinaria', PAGE.marginLeft, footerY);

    // Texto centro: fecha de generación
    doc.setTextColor(...COLORS.textLight);
    const fechaGen = `Generado el ${new Date().toLocaleDateString('es-ES')}`;
    const fechaWidth = doc.getTextWidth(fechaGen);
    doc.text(fechaGen, (PAGE.width - fechaWidth) / 2, footerY);

    // Texto derecha: página X de Y
    doc.setTextColor(...COLORS.textMuted);
    const pageText = `Página ${i} de ${totalPages}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, PAGE.width - PAGE.marginRight - pageTextWidth, footerY);
  }
};

/* ═══════════════════════════════════════════════════════════════
   ESTILOS DE TABLAS
   ═══════════════════════════════════════════════════════════════ */

/** Estilo base para autoTable, coherente con el resto del sistema */
const getTableStyles = () => ({
  theme: 'plain',
  styles: {
    font: 'helvetica',
    fontSize: 9,
    cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
    textColor: COLORS.textDark,
    lineColor: COLORS.border,
    lineWidth: 0,
  },
  headStyles: {
    fillColor: COLORS.primary,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 9,
    cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    lineWidth: 0,
  },
  bodyStyles: {
    lineWidth: 0,
  },
  alternateRowStyles: {
    fillColor: COLORS.bgLight,
  },
});

/** Estilo para keyValue (sin header, tipo "ficha") */
const getKeyValueStyles = () => ({
  theme: 'plain',
  styles: {
    font: 'helvetica',
    fontSize: 9.5,
    cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    textColor: COLORS.textDark,
    lineColor: COLORS.border,
    lineWidth: 0,
  },
  bodyStyles: {
    lineWidth: 0,
  },
  alternateRowStyles: {
    fillColor: COLORS.bgLight,
  },
});

/* ═══════════════════════════════════════════════════════════════
   PROCESADORES DE SECCIÓN
   ═══════════════════════════════════════════════════════════════ */

/** Sección tipo "keyValue": tabla sin header, con labels y valores */
const renderKeyValue = (doc, section, yPos) => {
  const body = section.content.map(([key, value]) => [
    String(key ?? ''),
    value !== undefined && value !== null && value !== '' ? String(value) : '—',
  ]);

  autoTable(doc, {
    ...getKeyValueStyles(),
    startY: yPos,
    body,
    margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        textColor: COLORS.textMuted,
        cellWidth: 55,
        fontSize: 8.5,
      },
      1: {
        textColor: COLORS.textDark,
        cellWidth: 'auto',
      },
    },
    didParseCell: (data) => {
      // Si el valor corresponde a un estado, colorearlo
      if (data.section === 'body' && data.column.index === 1) {
        const color = esEstadoColoreable(data.cell.raw);
        if (color) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  return doc.lastAutoTable.finalY + 6;
};

/** Sección tipo "table": tabla estándar con header */
const renderTable = (doc, section, yPos) => {
  autoTable(doc, {
    ...getTableStyles(),
    startY: yPos,
    head: [section.headers],
    body: section.data,
    margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    didParseCell: (data) => {
      // Colorear estados en el body
      if (data.section === 'body') {
        const color = esEstadoColoreable(data.cell.raw);
        if (color) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Alinear a la derecha las columnas con números (heurística)
      if (data.section === 'body' && typeof data.cell.raw === 'number') {
        data.cell.styles.halign = 'right';
      }
    },
  });

  return doc.lastAutoTable.finalY + 6;
};

/** Sección tipo "text": párrafo libre */
const renderText = (doc, section, yPos) => {
  doc.setTextColor(...COLORS.textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(section.content, PAGE.contentWidth);
  doc.text(lines, PAGE.marginLeft, yPos);
  return yPos + lines.length * 5 + 4;
};

/** Sección tipo "image": imagen al ancho completo */
const renderImage = async (doc, section, yPos) => {
  try {
    const imgBase64 = await urlToBase64(section.content);
    if (!imgBase64) {
      doc.setTextColor(...COLORS.textMuted);
      doc.setFontSize(9);
      doc.text('(No se pudo cargar la imagen)', PAGE.marginLeft, yPos);
      return yPos + 6;
    }

    const dims = await getImageDimensions(imgBase64);
    const maxWidth = PAGE.contentWidth;
    const maxHeight = doc.internal.pageSize.getHeight() - yPos - PAGE.marginBottom - 10;

    let w = dims.width;
    let h = dims.height;
    if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
    if (h > maxHeight) { w = (maxHeight / h) * w; h = maxHeight; }

    const fmt = detectImageFormat(imgBase64);
    doc.addImage(imgBase64, fmt, PAGE.marginLeft, yPos, w, h);
    return yPos + h + 6;
  } catch (error) {
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(9);
    doc.text('(Error al cargar la imagen)', PAGE.marginLeft, yPos);
    return yPos + 6;
  }
};

/** Sección tipo "centeredImage": título centrado + imagen centrada */
const renderCenteredImage = async (doc, section, yPos) => {
  // Título centrado
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const pageWidth = doc.internal.pageSize.getWidth();
  const titleWidth = doc.getTextWidth(section.title);
  doc.text(section.title, (pageWidth - titleWidth) / 2, yPos);
  yPos += 8;

  try {
    const imgBase64 = await urlToBase64(section.content);
    if (!imgBase64) {
      doc.setTextColor(...COLORS.textMuted);
      doc.setFontSize(9);
      doc.text('(No se pudo cargar la imagen)', PAGE.marginLeft, yPos);
      return yPos + 6;
    }

    const dims = await getImageDimensions(imgBase64);
    const maxWidth = PAGE.contentWidth;
    const maxHeight = doc.internal.pageSize.getHeight() - yPos - PAGE.marginBottom - 10;

    let w = dims.width;
    let h = dims.height;
    if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
    if (h > maxHeight) { w = (maxHeight / h) * w; h = maxHeight; }

    const x = (pageWidth - w) / 2;
    const fmt = detectImageFormat(imgBase64);
    doc.addImage(imgBase64, fmt, x, yPos, w, h);
    return yPos + h + 6;
  } catch (error) {
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(9);
    doc.text('(Error al cargar la imagen)', PAGE.marginLeft, yPos);
    return yPos + 6;
  }
};

/* ═══════════════════════════════════════════════════════════════
   GENERADOR BASE (API pública interna)
   ═══════════════════════════════════════════════════════════════ */

const generarPDFBase = async (title, sections, estilos = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Obtener datos de la empresa
  let companyName = 'Veterinaria';
  let logoUrl = null;
  try {
    const settings = await getCompanySettings();
    companyName = settings?.name || companyName;
    logoUrl = settings?.logo || null;
  } catch (e) {
    console.error('Error obteniendo settings:', e);
  }

  // ── 1. Cabecera ──
  let yPos = await dibujarHeader(doc, companyName, logoUrl);

  // ── 2. Banda con el título ──
  yPos = dibujarTituloDocumento(doc, title, yPos);

  // ── 3. Secciones ──
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Salto de página manual solicitado
    if (section.pageBreak) {
      doc.addPage();
      yPos = PAGE.marginTop + 5;
    }

    // Espacio mínimo para el título de la sección
    if (section.type !== 'centeredImage') {
      yPos = ensureSpace(doc, yPos, 20);

      // Título de sección con barra azul
      doc.setFillColor(...COLORS.primary);
      doc.rect(PAGE.marginLeft, yPos - 3.5, 1.2, 4, 'F');

      doc.setTextColor(...COLORS.primaryDark);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(section.title, PAGE.marginLeft + 4, yPos);
      yPos += 6;
    }

    // Contenido según tipo
    switch (section.type) {
      case 'keyValue':
        yPos = renderKeyValue(doc, section, yPos);
        break;
      case 'table':
        yPos = renderTable(doc, section, yPos);
        break;
      case 'text':
        yPos = renderText(doc, section, yPos);
        break;
      case 'image':
        yPos = await renderImage(doc, section, yPos);
        break;
      case 'centeredImage':
        yPos = await renderCenteredImage(doc, section, yPos);
        break;
      default:
        // Tipo desconocido → lo tratamos como texto
        if (typeof section.content === 'string') {
          yPos = renderText(doc, section, yPos);
        }
    }

    // Espacio extra entre secciones
    yPos += 2;
  }

  // ── 4. Footer en todas las páginas ──
  dibujarFooterTodasPaginas(doc, companyName);

  // ── 5. Abrir en nueva pestaña ──
  window.open(doc.output('bloburl'), '_blank');
};

/* ═══════════════════════════════════════════════════════════════
   API PÚBLICA — Funciones específicas
   ═══════════════════════════════════════════════════════════════ */

export const generateFacturaPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateConsultaPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateVacunacionPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateEstudioPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateOperacionPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateEsteticaPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateHospitalizacionPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateMonitoreoPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateHistorialMedicoPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);

export const generateHistorialFacturasPDF = async (title, sections, estilos) =>
  generarPDFBase(title, sections, estilos);