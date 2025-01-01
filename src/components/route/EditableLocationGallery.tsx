import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Location {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  images?: { url: string; path: string; }[];
}

interface EditableLocationGalleryProps {
  locations: Location[];
  onAddImages: (locationIndex: number, files: FileList) => Promise<void>;
  onDeleteImage: (locationIndex: number, imageIndex: number) => Promise<void>;
}

const EditableLocationGallery: React.FC<EditableLocationGalleryProps> = ({
  locations,
  onAddImages,
  onDeleteImage,
}) => {
  const [uploadStates, setUploadStates] = useState<{
    [key: number]: {
      isUploading: boolean;
      isCompressing: boolean;
      progress: number;
    };
  }>({});

  const handleFileChange = async (locationIndex: number, files: FileList) => {
    if (!files.length) return;

    const currentImages = locations[locationIndex].images?.length || 0;
    const newImages = files.length;
    
    if (currentImages + newImages > 5) {
      alert('이미지는 최대 5개까지만 업로드할 수 있습니다.');
      return;
    }

    setUploadStates(prev => ({
      ...prev,
      [locationIndex]: {
        isUploading: true,
        isCompressing: true,
        progress: 0
      }
    }));

    try {
      await onAddImages(locationIndex, files);
    } finally {
      setUploadStates(prev => ({
        ...prev,
        [locationIndex]: {
          isUploading: false,
          isCompressing: false,
          progress: 0
        }
      }));
    }
  };

  return (
    <div className="bg-stone-100 p-4">
      <div className="flex flex-col gap-4">
        {locations.map((location, locationIndex) => (
          <div key={locationIndex} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-stone-900 font-bold">{location.name}</h3>
              <input
                type="file"
                id={`image-upload-${locationIndex}`}
                className="hidden"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileChange(locationIndex, e.target.files)}
              />
              <button
                onClick={() => document.getElementById(`image-upload-${locationIndex}`)?.click()}
                className="text-sm text-stone-500 hover:text-stone-700"
              >
                {location.images?.length ? '이미지 추가' : '이미지 업로드'}
                {location.images?.length ? ` (${location.images.length}/5)` : ''}
              </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto py-1">
              {(location.images || []).map((image, imageIndex) => (
                <div key={imageIndex} className="relative flex-shrink-0 group">
                  <img
                    src={image.url}
                    alt={`${location.name} 이미지 ${imageIndex + 1}`}
                    className="w-12 h-12 object-cover rounded-md"
                    style={{ minWidth: '48px' }}
                  />
                  <button
                    onClick={() => onDeleteImage(locationIndex, imageIndex)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-stone-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              {uploadStates[locationIndex]?.isUploading && (
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-stone-200 rounded-md flex items-center justify-center overflow-hidden">
                    {uploadStates[locationIndex]?.isCompressing ? (
                      <span className="text-xs font-medium text-stone-600">압축중...</span>
                    ) : (
                      <>
                        <div 
                          className="absolute inset-0 bg-stone-300 transition-all duration-200"
                          style={{ transform: `translateY(${100 - (uploadStates[locationIndex]?.progress || 0)}%)` }}
                        />
                        <span className="relative text-xs font-medium z-10">
                          {Math.round(uploadStates[locationIndex]?.progress || 0)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditableLocationGallery; 