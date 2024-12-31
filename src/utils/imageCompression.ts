import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

const COMPRESSION_OPTIONS = {
  thumbnail: {
    maxSizeMB: 0.5, // 100KB
    maxWidthOrHeight: 200,
    useWebWorker: true
  },
  place: {
    maxSizeMB: 0.9, // 900KB
    maxWidthOrHeight: 1920,
    useWebWorker: true
  },
  profile: {
    maxSizeMB: 0.1, // 500KB
    maxWidthOrHeight: 800,
    useWebWorker: true
  }
} as const;

export type ImageType = keyof typeof COMPRESSION_OPTIONS;

export async function compressImage(file: File, type: ImageType = 'place') {
  const options = COMPRESSION_OPTIONS[type];
  
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    throw error;
  }
} 