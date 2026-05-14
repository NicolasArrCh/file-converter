export const convertGraphic = async (file: File, outputFormat: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Phase III: Worker Orchestration (Biblia Técnica)
    const worker = new Worker(new URL('../workers/graphicWorker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      const { blob } = e.data;
      const url = URL.createObjectURL(blob);
      resolve(url);
      worker.terminate();
    };

    worker.onerror = (err) => {
      reject(`Worker Error: ${err.message}`);
      worker.terminate();
    };

    // Transferable objects for zero-copy
    worker.postMessage({ file, outputFormat });
  });
};
