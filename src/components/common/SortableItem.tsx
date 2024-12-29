import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';

interface SortableItemProps {
  id: string;
  index: number;
  name: string;
}

export default function SortableItem({ id, index, name }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-stone-100 p-4 rounded-lg flex items-center justify-between"
    >
      <div className="flex items-center">
        <div className="w-6 h-6 mr-2 bg-stone-900 rounded-full flex items-center justify-center text-sm font-medium text-stone-100">
          {index + 1}
        </div>
        <span className="font-medium">{name}</span>
      </div>
      <button
        {...attributes}
        {...listeners}
        className="text-stone-400 hover:text-stone-600 transition-colors"
      >
        <DragHandleDots2Icon className="w-5 h-5" />
      </button>
    </li>
  );
} 