import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage, ImageType } from '../utils/imageCompression';

export interface PlaceImage {
  url: string;
  path: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

// 이미지 크기에 따른 압축 여부 결정
const shouldCompress = (file: File): boolean => {
  return file.size > 1024 * 1024; // 1MB 이상인 경우에만 압축
};

export async function uploadPlaceImages(
  placeId: string,
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<PlaceImage[]> {
  if (files.length > 5) {
    throw new Error('최대 5개의 이미지만 업로드할 수 있습니다.');
  }

  const images: PlaceImage[] = [];
  const totalFiles = files.length;
  let completedFiles = 0;
  
  // 압축 진행률을 포함한 전체 진행률 계산
  const calculateTotalProgress = (fileIndex: number, compressionProgress: number, uploadProgress: number) => {
    const fileWeight = 1 / totalFiles;
    const compressionWeight = 0.3; // 압축이 전체의 30%
    const uploadWeight = 0.7; // 업로드가 전체의 70%
    
    const previousFilesProgress = (fileIndex / totalFiles) * 100;
    const currentFileProgress = (
      (compressionProgress * compressionWeight + uploadProgress * uploadWeight) * fileWeight
    ) * 100;
    
    return previousFilesProgress + currentFileProgress;
  };

  // 병렬 업로드를 위한 Promise 배열
  const uploadPromises = files.map(async (file, fileIndex) => {
    // 압축 단계
    let processedFile = file;
    if (shouldCompress(file)) {
      onProgress?.(calculateTotalProgress(fileIndex, 0, 0));
      processedFile = await compressImage(file, 'place', (compressionProgress) => {
        onProgress?.(calculateTotalProgress(fileIndex, compressionProgress, 0));
      });
    }

    const timestamp = Date.now();
    const path = `places/${placeId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, path);
    
    return new Promise<PlaceImage>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, processedFile);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const uploadProgress = snapshot.bytesTransferred / snapshot.totalBytes;
          onProgress?.(calculateTotalProgress(fileIndex, 1, uploadProgress));
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          completedFiles++;
          onProgress?.(calculateTotalProgress(fileIndex + 1, 1, 1));
          resolve({ url, path });
        }
      );
    });
  });
  
  // 모든 업로드를 병렬로 처리
  const results = await Promise.all(uploadPromises);
  return results;
}

export async function uploadThumbnail(userId: string, file: File): Promise<PlaceImage> {
  const processedFile = shouldCompress(file) ? await compressImage(file, 'thumbnail') : file;
  const timestamp = Date.now();
  const path = `thumbnails/${userId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, processedFile);
  const url = await getDownloadURL(storageRef);
  
  return { url, path };
}

export async function deletePlaceImage(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export async function uploadImage(file: File, folder: string, fileName: string): Promise<string> {
  const processedFile = shouldCompress(file) ? await compressImage(file, 'profile') : file;
  const path = `${folder}/${fileName}`;
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, processedFile);
  const url = await getDownloadURL(storageRef);
  
  return url;
} 