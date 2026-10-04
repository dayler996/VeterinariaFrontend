// frontend/src/services/pdfService.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCompanySettings } from './companyService';
import { getImageUrl } from '../utils/imageUtils';

/* ═══════════════════════════════════════════════════════════════
   PALETA PROFESIONAL
   ═══════════════════════════════════════════════════════════════ */
const COLORS = {
  primary:      [30, 58, 138],    // #1e3a8a - navy
  primarySoft:  [59, 130, 246],   // #3b82f6
  primaryLight: [219, 234, 254],  // #dbeafe

  success:      [21, 128, 61],
  warning:      [161, 98, 7],
  danger:       [185, 28, 28],
  info:         [15, 118, 110],

  ink:          [15, 23, 42],
  inkSoft:      [51, 65, 85],
  muted:        [100, 116, 139],
  mutedLight:   [148, 163, 184],
  border:       [226, 232, 240],
  borderSoft:   [241, 245, 249],
  bg:           [248, 250, 252],
  bgSoft:       [241, 245, 249],
  white:        [255, 255, 255],
};

const PAGE = {
  width: 210,
  height: 297,
  marginLeft: 14,
  marginRight: 14,
  marginTop: 12,
  marginBottom: 18,
  contentWidth: 210 - 14 - 14, // = 182mm
};

const ESTADOS_COLORES = {
  PAGADA: COLORS.success, PAGADO: COLORS.success,
  ACTIVO: COLORS.success, ACTIVA: COLORS.success,
  COMPLETADA: COLORS.success, COMPLETADO: COLORS.success,
  FINALIZADA: COLORS.success, FINALIZADO: COLORS.success,
  ABONADA: COLORS.info, ABONADO: COLORS.info,
  PENDIENTE: COLORS.warning, EN_PROCESO: COLORS.warning, EN_CURSO: COLORS.warning,
  ANULADA: COLORS.danger, ANULADO: COLORS.danger,
  CANCELADA: COLORS.danger, CANCELADO: COLORS.danger,
  VENCIDO: COLORS.danger, VENCIDA: COLORS.danger,
  INACTIVO: COLORS.muted, INACTIVA: COLORS.muted,
};

/* ═══════════════════════════════════════════════════════════════
   UTILIDADES
   ═══════════════════════════════════════════════════════════════ */
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

const getImageDimensions = (base64) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = base64;
  });

const detectImageFormat = (base64) => {
  if (!base64) return 'PNG';
  if (base64.includes('data:image/png')) return 'PNG';
  if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
  if (base64.includes('data:image/webp')) return 'WEBP';
  return 'PNG';
};

const esEstadoColoreable = (valor) => {
  if (typeof valor !== 'string') return null;
  const clean = valor.trim().toUpperCase().replace(/\s+/g, '_');
  return ESTADOS_COLORES[clean] || null;
};

const ensureSpace = (doc, yPos, needed) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const limit = pageHeight - PAGE.marginBottom;
  if (yPos + needed > limit) {
    doc.addPage();
    return PAGE.marginTop + 3;
  }
  return yPos;
};

const generarDocId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `DOC-${year}-${rand}`;
};

/* ═══════════════════════════════════════════════════════════════
   HEADER COMPACTO (membrete)
   ═══════════════════════════════════════════════════════════════ */
const dibujarHeader = async (doc, companyName, logoUrl, docId) => {
  const yStart = PAGE.marginTop;
  const logoSize = 14;                 // ← era 18
  const logoX = PAGE.marginLeft;
  const textX = logoUrl ? logoX + logoSize + 5 : logoX;

  // Logo con marco
  if (logoUrl) {
    try {
      const logoBase64 = await urlToBase64(getImageUrl(logoUrl));
      if (logoBase64) {
        doc.setFillColor(...COLORS.bgSoft);
        doc.roundedRect(logoX - 1, yStart - 1, logoSize + 2, logoSize + 2, 1.5, 1.5, 'F');
        const fmt = detectImageFormat(logoBase64);
        doc.addImage(logoBase64, fmt, logoX, yStart, logoSize, logoSize);
      }
    } catch (error) {
      console.error('Error cargando logo:', error);
    }
  }

  // Nombre empresa
  doc.setTextColor(...COLORS.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);                 // ← era 16
  doc.text(companyName || 'Veterinaria', textX, yStart + 5.5);

  // Subtítulo
  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);                // ← era 8.5
  doc.text('Sistema de Gestión Veterinaria', textX, yStart + 10.5);

  // Doc ID + fecha a la derecha
  doc.setTextColor(...COLORS.mutedLight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const docIdText = `Ref: ${docId}`;
  const docIdWidth = doc.getTextWidth(docIdText);
  doc.text(docIdText, PAGE.width - PAGE.marginRight - docIdWidth, yStart + 5.5);

  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const fechaWidth = doc.getTextWidth(fecha);
  doc.text(fecha, PAGE.width - PAGE.marginRight - fechaWidth, yStart + 10.5);

  // Línea decorativa
  const lineY = yStart + logoSize + 3.5;

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(PAGE.marginLeft, lineY, PAGE.width - PAGE.marginRight, lineY);

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.7);
  doc.line(PAGE.marginLeft, lineY, PAGE.marginLeft + 32, lineY);

  return lineY + 5;                    // ← era +8
};

