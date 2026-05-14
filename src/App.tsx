import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Download,
  HardDrive,
  Activity,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { FileDropzone } from './components/FileDropzone';
import { useUniversalConverter } from './hooks/useUniversalConverter';

interface ConversionResult {
  id: string;
  name: string;
  url: string;
  type: string;
  originalSize: number;
}

function App() {
  const { 
    analyzeFile,
    processFile, 
    saveToDisk,
    progress, 
    isProcessing,
    fileInfo
  } = useUniversalConverter();

  const [results, setResults] = useState<ConversionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['Sincronizando Motores...', 'Sistema Listo.']);

  useEffect(() => {
    import('./engines/mediaEngine').then(m => {
      m.onEngineLog((msg: string) => {
        setLogs(prev => [...prev.slice(-6), msg]);
      });
    });
  }, []);

  return (
    <div className="container py-12 md:py-24">
      {/* Navigation / Top Bar */}
      <nav className="flex justify-between items-center mb-16 md:mb-32">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Layers className="text-black w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tighter">Aurora <span className="opacity-40">Flux</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            WASM CORE v1.0
          </div>
          <button disabled className="btn-secondary text-[11px] py-2 px-4 uppercase tracking-widest font-bold opacity-50 cursor-not-allowed">
            Versión Pro (Próximamente)
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-3xl mb-16 md:mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-3 h-3 text-[#7028ff]" /> Procesamiento Local Privado
        </div>
        <h1 className="gradient-text mb-8">
          Conversión de archivos <br /> de grado industrial.
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed">
          Diseñado para la velocidad y la privacidad absoluta. Todo el procesamiento ocurre en tu hardware, nunca en la nube.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Workspace Central */}
        <div className="lg:col-span-8 space-y-12">
          <div className="glass-card p-2 overflow-hidden">
            <FileDropzone onFileSelect={async (file) => {
              (window as any)._currentFile = file;
              setLogs(prev => [...prev, `Archivo: ${file.name}`]);
              setError(null);
              try {
                await analyzeFile(file);
              } catch (err: any) {
                setError("Error al analizar el archivo: " + err.message);
              }
            }} />
          </div>

          {/* Action Hub */}
          <div className="glass-card p-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-bold tracking-tight">Centro de Conversión</h2>
              {isProcessing && (
                <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <Activity className="w-4 h-4 animate-spin" /> Procesando
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(() => {
                const formats: Record<string, string[]> = {
                  media: ['mp4', 'mkv', 'mp3', 'webm'],
                  graphic: ['png', 'jpg', 'webp'],
                  spreadsheet: ['xlsx', 'csv', 'json'],
                  document: fileInfo?.ext === 'pdf' ? ['txt'] : ['pdf']
                };
                
                const availableFormats = fileInfo ? formats[fileInfo.category] || [] : [];
                
                if (availableFormats.length === 0 && (window as any)._currentFile) {
                  return <p className="col-span-full text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-4">Selecciona un archivo compatible para ver opciones</p>;
                }

                return availableFormats.map(fmt => (
                  <button 
                    key={fmt}
                    disabled={isProcessing}
                    onClick={async () => {
                      const file = (window as any)._currentFile;
                      if (!file) return;
                      setError(null);
                      try {
                        const url = await processFile(file, fmt);
                        const result = {
                          id: Math.random().toString(36).substring(7),
                          name: `AURORA_${file.name.split('.')[0]}.${fmt}`,
                          url,
                          type: file.type,
                          originalSize: file.size
                        };
                        setResults(prev => [result, ...prev]);
                      } catch (err: any) {
                        setError(err.message);
                      }
                    }}
                    className="btn-secondary flex items-center justify-between hover:bg-white hover:text-black group transition-all"
                  >
                    <span className="uppercase tracking-widest font-bold text-[10px]">{fmt}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ));
              })()}
            </div>

            {isProcessing && (
              <div className="mt-12 space-y-3">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Hardware Progress</span>
                  <span className="text-white">{progress}%</span>
                </div>
                <div className="progress-rail">
                  <div className="progress-track" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Results Gallery */}
          {results.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Archivos Finalizados</h3>
              {results.map(res => (
                <div key={res.id} className="result-item">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300 border border-white/10">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-base mb-1">{res.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {(res.originalSize / (1024 * 1024)).toFixed(2)} MB • Verificado
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => saveToDisk(res.url, res.name)}
                      className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all"
                      title="Guardar localmente"
                    >
                      <HardDrive className="w-5 h-5" />
                    </button>
                    <a 
                      href={res.url} 
                      download={res.name}
                      className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-white hover:opacity-80 transition-all text-black"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-8">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Hardware Diagnostics
            </h4>
            <div className="log-terminal space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="opacity-30">[{new Date().toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit'})}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 bg-gradient-to-br from-white/5 to-transparent">
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">System Protocols</h5>
            <div className="space-y-6">
              {[
                { icon: <ShieldCheck />, title: 'Seguridad', desc: 'Aislamiento de hilo local' },
                { icon: <Cpu />, title: 'Rendimiento', desc: 'Aceleración por hilos CPU' },
                { icon: <HardDrive />, title: 'Privacidad', desc: 'Sin almacenamiento en nube' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 border border-white/5 rounded-[32px] bg-white/[0.02] text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-loose">
              Aurora Flux Pro <br /> Soporte Prioritario <br /> Acceso API
            </p>
            <button disabled className="mt-6 text-[10px] font-bold text-white/50 underline underline-offset-4 decoration-[#7028ff] cursor-not-allowed">
              Más información (Próximamente)
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-widest">Aurora Flux • Universal Conversion Engine</p>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
          <span>Términos</span>
          <span>Privacidad</span>
          <span>Soporte</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
