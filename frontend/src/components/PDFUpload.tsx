import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import type { Exercise } from '../types/Exercise';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface PDFUploadProps {
  onExerciseLoaded: (exercise: Exercise) => void;
  onCreateTrueFalseExercise?: () => void;
}

export default function PDFUpload({ onExerciseLoaded, onCreateTrueFalseExercise }: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPDF = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Пожалуйста, выберите PDF-файл');
      return;
    }
  
    setIsUploading(true);
    setError(null);
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetchWithAuth('http://localhost:8080/api/pdf/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка загрузки: ${response.status} ${errorText}`);
      }
  
      const exercise: Exercise = await response.json();
      
      // Бэкенд уже сохраняет упражнение при загрузке PDF, поэтому
      // дополнительное сохранение не требуется, чтобы избежать дублирования
      // Если нужно принудительно сохранить, используйте:
      // await ExerciseSaver.saveExerciseWithContext(exercise, {
      //   source: 'pdf-upload',
      //   metadata: {
      //     fileName: file.name,
      //     fileSize: file.size,
      //     uploadedAt: new Date().toISOString()
      //   }
      // });
      
      onExerciseLoaded(exercise);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadPDF(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadPDF(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <FileText className="mx-auto h-16 w-16 text-blue-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Exercise Helper
        </h1>
        <p className="text-gray-600">
          Upload a PDF file to generate an interactive exercise
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Processing PDF...
            </p>
            <p className="text-sm text-gray-500">
              This may take a few moments
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {dragActive ? 'Drop your PDF here' : 'Upload your PDF file'}
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop or click to select
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}
      {/* Кнопка создания нового упражнения */}
      {onCreateTrueFalseExercise && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onCreateTrueFalseExercise}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create new exercise True/False type
          </button>
        </div>
      )}
    </div>
  );
}