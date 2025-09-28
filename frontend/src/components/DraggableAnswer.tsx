import React from 'react';
import { GripVertical } from 'lucide-react';

interface DraggableAnswerProps {
  answer: string;
  index: number;
  isUsed: boolean;
  onDragStart: (index: number) => void;
}

export default function DraggableAnswer({ 
  answer, 
  index, 
  isUsed, 
  onDragStart 
}: DraggableAnswerProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString());
    onDragStart(index);
  };

  return (
    <div
      draggable={!isUsed}
      onDragStart={handleDragStart}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium
        transition-all duration-200 select-none
        ${isUsed 
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' 
          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing hover:scale-105'
        }
      `}
    >
      {!isUsed && <GripVertical className="h-4 w-4 text-gray-400" />}
      {answer}
    </div>
  );
}