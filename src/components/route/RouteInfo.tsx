import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface RouteInfoProps {
  title: string;
  userNickname?: string;
  userProfileImage?: string;
  placesCount: number;
  duration?: number;
  distance?: number;
  isEditing?: boolean;
  canEdit?: boolean;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  onSaveClick?: () => void;
  onCancelEdit?: () => void;
}

const RouteInfo: React.FC<RouteInfoProps> = ({
  title,
  userNickname,
  userProfileImage,
  placesCount,
  duration,
  distance,
  isEditing,
  canEdit,
  onEditClick,
  onDeleteClick,
  onSaveClick,
  onCancelEdit,
}) => {
  return (
    <div className="bg-stone-100 text-stone-900 p-4 rounded">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="flex items-center gap-4">
          {canEdit && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={onSaveClick}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    저장
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onEditClick}
                    className="bg-stone-200 text-stone-900 px-4 py-2 rounded-lg"
                  >
                    편집
                  </button>
                  <button
                    onClick={onDeleteClick}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
              {userProfileImage ? (
                <Image
                  src={userProfileImage}
                  alt={userNickname || '사용자'}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-stone-400" />
              )}
            </div>
            <span className="text-sm text-stone-600">{userNickname || '사용자'}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-stone-500">Places</p>
          <p className="text-lg font-semibold">{placesCount}</p>
        </div>
        <div>
          <p className="text-sm text-stone-500">By Walk</p>
          <p className="text-lg font-semibold">
            {duration != null && (
              `${Math.floor(duration)}:${String(duration % 60).padStart(2, '0')}`
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-stone-500">Long</p>
          <p className="text-lg font-semibold">
            {distance != null && `${distance.toFixed(1)} km`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RouteInfo; 