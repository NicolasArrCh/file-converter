import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';

export const convertDocument = async (file: File, outputFormat: string): Promise<string> => {
  if (outputFormat !== 'pdf') {
    throw new Error('Only PDF output is currently supported for documents.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  let content = '';

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    content = result.value;
  } else {
    content = await file.text();
  }

  const doc = new jsPDF();
  
  // Header Branding
  doc.setFillColor(112, 40, 255); // Aurora Purple
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('AURORA FLUX', 15, 25);
  
  doc.setFontSize(10);
  doc.text('DOCUMENT CONVERSION PROTOCOL v1.0', 15, 32);

  // Body Content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  
  const splitText = doc.splitTextToSize(content, 180);
  doc.text(splitText, 15, 55);

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
