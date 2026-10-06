import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
    return new File([compressedBlob], fileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    // If web worker compression fails, return original file
    return file;
  }
}
