import { useState } from 'react';
import { detectFileType, type FileInfo } from '../utils/fileDetection';

import { convertSpreadsheet } from '../engines/spreadsheetEngine';
import { convertGraphic } from '../engines/graphicEngine';
import { convertDocument } from '../engines/documentEngine';

export const useUniversalConverter = () => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileStatus, setCurrentFileStatus] = useState<FileInfo | null>(null);

  const analyzeFile = async (file: File) => {
    const info = await detectFileType(file);
    setCurrentFileStatus(info);
    return info;
  };

  const processFile = async (file: File, targetFormat: string, preset?: string): Promise<string> => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // 0. Memory Guard (Protocol 3.C)
      if (file.size > 2 * 1024 * 1024 * 1024) {
        throw new Error('Archivo demasiado grande para procesamiento en el cliente (Límite: 2GB).');
      }

      // 1. Universal Router: Deep detection (re-verify or use current)
      const fileInfo = currentFileStatus || await analyzeFile(file);

      let resultUrl = '';

      // 2. Dispatching to correct engine
      switch (fileInfo.category) {
        case 'media':
          const { convertMedia } = await import('../engines/mediaEngine');
          resultUrl = await convertMedia(file, targetFormat, preset, setProgress);
          break;
        case 'spreadsheet':
          resultUrl = await convertSpreadsheet(file, targetFormat);
          setProgress(100);
          break;
        case 'graphic':
          // Use Native Engine for standard formats (faster), WASM for complex ones
          if (['png', 'jpeg', 'jpg', 'webp'].includes(targetFormat)) {
            const { convertGraphicNative } = await import('../engines/nativeImageEngine');
            resultUrl = await convertGraphicNative(file, targetFormat);
          } else {
            resultUrl = await convertGraphic(file, targetFormat);
          }
          setProgress(100);
          break;
        case 'document':
          resultUrl = await convertDocument(file, targetFormat);
          setProgress(100);
          break;
        default:
          throw new Error('Formato no soportado por el Protocolo Maestro.');
      }

      return resultUrl;
    } catch (error) {
      console.error('Master Protocol Failure:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToDisk = async (blobUrl: string, fileName: string) => {
    try {
      if ('showSaveFilePicker' in window) {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
        });
        
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
      return false;
    } catch (err) {
      console.error('File System Access Error:', err);
      return false;
    }
  };

  return {
    analyzeFile,
    processFile,
    saveToDisk,
    progress, 
    isProcessing,
    fileInfo: currentFileStatus
  };
};
