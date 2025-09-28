import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface DropZoneProps {
  onDrop: (answerIndex: number) => boolean;
  droppedAnswer: string | null;
  isCorrect: boolean | null;
  showFeedback: boolean;
}

export default function DropZone({ 
  onDrop, 
  droppedAnswer, 
  isCorrect, 
  showFeedback 
}: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const answerIndex = parseInt(e.dataTransfer.getData('text/plain'));
    onDrop(answerIndex);
  };

  const getStyles = () => {
    if (droppedAnswer) {
      if (showFeedback) {
        return isCorrect
          ? 'bg-green-100 border-green-300 text-green-800'
          : 'bg-red-100 border-red-300 text-red-800 animate-pulse';
      }
      return 'bg-blue-50 border-blue-300 text-blue-800';
    }
    
    return dragOver
      ? 'bg-blue-50 border-blue-400 border-dashed'
      : 'bg-gray-50 border-gray-300 border-dashed hover:border-gray-400';
  };

  return (
    <span
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        inline-flex items-center gap-1 px-3 py-1 mx-1 rounded-md border-2 
        min-w-[120px] min-h-[32px] text-sm font-medium transition-all duration-200
        ${getStyles()}
      `}
    >
      {droppedAnswer ? (
        <>
          {showFeedback && (
            isCorrect ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )
          )}
          {droppedAnswer}
        </>
      ) : (
        <span className="text-gray-400 text-xs">Drop here</span>
      )}
    </span>
  );
}