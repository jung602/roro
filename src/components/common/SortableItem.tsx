import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface SortableItemProps {
  id: string;
  index: number;
  name: string;
  images?: { url: string; path: string; }[];
  onImagesUpload?: (index: number, files: FileList) => Promise<void>;
}

export default function SortableItem({ id, index, name, images = [], onImagesUpload }: SortableItemProps) {
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
      await onImagesUpload(index, e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  return (
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
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-stone-400 hover:text-stone-600 transition-colors p-2 rounded-lg hover:bg-stone-200"
            title="이미지 업로드"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            {...attributes}
            {...listeners}
            className="text-stone-400 hover:text-stone-600 transition-colors p-2 rounded-lg hover:bg-stone-200"
          >
            <DragHandleDots2Icon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, imgIndex) => (
            <div key={imgIndex} className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={image.url}
                alt={`${name} 이미지 ${imgIndex + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      )}
    </li>
  );
} 