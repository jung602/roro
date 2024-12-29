import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE_MB = 1;
const QUALITY = 0.8;
const MAX_WIDTH_PX = 1200;

interface ImageDimensions {
  width: number;
  height: number;
}

const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

const calculateNewDimensions = (originalDimensions: ImageDimensions): ImageDimensions => {
  const { width, height } = originalDimensions;
  if (width <= MAX_WIDTH_PX) {
    return { width, height };
  }

  const aspectRatio = width / height;
  const newWidth = MAX_WIDTH_PX;
  const newHeight = Math.round(newWidth / aspectRatio);

  return { width: newWidth, height: newHeight };
};

export const uploadImage = async (
  file: File,
  path: string,
  fileName: string
): Promise<string> => {
  try {
    // 이미지 압축 옵션
    const options = {
      maxSizeMB: MAX_FILE_SIZE_MB,
      maxWidthOrHeight: MAX_WIDTH_PX,
      useWebWorker: true,
      quality: QUALITY,
    };

    // 원본 이미지 크기 확인
    const dimensions = await getImageDimensions(file);
    const newDimensions = calculateNewDimensions(dimensions);

    // 이미지 압축 필요 여부 확인
    let compressedFile = file;
    if (
      file.size > MAX_FILE_SIZE_MB * 1024 * 1024 ||
      dimensions.width > MAX_WIDTH_PX
    ) {
      compressedFile = await imageCompression(file, options);
    }

    // Storage 참조 생성
    const storageRef = ref(storage, `${path}/${fileName}`);

    // 메타데이터 설정
    const metadata = {
      contentType: compressedFile.type,
      customMetadata: {
        originalWidth: String(dimensions.width),
        originalHeight: String(dimensions.height),
        compressedWidth: String(newDimensions.width),
        compressedHeight: String(newDimensions.height),
      },
    };

    // 압축된 이미지 업로드
    await uploadBytes(storageRef, compressedFile, metadata);

    // 다운로드 URL 반환
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('이미지 업로드 에러:', error);
    throw error;
  }
};

export const getOptimizedImageUrl = (url: string, width?: number): string => {
  if (!url) return '';
  
  // 이미 최적화된 URL인 경우 그대로 반환
  if (url.includes('_thumb')) return url;

  const targetWidth = width || MAX_WIDTH_PX;
  
  // Firebase Storage URL인 경우에만 처리
  if (url.includes('firebasestorage.googleapis.com')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', targetWidth.toString());
    return urlObj.toString();
  }

  return url;
}; 