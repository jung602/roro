import React from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const Route3DContent = dynamic(() => import('./Route3DContent'), { ssr: false });

interface Route3DProps {
  path3D: THREE.Vector3[];
  locations: {name: string, address: string}[];
}

const Route3D: React.FC<Route3DProps> = ({ path3D, locations }) => {
  if (typeof window === 'undefined') {
    return null; // 서버 사이드에서는 아무것도 렌더링하지 않음
  }

  if (path3D.length === 0 || locations.length === 0) {
    return <div>Loading...</div>;
  }

  return <Route3DContent path3D={path3D} locations={locations} />;
};

export default Route3D;