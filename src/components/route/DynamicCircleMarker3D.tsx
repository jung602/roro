import React from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const CircleMarker3D = dynamic(
  () => import('./CircleMarker3D'),
  { ssr: false }
);

export interface DynamicCircleMarker3DProps {
  position: THREE.Vector3;
  number: number;
}

const DynamicCircleMarker3D: React.FC<DynamicCircleMarker3DProps> = (props) => {
  return <CircleMarker3D {...props} />;
};

export default DynamicCircleMarker3D; 