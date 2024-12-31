import React, { useState } from 'react';
import Image from 'next/image';

interface Location {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  images?: { url: string; path: string; }[];
}

interface LocationGalleryProps {
  locations: Location[];
}

const LocationGallery: React.FC<LocationGalleryProps> = ({ locations }) => {
  const [selectedLocation, setSelectedLocation] = useState<number>(0);
  
  // 이미지가 있는 장소만 필터링
  const locationsWithImages = locations.filter(location => location.images && location.images.length > 0);
  console.log('All locations:', locations);
  console.log('Locations with images:', locationsWithImages);

  // 이미지가 있는 장소가 없으면 아무것도 렌더링하지 않음
  if (locationsWithImages.length === 0) {
    console.log('No locations with images found');
    return null;
  }

  return (
    <div className="rounded bg-stone-500/50 backdrop-blur-md m-4 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 overflow-x-auto">
          {locationsWithImages.map((location, index) => (
            <button
              key={index}
              onClick={() => setSelectedLocation(index)}
              className={`px-4 py-2 rounded-lg ${
                selectedLocation === index ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {location.name}
            </button>
          ))}
        </div>
        
        {locationsWithImages[selectedLocation] && (
          <div>
            <h3 className="text-white font-bold mb-2">{locationsWithImages[selectedLocation].name}</h3>
            <p className="text-gray-300 text-sm mb-4">{locationsWithImages[selectedLocation].address}</p>
            
            <div className="flex gap-4 overflow-x-auto pb-4">
              {locationsWithImages[selectedLocation].images!.map((image, index) => (
                <div key={index} className="relative min-w-[200px] h-[150px]">
                  <Image
                    src={image.url}
                    alt={`${locationsWithImages[selectedLocation].name} 이미지 ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationGallery; 