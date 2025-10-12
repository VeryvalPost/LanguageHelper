import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FillTheGapsExercise from './FillTheGapsExercise';
import MatchTheSentenceExercise from './MatchTheSentenceExercise';
import TrueFalseExercise from './TrueFalseExercise';
import OpenQuestionsExercise from './OpenQuestionsExercise';
import ABCDExercise from './ABCDExercise';
import DialogueExercise from './DialogueExercise';
import type { Exercise } from '../types/Exercise';
import type { DatabaseExercise } from '../types/DatabaseExercise';
import { DatabaseExerciseUtils } from '../types/DatabaseExercise';

// Safety wrapper for DatabaseExerciseUtils methods
const safeDatabaseExerciseUtils = {
  convertToExercise: (dbExercise?: DatabaseExercise | null) => {
    if (!DatabaseExerciseUtils) {
      console.error('DatabaseExerciseUtils is not available');
      return null;
    }
    return DatabaseExerciseUtils.convertToExercise(dbExercise);
  },
  generatePublicUrl: (uuid: string) => {
    if (!DatabaseExerciseUtils) {
      console.error('DatabaseExerciseUtils is not available');
      return '';
    }
    return DatabaseExerciseUtils.generatePublicUrl(uuid);
  },
  copyToClipboard: async (text: string) => {
    if (!DatabaseExerciseUtils) {
      console.error('DatabaseExerciseUtils is not available');
      return false;
    }
    return DatabaseExerciseUtils.copyToClipboard(text);
  }
};
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { API_CONFIG, getApiUrl  } from '../config/api';
import { ArrowLeft, Share2, Copy, CheckCircle, XCircle } from 'lucide-react';

export default function PublicExerciseView() {
  const { uuid } = useParams<{ uuid: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (uuid) {
      loadPublicExercise(uuid);
    }
  }, [uuid]);

  const loadPublicExercise = async (exerciseUuid: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = getApiUrl(API_CONFIG.ENDPOINTS.GET_PUBLIC_EXERCISE_BY_UUID(exerciseUuid));
      console.log('Fetching public exercise from:', url); // Полезный лог для отладки

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.DEFAULT_HEADERS,
      });

      if (!response.ok) {
          if (response.status === 404) throw new Error('Упражнение не найдено или не является публичным');
          if (response.status === 403) throw new Error('Упражнение не является публичным');
          throw new Error(`Ошибка загрузки: ${response.status}`);
      }
  
      // Типизируем data как any, так как это DTO, а не наш интерфейс
      const data: any = await response.json();
      console.log('Полученные данные с сервера (DTO):', data);
      
      // Проверяем, что упражнение публичное. Используем !! для надежности
      if (data.public !== true) {
        throw new Error('Упражнение не является публичным');
      }
  
      setIsPublic(true);
      
      // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ---
      // Мы не используем convertToExercise, так как структура другая.
      // Вместо этого мы берем данные напрямую из поля exerciseData, которое, судя по логу, уже является объектом.
      const exerciseData = typeof data.exerciseData === 'string' 
        ? JSON.parse(data.exerciseData) // Если это строка, парсим
        : data.exerciseData;            // Если уже объект, используем как есть
  
      // Исправляем дублирование поля type (если есть)
      if (exerciseData && Array.isArray(exerciseData.type)) {
        exerciseData.type = exerciseData.type[0]; // Берем первое значение
      }
      
      // Проверяем, что внутри exerciseData есть все необходимое
      if (exerciseData && exerciseData.type && exerciseData.questions && exerciseData.answers) {
        setExercise(exerciseData); // Устанавливаем упражнение в state
      } else {
        throw new Error('Ошибка парсинга данных упражнения из DTO');
      }
  
    } catch (error) {
      console.error('Error loading public exercise:', error);
      setError(error instanceof Error ? error.message : 'Ошибка загрузки упражнения');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (uuid) {
      const publicUrl = safeDatabaseExerciseUtils.generatePublicUrl(uuid);
      const success = await safeDatabaseExerciseUtils.copyToClipboard(publicUrl);
      
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Загрузка упражнения...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Упражнение не найдено</h1>
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Заголовок с кнопками */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{exercise.type}</h1>
                <p className="text-sm text-gray-600">Публичное упражнение</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isPublic && (
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    copySuccess
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Копировать ссылку
                    </>
                  )}
                </button>
              )}
              
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Публичное</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Содержимое упражнения */}
      <div className="container mx-auto px-4 py-8">
        {exercise.type === "Fill The Gaps" ? (
          <FillTheGapsExercise exercise={exercise} onReset={() => {}} />
        ) : exercise.type === "Match The Sentence" ? (
          <MatchTheSentenceExercise exercise={exercise} onReset={() => {}} />
        ) : exercise.type === "True/False" ? (
          <TrueFalseExercise exercise={exercise} onReset={() => {}} />
        ) : exercise.type === "Open Questions" ? (
          <OpenQuestionsExercise exercise={exercise} onReset={() => {}} />
        ) : exercise.type === "ABCD" ? (
          <ABCDExercise exercise={exercise} onReset={() => {}} />
        ) : exercise.type === "Dialogue" ? (
          <DialogueExercise exercise={exercise} onReset={() => {}} />
        ) : (
          <div className="text-center text-red-600 font-bold">
            Неизвестный тип упражнения: {exercise.type}
          </div>
        )}
      </div>
    </div>
  );
}
