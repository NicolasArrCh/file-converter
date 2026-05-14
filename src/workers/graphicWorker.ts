import { initializeImageMagick, ImageMagick, MagickColor, MagickFormat, AlphaAction } from '@imagemagick/magick-wasm';

const wasmUrl = 'https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.40/dist/magick.wasm';
let isInitialized = false;

self.onmessage = async (e) => {
  const { file, outputFormat } = e.data;
  
  if (!isInitialized) {
    const response = await fetch(wasmUrl);
    const wasmBytes = await response.arrayBuffer();
    await initializeImageMagick(wasmBytes);
    isInitialized = true;
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  ImageMagick.read(uint8Array, (image) => {
    if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
      image.backgroundColor = new MagickColor(112, 40, 255);
      image.alpha(AlphaAction.Remove);
    }

    const format = outputFormat.toUpperCase() as MagickFormat;
    
    image.write(format, (data) => {
      const blob = new Blob([data as any], { type: `image/${outputFormat}` });
      // Correct Web Worker postMessage signature
      self.postMessage({ blob });
    });
  });
};
