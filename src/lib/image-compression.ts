import imageCompression from 'browser-image-compression';

// Check if the library is available
const isImageCompressionAvailable = () => {
  try {
    return typeof imageCompression === 'function';
  } catch (error) {
    console.warn('Image compression library not available:', error);
    return false;
  }
};

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType?: string;
  initialQuality?: number;
}

export async function compressImage(
  file: File, 
  options: CompressionOptions = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  }
): Promise<File> {
  try {
    console.log('Starting image compression for file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Check if compression library is available
    if (!isImageCompressionAvailable()) {
      console.warn('Image compression library not available, returning original file');
      return file;
    }
    
    const compressedFile = await imageCompression(file, options);
    
    console.log('Image compression completed. Original size:', file.size, 'Compressed size:', compressedFile.size);
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    console.error('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // Return original file as fallback
    console.warn('Compression failed, returning original file');
    return file;
  }
}
