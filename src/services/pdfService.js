import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCompanyName, getCompanyLogo } from './companyService';
import { getCompanySettings } from './companyService';
import { getImageUrl } from '../utils/imageUtils';

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

// Función para obtener dimensiones de imagen
const getImageDimensions = (base64) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = base64;
  });
};

// Función base para generar PDF (usada internamente por todas las específicas)
const generarPDFBase = async (title, sections, estilos = {}) => {
  const doc = new jsPDF();
  const settings = await getCompanySettings();
  const companyName = settings.name;
  const logoUrl = settings.logo;
  // const companyName = getCompanyName();
  // const logoUrl = getCompanyLogo();

  // Estilos por defecto (los que ya tienes actualmente)
  const estilosPorDefecto = {
    colorPrimario: [41, 128, 185],      // Azul para títulos de sección y cabeceras
    colorLinea: [200, 200, 200],        // Gris claro para líneas separadoras
    colorTexto: [0, 0, 0],               // Negro para texto normal
    fuenteTitulo: 'helvetica',
    estiloTitulo: 'bold',
    tamañoTituloPrincipal: 18,
    tamañoTituloSeccion: 12,
    tamañoTextoNormal: 10,
    margenIzquierdo: 10,
    margenDerecho: 10,
    themeTabla: 'striped',
    colorCabeceraTabla: [41, 128, 185],  // Mismo que colorPrimario
    textoColorCabecera: 255,              // Blanco
  };

  // Combinar estilos pasados con los por defecto
  const estilosFinal = { ...estilosPorDefecto, ...estilos };

  let yPos = 20; // posición inicial para el logo

  // Cabecera con logo y nombre
  if (logoUrl) {
    try {
      const logoCompleto = getImageUrl(logoUrl);
      const logoBase64 = await urlToBase64(logoCompleto);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 10, yPos, 30, 30);
      }
    } catch (error) {
      console.error('Error cargando logo:', error);
    }
  }

  // Nombre de la compañía (siempre a la derecha del logo)
  doc.setTextColor(...estilosFinal.colorTexto);
  doc.setFontSize(estilosFinal.tamañoTituloPrincipal);
  doc.setFont(estilosFinal.fuenteTitulo, estilosFinal.estiloTitulo);
  doc.text(companyName, 50, 30); // misma altura que el centro del logo

  // Título del documento
  doc.setFontSize(14);
  doc.text(title, 50, 40); // justo debajo del nombre

  // Fecha de generación (debajo del logo, alineada izquierda)
  doc.setFontSize(estilosFinal.tamañoTextoNormal);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado el: ${new Date().toLocaleString()}`, 10, 55); // un poco más abajo del logo
  yPos = 60; // después de la fecha, para la línea

  // Línea separadora
  doc.setDrawColor(...estilosFinal.colorLinea);
  doc.line(10, yPos, 200, yPos);
  yPos += 5; // espacio después de la línea

  // Procesar cada sección
  for (const section of sections) {
    // Si la sección tiene pageBreak, añadir nueva página
    if (section.pageBreak) {
      doc.addPage();
      yPos = 20; // reiniciar yPos en la nueva página
    }

    // Título de sección con color primario (excepto para centeredImage que lo dibujamos después)
    if (section.type !== 'centeredImage') {
      doc.setTextColor(...estilosFinal.colorPrimario);
      doc.setFontSize(estilosFinal.tamañoTituloSeccion);
      doc.setFont(estilosFinal.fuenteTitulo, 'bold');
      doc.text(section.title, estilosFinal.margenIzquierdo, yPos);
      yPos += 6;
      // Restablecer color a texto normal
      doc.setTextColor(...estilosFinal.colorTexto);
    }

    if (section.type === 'keyValue') {
      const body = section.content.map(([key, value]) => [
        key,
        value !== undefined && value !== null ? String(value) : ''
      ]);
      autoTable(doc, {
        startY: yPos,
        head: [['Descripción', 'Valor']],
        body,
        theme: estilosFinal.themeTabla,
        styles: { fontSize: estilosFinal.tamañoTextoNormal, cellPadding: 2, textColor: estilosFinal.colorTexto },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 120 } },
        margin: { left: estilosFinal.margenIzquierdo, right: estilosFinal.margenDerecho },
        headStyles: { fillColor: estilosFinal.colorCabeceraTabla, textColor: estilosFinal.textoColorCabecera, fontStyle: 'bold' },
      });
      yPos = doc.lastAutoTable.finalY + 5;
    } else if (section.type === 'table') {
      autoTable(doc, {
        startY: yPos,
        head: [section.headers],
        body: section.data,
        theme: estilosFinal.themeTabla,
        headStyles: { fillColor: estilosFinal.colorCabeceraTabla, textColor: estilosFinal.textoColorCabecera, fontStyle: 'bold' },
        margin: { left: estilosFinal.margenIzquierdo, right: estilosFinal.margenDerecho },
      });
      yPos = doc.lastAutoTable.finalY + 5;
    } else if (section.type === 'text') {
      doc.setFontSize(estilosFinal.tamañoTextoNormal);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(section.content, 180);
      doc.text(lines, estilosFinal.margenIzquierdo, yPos);
      yPos += lines.length * 5 + 5;
    } else if (section.type === 'image') {
      try {
        const imgBase64 = await urlToBase64(section.content);
        if (imgBase64) {
          doc.addImage(imgBase64, 'JPEG', 10, yPos, 100, 100);
          yPos += 110;
        } else {
          doc.text('(No se pudo cargar la imagen)', 10, yPos);
          yPos += 6;
        }
      } catch (error) {
        doc.text('(Error al cargar la imagen)', 10, yPos);
        yPos += 6;
      }
    } else if (section.type === 'centeredImage') {
      // Título centrado
      doc.setTextColor(...estilosFinal.colorPrimario);
      doc.setFontSize(estilosFinal.tamañoTituloSeccion);
      doc.setFont(estilosFinal.fuenteTitulo, 'bold');
      const tituloWidth = doc.getTextWidth(section.title);
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(section.title, (pageWidth - tituloWidth) / 2, yPos);
      yPos += 10;
      doc.setTextColor(...estilosFinal.colorTexto);

      // Imagen centrada
      try {
        const imgBase64 = await urlToBase64(section.content);
        if (imgBase64) {
          const dimensions = await getImageDimensions(imgBase64);
          const maxWidth = 180; // Ancho máximo disponible (márgenes 10)
          const maxHeight = doc.internal.pageSize.getHeight() - yPos - 20; // Espacio restante menos margen inferior
          let imgWidth = dimensions.width;
          let imgHeight = dimensions.height;

          // Escalar para que quepa
          if (imgWidth > maxWidth) {
            imgHeight = (maxWidth / imgWidth) * imgHeight;
            imgWidth = maxWidth;
          }
          if (imgHeight > maxHeight) {
            imgWidth = (maxHeight / imgHeight) * imgWidth;
            imgHeight = maxHeight;
          }

          const x = (pageWidth - imgWidth) / 2;
          doc.addImage(imgBase64, 'JPEG', x, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 10;
        } else {
          doc.text('(No se pudo cargar la imagen)', 10, yPos);
          yPos += 6;
        }
      } catch (error) {
        doc.text('(Error al cargar la imagen)', 10, yPos);
        yPos += 6;
      }
    }

    // Línea separadora después de cada sección (excepto si es la última o si hay pageBreak)
    if (section !== sections[sections.length - 1] && !section.pageBreak) {
      doc.setDrawColor(...estilosFinal.colorLinea);
      doc.line(estilosFinal.margenIzquierdo, yPos - 2, 200, yPos - 2);
      yPos += 5;
    }
  }

  // Abrir el PDF en una nueva pestaña
  window.open(doc.output('bloburl'), '_blank');
};

// Funciones específicas para cada tipo de PDF (sin cambios, usan estilos por defecto)
export const generateFacturaPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};

export const generateConsultaPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};

export const generateVacunacionPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};

export const generateEstudioPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};

export const generateOperacionPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};

export const generateEsteticaPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};

export const generateHospitalizacionPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};

export const generateMonitoreoPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};
export const generateHistorialMedicoPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};
export const generateHistorialFacturasPDF = async (title, sections) => {
  return generarPDFBase(title, sections);
};
/// como implemetar el 3er parametro de personalizacion de estilos:

// export const generateFacturaPDF = async (title, sections) => {
//   return generarPDFBase(title, sections, {
//     colorPrimario: [46, 204, 113],
//     colorCabeceraTabla: [39, 174, 96],
//   });
// };