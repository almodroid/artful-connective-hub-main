import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  preserveExif?: boolean;
}

export async function compressFile(
  file: File,
  customOptions?: CompressionOptions
): Promise<File> {
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const defaultOptions = {
    maxSizeMB: 1,              // Maximum size in MB
    maxWidthOrHeight: 1920,    // Maintain good quality for most displays
    useWebWorker: true,        // Use web worker for better performance
    preserveExif: true         // Preserve image metadata
  };

  const options = { ...defaultOptions, ...customOptions };

  try {
    // Only compress if the file is larger than the max size
    if (file.size / 1024 / 1024 <= options.maxSizeMB) {
      return file;
    }

    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing file:', error);
    // Return original file if compression fails
    return file;
  }
}