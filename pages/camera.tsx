import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Upload, ArrowRight, Info, X } from 'lucide-react';
import { processImageBatch, extractImageMetadata } from '@/utils/imageUtils';
import BackButton from '@/components/common/BackButton';

interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
  lat?: number;
  lng?: number;
  hasLocation: boolean;
}

export default function Camera() {
  const [photos, setPhotos] = useState<ImageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // 개별 파일 처리
      const newPhotos: ImageData[] = [];
      
      for (const file of Array.from(e.target.files)) {
        const metadata = await extractImageMetadata(file);
        newPhotos.push({
          id: generateId(),
          file,
          previewUrl: metadata.previewUrl,
          lat: metadata.lat,
          lng: metadata.lng,
          hasLocation: !!(metadata.lat && metadata.lng)
        });
      }
      
      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (err) {
      setError('이미지를 처리하는 중 오류가 발생했습니다.');
      console.error('Image processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleNext = () => {
    if (photos.length < 2) {
      setError('최소 2장 이상의 사진이 필요합니다.');
      return;
    }

    // 위치 정보가 있는 사진이 있는지 확인
    const photosWithLocation = photos.filter(photo => photo.hasLocation);
    
    router.push({
      pathname: '/photoLocations',
      query: { photos: JSON.stringify(photos) }
    });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-900 text-stone-100">
      <div className="flex items-center p-4 border-b border-stone-800">
        <BackButton />
        <h1 className="text-xl font-semibold ml-2">사진으로 경로 만들기</h1>
      </div>
      
      <div className="flex-1 bg-stone-200 p-4 overflow-auto">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-stone-900">사진 업로드</h2>
          <p className="text-stone-600 text-sm mt-1">
            방문했던 장소의 사진을 업로드하세요. 위치 정보가 포함된 사진을 추천합니다.
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block w-full p-4 border-2 border-dashed border-stone-400 rounded-lg text-center cursor-pointer hover:bg-stone-300 transition-colors">
            <Upload className="mx-auto mb-2 text-stone-500" />
            <span className="block text-stone-700">사진 선택하기</span>
            <span className="text-xs text-stone-500">GPS 정보가 있는 사진 추천</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-lg flex items-center">
            <Info size={16} className="mr-1" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.previewUrl}
                alt="업로드된 사진"
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-stone-900 bg-opacity-70 flex items-center justify-center"
              >
                <X size={16} className="text-white" />
              </button>
              {photo.hasLocation ? (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 bg-opacity-70 text-white rounded-md text-xs">
                  위치정보 있음
                </div>
              ) : (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-amber-500 bg-opacity-70 text-white rounded-md text-xs">
                  위치정보 없음
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-stone-900 p-4">
        <button
          onClick={handleNext}
          disabled={photos.length < 2 || isProcessing}
          className={`w-full py-3 rounded-full flex items-center justify-center ${
            photos.length < 2 || isProcessing
              ? 'bg-stone-700 text-stone-500'
              : 'bg-stone-200 text-stone-900'
          }`}
        >
          {isProcessing ? '처리 중...' : '다음'}
        </button>
        <p className="text-center text-stone-500 text-xs mt-2">
          {photos.length < 2 ? '최소 2장 이상의 사진이 필요합니다' : `${photos.length}장의 사진 선택됨`}
        </p>
      </div>
    </div>
  );
} 