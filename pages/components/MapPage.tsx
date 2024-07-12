import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import * as THREE from 'three';

const DynamicRoute3D = dynamic(() => import('./Route3D'), {
  ssr: false,
});

const center = { lat: 37.7749, lng: -122.4194 };

const convertToLocalCoord = (lat: number, lng: number, centerLat: number, centerLng: number) => {
  const R = 6371;
  const dLat = (lat - centerLat) * Math.PI / 180;
  const dLon = (lng - centerLng) * Math.PI / 180;
  const x = R * dLon * Math.cos(centerLat * Math.PI / 180);
  const z = -R * dLat;
  return new THREE.Vector3(x, 0, z);
};

const MapPage: React.FC = () => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [path3D, setPath3D] = useState<THREE.Vector3[]>([]);
  const [locationList, setLocationList] = useState<{name: string, address: string}[]>([]);
  const router = useRouter();
  const { locations } = router.query;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && locations) {
      try {
        const parsedLocations = JSON.parse(locations as string) as {name: string, address: string}[];
        setLocationList(parsedLocations);
      } catch (error) {
        console.error("Failed to parse locations:", error);
        setLocationList([]);
      }
    }
  }, [locations]);

  useEffect(() => {
    if (isLoaded && locationList.length >= 2 && !loadError) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: locationList[0].address,
          destination: locationList[locationList.length - 1].address,
          waypoints: locationList.slice(1, -1).map(location => ({ location: location.address, stopover: true })),
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            if (result.routes[0].overview_path) {
              const path = result.routes[0].overview_path.map(point =>
                convertToLocalCoord(point.lat(), point.lng(), center.lat, center.lng)
              );
              setPath3D(path);
            }
          } else {
            console.error("Directions request failed. Status:", status);
          }
        }
      );
    }
  }, [isLoaded, locationList, loadError]);

  return (
    <div className="flex flex-col h-[100dvh] bg-yellow-400 text-white">
      <div className="flex-1 p-4 relative">
        <div className="absolute inset-0 dot-grid"></div>
        <div className="h-full relative z-10">
          <DynamicRoute3D path3D={path3D} locations={locationList} />
        </div>
      </div>
      <div className="bg-white text-black p-4 rounded-t-3xl">
        <h3 className="text-xl font-bold mb-2">Road</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Places</p>
            <p className="text-lg font-bold">{locationList.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">By Walk</p>
            <p className="text-lg font-bold">
              {directions && Math.floor(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) / 60)}:
              {directions && String(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) % 60).padStart(2, '0')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Long</p>
            <p className="text-lg font-bold">
              {directions && (directions.routes[0].legs.reduce((total, leg) => total + leg.distance!.value, 0) / 1000).toFixed(1)} km
            </p>
          </div>
        </div>
        <div className="mt-2 flex space-x-2">
          {locationList.map((_, index) => (
            <div key={index} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-black">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapPage;