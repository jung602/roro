import React, { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Location } from '@/types/route';

interface MapComponentProps {
  locations: Location[];
  onMapLoad?: (map: google.maps.Map) => void;
  showDirections?: boolean;
  height?: string;
  width?: string;
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const MapComponent: React.FC<MapComponentProps> = ({
  locations,
  onMapLoad,
  showDirections = true,
  height = '100%',
  width = '100%',
  className = '',
}) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({ lat: 37.5665, lng: 126.9780 });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  useEffect(() => {
    if (locations.length > 0 && locations[0].lat && locations[0].lng) {
      setCenter({ lat: locations[0].lat, lng: locations[0].lng });
    }
  }, [locations]);

  useEffect(() => {
    if (isLoaded && locations.length >= 2 && showDirections) {
      const directionsService = new google.maps.DirectionsService();
      
      const origin = locations[0];
      const destination = locations[locations.length - 1];
      const waypoints = locations.slice(1, -1).map(location => ({
        location: { lat: location.lat || 0, lng: location.lng || 0 },
        stopover: true,
      }));
      
      directionsService.route(
        {
          origin: { lat: origin.lat || 0, lng: origin.lng || 0 },
          destination: { lat: destination.lat || 0, lng: destination.lng || 0 },
          waypoints: waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error(`Directions request failed: ${status}`);
          }
        }
      );
    }
  }, [isLoaded, locations, showDirections]);

  if (loadError) {
    return <div>지도를 불러오는 중 오류가 발생했습니다.</div>;
  }

  if (!isLoaded) {
    return <div>지도를 불러오는 중...</div>;
  }

  return (
    <div style={{ height, width }} className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={center}
        onLoad={onMapLoad ? onMapLoad : undefined}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
        }}
      >
        {directions && showDirections ? (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
            }}
          />
        ) : (
          locations.map((location, index) => (
            <Marker
              key={index}
              position={{ lat: location.lat || 0, lng: location.lng || 0 }}
              label={{ text: (index + 1).toString(), color: 'white' }}
            />
          ))
        )}
      </GoogleMap>
    </div>
  );
};

export default MapComponent; 