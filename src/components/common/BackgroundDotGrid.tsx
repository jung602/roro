import React from 'react';

interface BackgroundDotGridProps {
  dotSize?: number;
  spacing?: number;
  dotColor?: string;
  backgroundColor?: string;
}

const BackgroundDotGrid: React.FC<BackgroundDotGridProps> = ({
  dotSize = 1,
  spacing = 12,
  dotColor = 'rgba(245, 245, 244, 0.2)',
  backgroundColor = '#1c1917'
}) => {
  return (
    <div className="absolute inset-0 w-full h-full -z-10">
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: backgroundColor,
          backgroundImage: `radial-gradient(${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          backgroundPosition: 'center center',
          mask: 'radial-gradient(circle at center, black 70%, transparent 100%)',
          WebkitMask: 'radial-gradient(circle at center, black 60%, transparent 100%)',
        }}
      />
    </div>
  );
};

export default React.memo(BackgroundDotGrid); 