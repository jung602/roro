import React from 'react';
import Image from 'next/image';

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
  return (
    <div className="bg-black/50 backdrop-blur-md p-4">
      <div className="flex flex-col gap-4">
        {locations.map((location, locationIndex) => (
          <div key={locationIndex} className="border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">{location.name}</h3>
              <input
                type="file"
                id={`image-upload-${locationIndex}`}
                className="hidden"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && onAddImages(locationIndex, e.target.files)}
              />
              <button
                onClick={() => document.getElementById(`image-upload-${locationIndex}`)?.click()}
                className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm"
              >
                이미지 추가
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4">
              {(location.images || []).map((image, imageIndex) => (
                <div key={imageIndex} className="relative min-w-[200px] h-[150px] group">
                  <Image
                    src={image.url}
                    alt={`${location.name} 이미지 ${imageIndex + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    onClick={() => onDeleteImage(locationIndex, imageIndex)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditableLocationGallery; 