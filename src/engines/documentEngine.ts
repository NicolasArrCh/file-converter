import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';

export const convertDocument = async (file: File, outputFormat: string): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Caso: Entrada PDF -> Salida Texto/Docx
  if (extension === 'pdf') {
    if (outputFormat === 'pdf') {
      return URL.createObjectURL(file);
    }
    
    // Extraer texto de PDF usando pdf.js (Carga dinámica desde CDN)
    const pdfJS = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm' as any);
    pdfJS.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    if (outputFormat === 'txt') {
      const blob = new Blob([fullText], { type: 'text/plain' });
      return URL.createObjectURL(blob);
    }
    
    if (outputFormat === 'docx') {
      throw new Error('La conversión de PDF a DOCX editable requiere un motor de reconstrucción de layout avanzado. Por ahora puedes usar la opción TXT para extraer el contenido.');
    }
  }

  // Caso: Entrada Otros (Docx, Txt) -> Salida PDF
  if (outputFormat !== 'pdf') {
    throw new Error('Solo el formato PDF o TXT está soportado actualmente como salida para este tipo de documento.');
  }

  let content = '';

  try {
    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      content = result.value;
    } else {
      content = await file.text();
    }
  } catch (err) {
    throw new Error('No se pudo leer el contenido del documento.');
  }

  if (!content.trim()) {
    throw new Error('El documento está vacío o no se pudo extraer texto.');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header Branding
  doc.setFillColor(112, 40, 255); // Aurora Purple
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('AURORA FLUX', 20, 25);
  
  doc.setFontSize(10);
  doc.text('DOCUMENT CONVERSION PROTOCOL v1.1', 20, 32);

  // Body Content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  const splitText = doc.splitTextToSize(content, maxLineWidth);
  
  // Handling pagination
  let cursorY = 55;
  const lineHeight = 7;
  
  for (let i = 0; i < splitText.length; i++) {
    if (cursorY > pageHeight - 30) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text(splitText[i], margin, cursorY);
    cursorY += lineHeight;
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Procesado localmente por Aurora Flux Engine • Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
