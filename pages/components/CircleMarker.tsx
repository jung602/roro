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
    >
      <div
        style={{
          background: "black",
          color: "white",
          padding: "5px 10px",
          borderRadius: "50%",
          fontSize: "16px",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "30px",
          height: "30px",
        }}
      >
        {number}
      </div>
    </OverlayView>
  );
};

export default CircleMarker;