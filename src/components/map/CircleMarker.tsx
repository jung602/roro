import React from 'react';
import { OverlayView } from '@react-google-maps/api';

interface CircleMarkerProps {
  position: google.maps.LatLngLiteral;
  number: number;
}

const CircleMarker: React.FC<CircleMarkerProps> = ({ position, number }) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -(height / 2),
      })}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: '#1c1917',
          border: '1.5px solid #f5f5f4',
          borderRadius: '50%',
          color: '#f5f5f4',
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          transform: 'translate(0, -10px)',
        }}
      >
        {number}
      </div>
    </OverlayView>
  );
};

export default CircleMarker; 