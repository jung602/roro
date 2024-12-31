import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage, ImageType } from '../utils/imageCompression';

export interface PlaceImage {
  url: string;
  path: string;
}

export async function uploadPlaceImages(placeId: string, files: File[]): Promise<PlaceImage[]> {
  if (files.length > 5) {
    throw new Error('최대 5개의 이미지만 업로드할 수 있습니다.');
  }

  const images: PlaceImage[] = [];
  
  for (const file of files) {
    const compressedFile = await compressImage(file, 'place');
    const timestamp = Date.now();
    const path = `places/${placeId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, compressedFile);
    const url = await getDownloadURL(storageRef);
    
    images.push({ url, path });
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