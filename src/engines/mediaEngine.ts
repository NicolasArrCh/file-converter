import { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpeg: FFmpeg | null = null;
let lastLog: string = '';

// Internal event emitter for logs (to show in UI)
let logListeners: ((msg: string) => void)[] = [];
export const onEngineLog = (cb: (msg: string) => void) => {
  logListeners.push(cb);
};

const emitLog = (msg: string) => {
  console.log('Engine:', msg);
  logListeners.forEach(cb => cb(msg));
};

export const loadMediaEngine = async (onProgress: (p: number) => void) => {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  ffmpeg.on('progress', ({ progress }) => {
    onProgress(Math.round(progress * 100));
  });

  ffmpeg.on('log', ({ message }) => {
    lastLog = message;
    emitLog(`[HW-PROCESS]: ${message}`);
  });

  const isIsolated = window.crossOriginIsolated;
  const hasSAB = typeof SharedArrayBuffer !== 'undefined';
  const baseURL = `${window.location.origin}/ffmpeg`;

  emitLog(`Diagnóstico de Hardware: Aislamiento=${isIsolated}, SAB=${hasSAB}`);

  const tryLoad = async (isMT: boolean) => {
    const suffix = isMT ? '' : '-st';
    const mode = isMT ? 'Multi-Hilo (MT)' : 'Mono-Hilo (ST)';
    emitLog(`Cargando Binarios Aurora ${mode}...`);
    
    // Using direct strings for same-origin URLs (More robust than toBlobURL)
    await ffmpeg!.load({
      coreURL: `${baseURL}/ffmpeg-core${suffix}.js`,
      wasmURL: `${baseURL}/ffmpeg-core${suffix}.wasm`,
      workerURL: isMT ? `${baseURL}/ffmpeg-core.worker.js` : undefined,
    });
    
    emitLog(`Motor ${mode} vinculado al hardware con éxito.`);
  };

  try {
    if (isIsolated && hasSAB) {
      try {
        // Timeout 10s for MT load
        await Promise.race([
          tryLoad(true),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_MT')), 10000))
        ]);
      } catch (e) {
        emitLog('Fallo en enlace Multi-Hilo. Ejecutando Protocolo de Contingencia (ST)...');
        await tryLoad(false);
      }
    } else {
      emitLog('Hardware no soporta Multi-Hilo. Usando modo estándar (ST)...');
      await tryLoad(false);
    }
    
    return ffmpeg;
  } catch (error) {
    emitLog(`FALLO CRÍTICO DE HARDWARE: ${error}`);
    ffmpeg = null;
    throw new Error('No se pudo establecer conexión con el procesador para video.');
  }
};

export const convertMedia = async (
  file: File, 
  outputFormat: string, 
  preset: string = 'medium',
  onProgress: (p: number) => void
): Promise<string> => {
  const engine = await loadMediaEngine(onProgress);
  const inputName = 'input_raw';
  const outputName = `output_processed.${outputFormat}`;

  try {
    emitLog('Inyectando flujo de datos al hardware...');
    const arrayBuffer = await file.arrayBuffer();
    await engine.writeFile(inputName, new Uint8Array(arrayBuffer));
    
    emitLog(`Iniciando transcodificación nativa a ${outputFormat.toUpperCase()}...`);
    let args = ['-i', inputName];
    
    // Adaptive Hardware Threading (Biblia Técnica: Punto de Optimización CPU)
    const threads = navigator.hardwareConcurrency || 4;
    args.push('-threads', threads.toString());

    // Preset optimizations for MKV/MP4
    if (outputFormat === 'mp4' || outputFormat === 'mkv') {
      args.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', preset === 'high' ? '18' : '23',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p'
      );
    } else if (outputFormat === 'mp3') {
      args.push('-c:a', 'libmp3lame', '-b:a', '192k');
    } else if (outputFormat === 'webm') {
      args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
    }

    args.push(outputName);

    emitLog('Motor en ejecución (CPU al máximo)...');
    const result = await engine.exec(args);
    
    if (result !== 0) throw new Error(`Exec Fail: ${lastLog}`);

    emitLog('Recuperando resultado del procesador...');
    const data = await engine.readFile(outputName);
    const blob = new Blob([data as any], { type: `video/${outputFormat}` });
    
    // Free Hardware RAM
    await engine.deleteFile(inputName);
    await engine.deleteFile(outputName);
    
    emitLog('Procesamiento completado. Archivo liberado.');
    return URL.createObjectURL(blob);
  } catch (error) {
    emitLog(`FALLO EN OPERACIÓN: ${error}`);
    throw error;
  }
};
