import { fileTypeFromBlob } from 'file-type';

export interface FileInfo {
  ext: string;
  mime: string;
  category: 'media' | 'document' | 'spreadsheet' | 'graphic' | 'unknown';
}

export const detectFileType = async (file: Blob): Promise<FileInfo> => {
  // Phase I: Universal Detection (Magic Numbers)
  // 1. Deep Binary Inspection using file-type
  const type = await fileTypeFromBlob(file);
  
  // 2. Manual Magic Number check for common formats if file-type fails
  const buffer = await file.slice(0, 4).arrayBuffer();
  const header = new Uint8Array(buffer);
  let manualExt = '';
  let manualMime = '';

  // Simple Magic Number signatures
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    manualExt = 'png'; manualMime = 'image/png';
  } else if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    manualExt = 'jpg'; manualMime = 'image/jpeg';
  } else if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
    manualExt = 'pdf'; manualMime = 'application/pdf';
  } else if (header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04) {
    manualExt = 'xlsx'; manualMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; // Or docx, but we categorize later
  }

  // 3. Fallback to extension/mime
  const ext = (file as File).name?.split('.').pop()?.toLowerCase() || '';
  const mime = file.type || 'application/octet-stream';

  const finalExt = type?.ext || manualExt || ext;
  const finalMime = type?.mime || manualMime || mime;

  return {
    ext: finalExt,
    mime: finalMime,
    category: getCategory(finalMime, finalExt)
  };
};

const getCategory = (mime: string, ext: string): FileInfo['category'] => {
  // Media
  if (mime.startsWith('video/') || mime.startsWith('audio/') || ['mp4', 'mkv', 'webm', 'mp3', 'wav', 'flac', 'avi', 'mov'].includes(ext)) return 'media';
  
  // Graphics
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'tiff', 'ico'].includes(ext)) return 'graphic';
  
  // Spreadsheets
  if (['xlsx', 'xls', 'csv', 'ods', 'tsv'].includes(ext) || mime === 'text/csv' || mime.includes('spreadsheet')) return 'spreadsheet';
  
  // Documents
  if (['pdf', 'docx', 'doc', 'md', 'txt', 'rtf', 'html'].includes(ext) || mime === 'application/pdf' || mime.includes('word')) return 'document';
  
  return 'unknown';
};
