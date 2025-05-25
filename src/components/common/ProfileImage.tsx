import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface ProfileImageProps {
  src: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ 
  src, 
  alt = '사용자', 
  size = 32,
  className = ''
}) => {
  if (!src) {
    return <User size={size * 0.625} className="text-stone-400" />;
  }

  try {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
      />
    );
  } catch (error) {
    console.error('프로필 이미지 렌더링 실패:', error);
    return <User size={size * 0.625} className="text-stone-400" />;
  }
};

export default ProfileImage; 