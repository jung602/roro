import imageCompression from 'browser-image-compression';

export type ImageType = 'place' | 'profile' | 'thumbnail';

const getCompressionOptions = (type: ImageType) => {
  switch (type) {
    case 'place':
      return {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: undefined as ((progress: number) => void) | undefined
      };
    case 'profile':
      return {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        onProgress: undefined as ((progress: number) => void) | undefined
      };
    case 'thumbnail':
      return {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 400,
        useWebWorker: true,
        onProgress: undefined as ((progress: number) => void) | undefined
      };
  }
};

export async function compressImage(
  file: File, 
  type: ImageType,
  onProgress?: (progress: number) => void
): Promise<File> {
  try {
    const options = getCompressionOptions(type);
    if (onProgress) {
      options.onProgress = onProgress;
    }
    
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    return file;
  }
} 