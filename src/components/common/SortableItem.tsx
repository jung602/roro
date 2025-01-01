import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { X } from 'lucide-react';

interface SortableItemProps {
  id: string;
  index: number;
  name: string;
  images?: { url: string; path: string; }[];
  onImagesUpload: (index: number, files: FileList, onProgress: (progress: number) => void) => void;
  onImageDelete?: (index: number, imageIndex: number) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ 
  id, 
  index, 
  name, 
  images, 
  onImagesUpload,
  onImageDelete 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const currentImages = images?.length || 0;
      const newImages = event.target.files.length;
      
      if (currentImages + newImages > 5) {
        alert('이미지는 최대 5개까지만 업로드할 수 있습니다.');
        return;
      }

      setIsUploading(true);
      setIsCompressing(true);
      setUploadProgress(0);
      
      try {
        await onImagesUpload(index, event.target.files, (progress) => {
          if (progress > 0) {
            setIsCompressing(false);
            setUploadProgress(progress);
          }
        });
      } finally {
        setIsUploading(false);
        setIsCompressing(false);
        setUploadProgress(0);
        if (event.target) {
          event.target.value = '';
        }
      }
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            ⋮⋮
          </div>
          <span className="font-medium">{index + 1}. {name}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="text-sm text-stone-500 hover:text-stone-700">
              {images?.length ? '이미지 추가' : '이미지 업로드'}
              {images?.length ? ` (${images.length}/5)` : ''}
            </span>
          </label>
        </div>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto py-1">
        {(images || []).map((image, imageIndex) => (
          <div key={imageIndex} className="relative flex-shrink-0 group">
            <img
              src={image.url}
              alt={`${name} 이미지 ${imageIndex + 1}`}
              className="w-12 h-12 object-cover rounded-md"
              style={{ minWidth: '48px' }}
            />
            {onImageDelete && (
              <button
                onClick={() => onImageDelete(index, imageIndex)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-stone-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
            )}
          </div>
        ))}
        {isUploading && (
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-stone-200 rounded-md flex items-center justify-center overflow-hidden">
              {isCompressing ? (
                <span className="text-xs font-medium text-stone-600">압축중...</span>
              ) : (
                <>
                  <div 
                    className="absolute inset-0 bg-stone-300 transition-all duration-200"
                    style={{ transform: `translateY(${100 - uploadProgress}%)` }}
                  />
                  <span className="relative text-xs font-medium z-10">
                    {Math.round(uploadProgress)}%
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
};

export default SortableItem; 