/* ═══════════════════════════════════════════════════════════════
   TÍTULO COMPACTO (banda)
   ═══════════════════════════════════════════════════════════════ */
const dibujarTituloDocumento = (doc, title, yPos) => {
  const boxHeight = 13;                // ← era 18
  const boxWidth = PAGE.contentWidth;

  doc.setFillColor(...COLORS.primary);
  doc.rect(PAGE.marginLeft, yPos, boxWidth, boxHeight, 'F');

  doc.setFillColor(...COLORS.primarySoft);
  doc.rect(PAGE.marginLeft, yPos, boxWidth, 0.6, 'F');

  // Título + fecha en la MISMA fila (más compacto)
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);                 // ← era 15
  doc.text(title, PAGE.marginLeft + 5, yPos + 8.5);

  // Fecha a la derecha, dentro de la banda
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(219, 234, 254);
  const fecha = new Date().toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const fechaWidth = doc.getTextWidth(fecha);
  doc.text(fecha, PAGE.width - PAGE.marginRight - 4 - fechaWidth, yPos + 8.5);

  return yPos + boxHeight + 5;         // ← era +8
};

/* ═══════════════════════════════════════════════════════════════
   FOOTER COMPACTO
   ═══════════════════════════════════════════════════════════════ */
const dibujarFooterTodasPaginas = (doc, companyName) => {
  const totalPages = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 8;      // ← más cerca del borde

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.15);
    doc.line(PAGE.marginLeft, footerY - 4, PAGE.width - PAGE.marginRight, footerY - 4);

    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(companyName || 'Veterinaria', PAGE.marginLeft, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.mutedLight);
    const centerText = 'Generado automáticamente';
    const centerWidth = doc.getTextWidth(centerText);
    doc.text(centerText, (PAGE.width - centerWidth) / 2, footerY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.inkSoft);
    const pageText = `${i} / ${totalPages}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, PAGE.width - PAGE.marginRight - pageTextWidth, footerY);
  }
};

/* ═══════════════════════════════════════════════════════════════
   ESTILOS DE TABLAS (COMPACTOS)
   ═══════════════════════════════════════════════════════════════ */
const getTableStyles = () => ({
  theme: 'grid',
  styles: {
    font: 'helvetica',
    fontSize: 8,                       // ← era 9
    cellPadding: { top: 1.8, right: 3, bottom: 1.8, left: 3 },  // ← era 3/4/3/4
    textColor: COLORS.ink,
    lineColor: COLORS.border,
    lineWidth: 0.1,
    valign: 'middle',
    overflow: 'linebreak',
  },
  headStyles: {
    fillColor: COLORS.primary,
    textColor: COLORS.white,
    fontStyle: 'bold',
    fontSize: 8,                       // ← era 9
    cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },      // ← era 3.5/4/3.5/4
    lineWidth: 0,
  },
  bodyStyles: {
    lineWidth: 0.1,
    lineColor: COLORS.border,
  },
  alternateRowStyles: {
    fillColor: COLORS.bg,
  },
});

const getKeyValueStyles = () => ({
  theme: 'plain',
  styles: {
    font: 'helvetica',
    fontSize: 8.5,                     // ← era 9.5
    cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },      // ← era 3.5/4/3.5/4
    textColor: COLORS.ink,
    lineColor: COLORS.border,
    lineWidth: 0,
    valign: 'middle',
    overflow: 'linebreak',
  },
  bodyStyles: {
    lineWidth: 0,
  },
  alternateRowStyles: {
    fillColor: COLORS.bg,
  },
});

/* ═══════════════════════════════════════════════════════════════
   RENDERS DE SECCIÓN (COMPACTOS)
   ═══════════════════════════════════════════════════════════════ */
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
        textColor: COLORS.muted,
        cellWidth: 48,                 // ← era 55
        fontSize: 8,
      },
      1: {
        textColor: COLORS.ink,
        cellWidth: 'auto',
      },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const color = esEstadoColoreable(data.cell.raw);
        if (color) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  return doc.lastAutoTable.finalY + 4;  // ← era +6
};

const renderTable = (doc, section, yPos) => {
  autoTable(doc, {
    ...getTableStyles(),
    startY: yPos,
    head: [section.headers],
    body: section.data,
    margin: { left: PAGE.marginLeft, right: PAGE.marginRight },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const color = esEstadoColoreable(data.cell.raw);
        if (color) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = 'bold';
        }
        if (typeof data.cell.raw === 'number') {
          data.cell.styles.halign = 'right';
        }
      }
    },
  });

  return doc.lastAutoTable.finalY + 4;  // ← era +6
};

const renderText = (doc, section, yPos) => {
  doc.setTextColor(...COLORS.ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);                   // ← era 10
  const lines = doc.splitTextToSize(section.content, PAGE.contentWidth);
  doc.text(lines, PAGE.marginLeft, yPos);
  return yPos + lines.length * 4.2 + 3; // ← era *5 + 4
};

const renderImage = async (doc, section, yPos) => {
  try {
    const imgBase64 = await urlToBase64(section.content);
    if (!imgBase64) {
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(8.5);
      doc.text('(No se pudo cargar la imagen)', PAGE.marginLeft, yPos);
      return yPos + 5;
    }

    const dims = await getImageDimensions(imgBase64);
    const maxWidth = PAGE.contentWidth;
    // Reservamos más espacio abajo para que quepa completo
    const maxHeight = doc.internal.pageSize.getHeight() - yPos - PAGE.marginBottom - 8;

    let w = dims.width;
    let h = dims.height;
    if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
    if (h > maxHeight) { w = (maxHeight / h) * w; h = maxHeight; }

    const fmt = detectImageFormat(imgBase64);
    doc.addImage(imgBase64, fmt, PAGE.marginLeft, yPos, w, h);

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.15);
    doc.rect(PAGE.marginLeft - 0.4, yPos - 0.4, w + 0.8, h + 0.8);

    return yPos + h + 4;
  } catch (error) {
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(8.5);
    doc.text('(Error al cargar la imagen)', PAGE.marginLeft, yPos);
    return yPos + 5;
  }
};

const renderCenteredImage = async (doc, section, yPos) => {
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);                  // ← era 12
  const pageWidth = doc.internal.pageSize.getWidth();
  const titleWidth = doc.getTextWidth(section.title);
  doc.text(section.title, (pageWidth - titleWidth) / 2, yPos);
  yPos += 6;                            // ← era 8

  try {
    const imgBase64 = await urlToBase64(section.content);
    if (!imgBase64) {
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(8.5);
      doc.text('(No se pudo cargar la imagen)', PAGE.marginLeft, yPos);
      return yPos + 5;
    }

    const dims = await getImageDimensions(imgBase64);
    const maxWidth = PAGE.contentWidth;
    const maxHeight = doc.internal.pageSize.getHeight() - yPos - PAGE.marginBottom - 8;

    let w = dims.width;
    let h = dims.height;
    if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
    if (h > maxHeight) { w = (maxHeight / h) * w; h = maxHeight; }

    const x = (pageWidth - w) / 2;
    const fmt = detectImageFormat(imgBase64);
    doc.addImage(imgBase64, fmt, x, yPos, w, h);

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.15);
    doc.rect(x - 0.4, yPos - 0.4, w + 0.8, h + 0.8);

    return yPos + h + 4;
  } catch (error) {
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(8.5);
    doc.text('(Error al cargar la imagen)', PAGE.marginLeft, yPos);
    return yPos + 5;
  }
};

/* ═══════════════════════════════════════════════════════════════
   TÍTULO DE SECCIÓN (compacto)
   ═══════════════════════════════════════════════════════════════ */
const dibujarTituloSeccion = (doc, title, yPos) => {
  // Barra acento
  doc.setFillColor(...COLORS.primary);
  doc.rect(PAGE.marginLeft, yPos - 2.8, 1.2, 3.5, 'F');   // ← era 1.5x4.5

  // Título
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);                 // ← era 11
  doc.text(title.toUpperCase(), PAGE.marginLeft + 3.5, yPos);

  // Línea horizontal debajo
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.15);
  doc.line(PAGE.marginLeft, yPos + 2.2, PAGE.width - PAGE.marginRight, yPos + 2.2);

  return yPos + 5.5;                    // ← era +8
};

/* ═══════════════════════════════════════════════════════════════
   GENERADOR BASE
   ═══════════════════════════════════════════════════════════════ */
const generarPDFBase = async (title, sections, estilos = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let companyName = 'Veterinaria';
  let logoUrl = null;
  try {
    const settings = await getCompanySettings();
    companyName = settings?.name || companyName;
    logoUrl = settings?.logo || null;
  } catch (e) {
    console.error('Error obteniendo settings:', e);
  }

  const docId = generarDocId();

  // 1. Header
  let yPos = await dibujarHeader(doc, companyName, logoUrl, docId);

  // 2. Título
  yPos = dibujarTituloDocumento(doc, title, yPos);

  // 3. Secciones
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (section.pageBreak) {
      doc.addPage();
      yPos = PAGE.marginTop + 3;
    }

    if (section.type !== 'centeredImage') {
      yPos = ensureSpace(doc, yPos, 18);  // ← era 24
      yPos = dibujarTituloSeccion(doc, section.title, yPos);
    }

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
        if (typeof section.content === 'string') {
          yPos = renderText(doc, section, yPos);
        }
    }

    yPos += 2;                          // ← era 3
  }

  // 4. Footer
  dibujarFooterTodasPaginas(doc, companyName);

  // 5. Abrir
  window.open(doc.output('bloburl'), '_blank');
};

/* ═══════════════════════════════════════════════════════════════
   API PÚBLICA
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