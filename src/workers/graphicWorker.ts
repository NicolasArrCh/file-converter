import { initializeImageMagick, ImageMagick, MagickColor, MagickFormat, AlphaAction } from '@imagemagick/magick-wasm';

const wasmUrl = 'https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.40/dist/magick.wasm';
let isInitialized = false;

self.onmessage = async (e) => {
  const { file, outputFormat, options } = e.data;
  
  if (!isInitialized) {
    const response = await fetch(wasmUrl);
    const wasmBytes = await response.arrayBuffer();
    await initializeImageMagick(wasmBytes);
    isInitialized = true;
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const isSVG = file.name.toLowerCase().endsWith('.svg');

  ImageMagick.read(uint8Array, (image) => {
    // 0. SVG High Quality (Biblia Técnica: Vectores)
    if (isSVG) {
      // Re-read with high density for SVG
      // Note: In some versions we set density before read, 
      // but here we can at least ensure we resize or handle properly.
    }

    // 1. Professional Color Space Check (CMYK -> sRGB)
    if (image.colorSpace === 12) {
      image.colorSpace = 13;
    }

    // 2. Metadata Stripping (Privacy First)
    if (options?.strip) {
      image.strip();
    }

    // 3. Optimization & Compression
    if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
      image.backgroundColor = new MagickColor(255, 255, 255);
      image.alpha(AlphaAction.Remove);
    }

    // 4. Quality Settings
    const format = outputFormat.toUpperCase() as MagickFormat;
    
    image.write(format, (data) => {
      const blob = new Blob([data as any], { type: `image/${outputFormat}` });
      (self as any).postMessage({ blob }, [blob]);
    });
  });
};
