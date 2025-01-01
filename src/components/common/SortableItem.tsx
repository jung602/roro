import React, { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface SortableItemProps {
  id: string;
  index: number;
  name: string;
  images?: { url: string; path: string; }[];
  onImagesUpload?: (index: number, files: FileList, onProgress: (progress: number) => void) => Promise<void>;
}

export default function SortableItem({ id, index, name, images = [], onImagesUpload }: SortableItemProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onImagesUpload) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        await onImagesUpload(index, e.target.files, (progress) => {
          setUploadProgress(progress);
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        e.target.value = ''; // Reset input
      }
    }
  };

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className="bg-stone-100 p-4 rounded-lg flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 mr-2 bg-stone-900 rounded-full flex items-center justify-center text-sm font-medium text-stone-100">
              {index + 1}
            </div>
            <span className="font-medium">{name}</span>
          </div>
          <div {...attributes} {...listeners}>
            <DragHandleDots2Icon className="w-5 h-5 cursor-grab" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {images.map((image, imgIndex) => (
            <div
              key={image.url}
              className="relative w-12 h-12 cursor-pointer"
              onClick={() => setSelectedImage(image.url)}
            >
              <Image
                src={image.url}
                alt={`${name} 이미지 ${imgIndex + 1}`}
                fill
                className="object-cover rounded"
              />
            </div>
          ))}
          
          {isUploading && (
            <div className="relative w-12 h-12 bg-stone-200 rounded flex items-center justify-center overflow-hidden">
              <div 
                className="absolute inset-0 bg-stone-300 transition-all duration-200"
                style={{ transform: `translateY(${100 - uploadProgress}%)` }}
              />
              <span className="relative text-xs font-medium z-10">
                {Math.round(uploadProgress)}%
              </span>
            </div>
          )}

          {!isUploading && images.length < 5 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 bg-stone-200 rounded flex items-center justify-center hover:bg-stone-300 transition-colors"
            >
              <ImageIcon size={20} className="text-stone-600" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </li>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] aspect-auto">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 transition-colors"
            >
              <X size={24} />
            </button>
            <Image
              src={selectedImage}
              alt="확대된 이미지"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
} 