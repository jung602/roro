import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import dynamic from 'next/dynamic';
import BackButton from '@/components/common/BackButton';
import SortableItem from '@/components/common/SortableItem';
import { uploadPlaceImages } from '@/services/imageService';
import { blobUrlToFile } from '@/utils/imageUtils';

const DynamicCircleMarker = dynamic(() => import('@/components/map/CircleMarker'), { ssr: false });

interface Location {
  name: string;
  address: string;
  lat: number;
  lng: number;
  images?: { url: string; path: string; }[];
}

export default function RouteConfirmation() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 37.5666805, lng: 126.9784147 });
  const [routeMarkers, setRouteMarkers] = useState<google.maps.LatLngLiteral[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const mapOptions = useMemo(() => ({
    styles: [
      {
        elementType: "geometry",
        stylers: [{ color: "#F0F0F0" }], // Light grey land
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#E6E6E6" }], // Light grey water with same lightness as land
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#FFFFFF" }], // White roads
      },
      {
        featureType: "road",
        elementType: "labels",
        stylers: [{ visibility: "off" }], // Remove road labels
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#FFFFFF" }], // Keep only major roads
      },
      {
        featureType: "road.arterial",
        stylers: [{ color: "#FFFFFF" }], // Hide arterial roads
      },
      {
        featureType: "road.local",
        stylers: [{ color: "#FFFFFF" }], // Hide local roads
      },
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }], // Remove points of interest
      },
      {
        featureType: "transit",
        stylers: [{ visibility: "off" }], // Remove transit lines
      },
      {
        featureType: "administrative",
        stylers: [{ visibility: "off" }], // Remove administrative lines
      },
      {
        elementType: "labels",
        stylers: [{ visibility: "off" }], // Remove all remaining labels
      },
    ],
    disableDefaultUI: true, // Remove all default UI elements
    gestureHandling: 'greedy', // 일반적인 스크롤/줌 동작 사용
  }), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && router.query.locations) {
      try {
        const parsedLocations = JSON.parse(router.query.locations as string) as Location[];
        console.log('Parsed locations:', parsedLocations);
        
        // blob URL로 전달받은 이미지들을 실제 파일로 업로드 처리
        const processLocationsWithImages = async () => {
          setIsUploadingImages(true);
          
          const processedLocations = await Promise.all(
            parsedLocations.map(async (location, index) => {
              if (location.images && location.images.length > 0) {
                try {
                  // blob URL을 File 객체로 변환
                  const blobUrls = location.images.filter(img => img.url.startsWith('blob:'));
                  
                  if (blobUrls.length > 0) {
                    const files = await Promise.all(
                      blobUrls.map(img => blobUrlToFile(img.url, `photo-${index}.jpg`))
                    );
                    
                    // 파일들을 실제로 업로드
                    const uploadedImages = await uploadPlaceImages(
                      `place-${location.name}-${index}`,
                      files,
                      (progress) => {
                        setUploadProgress(prev => ({
                          ...prev,
                          [index]: progress
                        }));
                      }
                    );
                    
                    return {
                      ...location,
                      images: uploadedImages
                    };
                  }
                } catch (error) {
                  console.error(`Failed to upload images for location ${index}:`, error);
                  // 업로드 실패 시 이미지 없이 처리
                  return {
                    ...location,
                    images: []
                  };
                }
              }
              return location;
            })
          );
          
          setLocations(processedLocations);
          setIsUploadingImages(false);
          setUploadProgress({});
          
          if (processedLocations.length > 0 && 
              typeof processedLocations[0].lat === 'number' && 
              typeof processedLocations[0].lng === 'number' &&
              !isNaN(processedLocations[0].lat) && 
              !isNaN(processedLocations[0].lng)) {
          setMapCenter({ 
              lat: processedLocations[0].lat, 
              lng: processedLocations[0].lng 
          });
            console.log('Map center set to:', { lat: processedLocations[0].lat, lng: processedLocations[0].lng });
        }
        };
        
        processLocationsWithImages();
      } catch (error) {
        console.error("Failed to parse locations:", error);
        setLocations([]);
      }
    }
  }, [router.query.locations]);

  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
  }, []);

  const updateDirections = useCallback(() => {
    if (isLoaded && locations.length >= 2 && mapRef.current) {
      clearRoute();
      
      const directionsService = new google.maps.DirectionsService();
      const renderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#1c1917",
          strokeWeight: 4,
          strokeOpacity: 1,
          zIndex: 1,
        },
      });
      
      renderer.setMap(mapRef.current);
      directionsRendererRef.current = renderer;

      const origin = new google.maps.LatLng(locations[0].lat, locations[0].lng);
      const destination = new google.maps.LatLng(locations[locations.length - 1].lat, locations[locations.length - 1].lng);
      const waypoints = locations.slice(1, -1).map(location => ({
        location: new google.maps.LatLng(location.lat, location.lng),
        stopover: true
      }));

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            renderer.setDirections(result);
            
            const legs = result.routes[0].legs;
            const markers: google.maps.LatLngLiteral[] = [];
            
            markers.push(legs[0].start_location.toJSON());
            for (let i = 0; i < legs.length - 1; i++) {
              markers.push(legs[i].end_location.toJSON());
            }
            markers.push(legs[legs.length - 1].end_location.toJSON());
            
            setRouteMarkers(markers);
          } else {
            console.error("Directions request failed. Status:", status);
            clearRoute();
          }
        }
      );
    }
  }, [isLoaded, locations, clearRoute]);

  useEffect(() => {
    if (locations.length >= 2 && mapRef.current) {
      updateDirections();
    }
  }, [locations, updateDirections, mapRef]);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      clearRoute();
      setLocations((items) => {
        const oldIndex = items.findIndex((item) => item.name === active.id);
        const newIndex = items.findIndex((item) => item.name === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, [clearRoute]);

  const handleImagesUpload = async (index: number, files: FileList, onProgress: (progress: number) => void) => {
    try {
      const location = locations[index];
      if (!location) return;

      const currentImages = location.images || [];
      if (currentImages.length + files.length > 5) {
        throw new Error('이미지는 최대 5개까지만 업로드할 수 있습니다.');
      }

      const uploadedImages = await uploadPlaceImages(
        `place-${location.name}-${index}`, 
        Array.from(files), 
        onProgress
      );
      
      setLocations(prev => {
        const newLocations = [...prev];
        newLocations[index] = {
          ...newLocations[index],
          images: [...currentImages, ...uploadedImages]
        };
        return newLocations;
      });
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const handleConfirm = () => {
    router.push({
      pathname: '/routes/map',
      query: { locations: JSON.stringify(locations) },
    });
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;
  
  // 이미지 업로드 중일 때 로딩 화면 표시
  if (isUploadingImages) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-stone-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">이미지 업로드 중...</h2>
          <p className="text-stone-600">잠시만 기다려주세요.</p>
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(uploadProgress).map(([index, progress]) => (
                <div key={index} className="text-sm text-stone-700">
                  위치 {parseInt(index) + 1}: {Math.round(progress)}%
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className='fixed m-2'><BackButton /></div>
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={10}
          options={mapOptions}
          onLoad={(map) => {
            mapRef.current = map;
            if (locations.length >= 2) {
              updateDirections();
            }
          }}
        >
          {routeMarkers.map((position, index) => (
            <DynamicCircleMarker
              key={`marker-${index}`}
              position={position}
              number={index + 1}
            />
          ))}
        </GoogleMap>
      </div>

      <div className="bg-stone-100 p-4">
        <h3 className="text-xl font-semibold mb-2">경로 확인</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={locations.map(loc => loc.name)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {locations.map((location, index) => (
                <SortableItem
                  key={location.name}
                  id={location.name}
                  index={index}
                  name={location.name}
                  images={location.images}
                  onImagesUpload={handleImagesUpload}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <button
          onClick={handleConfirm}
          className="mt-4 w-full bg-stone-200 text-stone-900 rounded-full px-4 py-2 font-medium hover:bg-stone-300 transition-colors"
        >
          3D로 보기
        </button>
      </div>
    </div>
  );
}