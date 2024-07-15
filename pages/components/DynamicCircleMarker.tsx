import React from 'react';
import dynamic from 'next/dynamic';

const CircleMarker = dynamic(
  () => import('./CircleMarker'),
  { ssr: false }
);

interface DynamicCircleMarkerProps {
  position: google.maps.LatLngLiteral;
  number: number;
}

const DynamicCircleMarker: React.FC<DynamicCircleMarkerProps> = (props) => {
  return <CircleMarker {...props} />;
};

export default DynamicCircleMarker;