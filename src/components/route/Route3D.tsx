import React from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import ErrorBoundary from '../common/ErrorBoundary';

const Route3DContent = dynamic(() => import('./Route3DContent'), { ssr: false });

export interface Route3DProps {
  path3D: THREE.Vector3[];
  locations: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  }[];
}

const Route3D: React.FC<Route3DProps> = ({ path3D, locations }) => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (path3D.length === 0 || locations.length === 0) {
    return <div>Loading...</div>;
  }

  return <Route3DContent path3D={path3D} locations={locations} />;
};

const Route3DWithErrorBoundary: React.FC<Route3DProps> = (props) => (
  <ErrorBoundary fallback={<div>Error loading 3D content</div>}>
    <Route3D {...props} />
  </ErrorBoundary>
);

export default Route3DWithErrorBoundary; 