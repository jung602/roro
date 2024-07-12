import React from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

const Route3DContent = dynamic(() => import('./Route3DContent'), { ssr: false });

interface Route3DProps {
  path3D: THREE.Vector3[];
  locations: {name: string, address: string}[];
}

const Route3D: React.FC<Route3DProps> = ({ path3D, locations }) => {
  if (path3D.length === 0 || locations.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 100, 0], up: [0, 0, -1] }}>
      <ambientLight intensity={5} />
      <Route3DContent path3D={path3D} locations={locations} />
    </Canvas>
  );
};

export default Route3D;