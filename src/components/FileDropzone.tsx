import React, { useState, useCallback } from 'react';
import { Upload, File as FileIcon, X, CheckCircle2 } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div 
      className={`dropzone-area ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input 
        type="file" 
        id="fileInput" 
        hidden 
        onChange={handleFileInput}
      />
      
      {!selectedFile ? (
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-2">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-white">Subir Archivo</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
              Selecciona o arrastra cualquier archivo para iniciar la conversión local.
            </p>
          </div>
          
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mt-4">
            Procesamiento Privado WASM
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/10 rounded-3xl max-w-2xl mx-auto">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-black">
              <FileIcon className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg text-white truncate max-w-[200px] md:max-w-md">{selectedFile.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para secuencia
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={clearFile}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-slate-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
