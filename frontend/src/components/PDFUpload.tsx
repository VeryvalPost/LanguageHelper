import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import type { Exercise } from '../types/Exercise';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface PDFUploadProps {
  onExerciseLoaded: (exercise: Exercise) => void;
  onCreateTrueFalseExercise?: () => void;
}

const STUDENT_LEVELS = [
  { label: 'A1 (Beginner)', value: 'A1' },
  { label: 'A2 (Elementary/Pre-Intermediate)', value: 'A2' },
  { label: 'B1 (Intermediate)', value: 'B1' },
  { label: 'B2 (Upper Intermediate)', value: 'B2' },
  { label: 'C1 (Advanced)', value: 'C1' },
  { label: 'C2 (Proficiency)', value: 'C2' }
];
const STUDENT_AGES = [
  { label: 'Ребенок', value: 'child' },
  { label: 'Подросток', value: 'teen' },
  { label: 'Взрослый', value: 'adult' }
];

// Типы упражнений для лучшей типобезопасности
type ExerciseType = 'truefalse' | 'abcd' | 'open' | 'dialogue';

export default function PDFUpload({ onExerciseLoaded, onCreateTrueFalseExercise }: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentLevel, setStudentLevel] = useState('A2');
  const [studentAge, setStudentAge] = useState('adult');
  const [topic, setTopic] = useState('');

  const uploadFile = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/bmp',
      'image/gif',
      'image/tiff',
      'image/x-tiff',
    ];
    const allowedExts = ['.pdf','.jpg','.jpeg','.png','.bmp','.gif','.tiff','.tif'];
    
    const isAllowed = allowedTypes.includes(file.type) || allowedExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      setError('Пожалуйста, выберите файл: PDF, JPG, JPEG, PNG, BMP, GIF, TIFF, TIF');
      return;
    }
    
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetchWithAuth('/api/pdf/upload', {
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
      await import("../utils/ExerciseSaver").then(({ ExerciseSaver }) => 
        ExerciseSaver.saveExerciseWithContext(exercise, { source: 'api-generation' })
      );
      onExerciseLoaded(exercise);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  // УНИВЕРСАЛЬНЫЙ метод для создания всех типов упражнений
  const handleCreateExercise = async (exerciseType: ExerciseType) => {
    if (!topic.trim()) {
      setError('Пожалуйста, введите тему для упражнения');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    const params = new URLSearchParams({
      level: studentLevel,
      age: studentAge,
      topic
    });

    try {
      console.log(`Creating ${exerciseType} exercise with params:`, { level: studentLevel, age: studentAge, topic });
      
      const response = await fetchWithAuth(`/api/exercise/${exerciseType}?${params.toString()}`, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
        
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Ошибка создания ${exerciseType}: ${response.status} ${errorText}`);
      }

      const exercise: Exercise = await response.json();
      console.log('Exercise created successfully:', exercise);
      
      await import("../utils/ExerciseSaver").then(({ ExerciseSaver }) => 
        ExerciseSaver.saveExerciseWithContext(exercise, { source: 'api-generation' })
      );
      
      onExerciseLoaded(exercise);
    } catch (error) {
      console.error('Error creating exercise:', error);
      setError(error instanceof Error ? error.message : `Ошибка создания ${exerciseType}`);
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
      uploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Блок 1: Загрузка PDF или изображения */}
      <div className="text-center mb-8">
        <FileText className="mx-auto h-16 w-16 text-blue-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          MIA.AI Exercise Creator
        </h1>
        <p className="text-gray-600">
          Upload a PDF or image file (PDF, JPG, JPEG, PNG, BMP, GIF, TIFF, TIF) to generate an interactive exercise
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
          accept=".pdf,.jpg,.jpeg,.png,.bmp,.gif,.tiff,.tif"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Processing file...
            </p>
            <p className="text-sm text-gray-500">
              This may take a few moments
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {dragActive ? 'Drop your PDF or image here' : 'Upload your PDF or image file'}
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop or click to select (PDF, JPG, JPEG, PNG, BMP, GIF, TIFF, TIF)
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}
      
      {/* Разделительная линия */}
      <div className="relative flex items-center my-10">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-gray-400">или</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      {/* Блок 2: Создание собственного упражнения */}
      <div className="mb-10 border rounded-xl bg-white/60 p-8 shadow flex flex-col gap-6">
        <h2 className="text-2xl font-semibold mb-2 text-center">Создать собственный текст для упражнения</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-1 font-medium">Уровень студента</label>
            <select
              className="border rounded px-3 py-2 w-full focus:outline-blue-400"
              value={studentLevel}
              onChange={e => setStudentLevel(e.target.value)}>
              {STUDENT_LEVELS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-1 font-medium">Возраст студента</label>
            <select
              className="border rounded px-3 py-2 w-full focus:outline-blue-400"
              value={studentAge}
              onChange={e => setStudentAge(e.target.value)}>
              {STUDENT_AGES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-700 mb-1 font-medium">Тема</label>
          <input
            className="border rounded px-3 py-2 w-full focus:outline-blue-400"
            type="text"
            value={topic}
            placeholder="Введите тему/контекст для упражнения"
            onChange={e => setTopic(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center mt-2 flex-wrap">
          <button
            onClick={() => handleCreateExercise('truefalse')}
            disabled={isUploading}
            className="min-w-[230px] flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60">
            {isUploading ? 'Создание...' : 'Создать упражнение True/False'}
          </button>
          <button
            onClick={() => handleCreateExercise('abcd')}
            disabled={isUploading}
            className="min-w-[230px] flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60">
            {isUploading ? 'Создание...' : 'Создать ABCD questions по тексту'}
          </button>
          <button
            onClick={() => handleCreateExercise('open')}
            disabled={isUploading}
            className="min-w-[230px] flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60">
            {isUploading ? 'Создание...' : 'Создать Open questions по тексту'}
          </button>
          <button
            onClick={() => handleCreateExercise('dialogue')}
            disabled={isUploading}
            className="min-w-[230px] flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-60">
            {isUploading ? 'Создание...' : 'Создать диалог на любую тему'}
          </button>
        </div>
        
        {isUploading && (
          <div className="text-center text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Создание упражнения... Это может занять несколько секунд</p>
          </div>
        )}
      </div>
    </div>
  );
}