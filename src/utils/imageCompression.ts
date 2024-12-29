import imageCompression from 'browser-image-compression';

export async function compressImage(file: File) {
  const options = {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 200,
    useWebWorker: true
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    throw error;
  }
} 