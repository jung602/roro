import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 0, lng: 0 });
  const [routeMarkers, setRouteMarkers] = useState<google.maps.LatLngLiteral[]>([]);
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
        setLocations(parsedLocations);
        if (parsedLocations.length > 0) {
          setMapCenter({ lat: parsedLocations[0].lat, lng: parsedLocations[0].lng });
        }
      } catch (error) {
        console.error("Failed to parse locations:", error);
        setLocations([]);
      }
    }
  }, [router.query.locations]);

  const updateDirections = useCallback(() => {
    if (isLoaded && locations.length >= 2) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: locations[0].address,
          destination: locations[locations.length - 1].address,
          waypoints: locations.slice(1, -1).map(location => ({ location: location.address, stopover: true })),
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            
            // Extract exact route points from the directions result
            const legs = result.routes[0].legs;
            const markers: google.maps.LatLngLiteral[] = [];
            
            // Add start location of first leg
            markers.push(legs[0].start_location.toJSON());
            
            // Add end locations of each leg except the last one (they are waypoints)
            for (let i = 0; i < legs.length - 1; i++) {
              markers.push(legs[i].end_location.toJSON());
            }
            
            // Add end location of last leg
            markers.push(legs[legs.length - 1].end_location.toJSON());
            
            setRouteMarkers(markers);
          } else {
            console.error("Directions request failed. Status:", status);
          }
        }
      );
    }
  }, [isLoaded, locations]);

  useEffect(() => {
    updateDirections();
  }, [updateDirections]);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setLocations((items) => {
        const oldIndex = items.findIndex((item) => item.name === active.id);
        const newIndex = items.findIndex((item) => item.name === over.id);
        
        const newLocations = arrayMove(items, oldIndex, newIndex);
        setTimeout(() => {
          updateDirections();
        }, 0);
        return newLocations;
      });
    }
  }, [updateDirections]);

  const handleImagesUpload = async (index: number, files: FileList, onProgress: (progress: number) => void) => {
    try {
      const location = locations[index];
      if (!location) return;

      const uploadedImages = await uploadPlaceImages(`place-${location.name}-${index}`, Array.from(files), onProgress);
      
      setLocations(prev => {
        const newLocations = [...prev];
        newLocations[index] = {
          ...newLocations[index],
          images: uploadedImages
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
      pathname: '/map',
      query: { locations: JSON.stringify(locations) },
    });
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className='fixed m-2'><BackButton /></div>
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={10}
          options={mapOptions}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#1c1917",
                  strokeWeight: 4,
                  strokeOpacity: 0.7,
                },
              }}
            />
          )}
          {routeMarkers.map((position, index) => (
            <DynamicCircleMarker
              key={index}
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