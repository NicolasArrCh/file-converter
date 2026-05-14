export const convertGraphicNative = async (file: File, outputFormat: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No se pudo inicializar el contexto 2D');
      
      // Background for transparency (Aurora Purple #7028ff)
      if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
        ctx.fillStyle = '#7028ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return reject('Fallo en la generación del Blob');
        resolve(URL.createObjectURL(blob));
      }, `image/${outputFormat}`, 0.92);
    };
    img.onerror = () => reject('Error al cargar la imagen nativa');
    img.src = URL.createObjectURL(file);
  });
};
