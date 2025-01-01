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
  
  for (const file of files) {
    const compressedFile = await compressImage(file, 'place');
    const timestamp = Date.now();
    const path = `places/${placeId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, path);
    
    await new Promise<void>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes);
          const totalProgress = (completedFiles + fileProgress) / totalFiles;
          onProgress?.(totalProgress * 100);
        },
        (error) => {
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          images.push({ url, path });
          completedFiles++;
          resolve();
        }
      );
    });
  }
  
  return images;
}

export async function uploadThumbnail(userId: string, file: File): Promise<PlaceImage> {
  const compressedFile = await compressImage(file, 'thumbnail');
  const timestamp = Date.now();
  const path = `thumbnails/${userId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, compressedFile);
  const url = await getDownloadURL(storageRef);
  
  return { url, path };
}

export async function deletePlaceImage(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export async function uploadImage(file: File, folder: string, fileName: string): Promise<string> {
  const compressedFile = await compressImage(file, 'profile');
  const path = `${folder}/${fileName}`;
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, compressedFile);
  const url = await getDownloadURL(storageRef);
  
  return url;
} 