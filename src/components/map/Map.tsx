import React from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';

interface MapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  children?: React.ReactNode;
}

const Map: React.FC<MapProps> = ({ center, zoom, children }) => {
  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
      >
        {children}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map; 