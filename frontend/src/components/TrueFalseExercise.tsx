import { useState, useEffect, useRef } from 'react';
import type { Exercise } from '../types/Exercise';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { ExerciseSaver } from '../utils/ExerciseSaver';

interface TrueFalseExerciseProps {
  exercise?: Exercise;
  onExerciseLoaded?: (exercise: Exercise) => void;
  onReset: () => void;
}

const FETCH_TIMEOUT = 40000; // Таймаут 40 секунд


export default function TrueFalseExercise({ exercise, onExerciseLoaded, onReset }: TrueFalseExerciseProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, 'TRUE' | 'FALSE' | null>>({});
  const [feedback, setFeedback] = useState<Record<number, boolean>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const hasFetched = useRef(false); // Флаг для предотвращения двойных запросов

  const fetchExerciseData = async () => {
    if (hasFetched.current) {
      console.log('Fetch skipped: already fetched');
      return;
    }
    hasFetched.current = true;
    console.log('Initiating fetchExerciseData');

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const response = await fetchWithAuth('http://localhost:8080/api/exercise/truefalse', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Отключаем кэширование
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Парсим ответ как JSON
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Failed to parse response as JSON: ${(e as Error).message}`);
      }

      // Логируем сырой ответ для отладки
      console.log('Raw response:', JSON.stringify(data, null, 2));

      // Проверяем наличие ошибки в ответе
      if (data.error) {
        throw new Error(`Server error: ${data.error.message || 'Unknown error'}`);
      }

      // Проверяем структуру ответа
      if (!data.type || !data.createdText || !data.questions || !data.answers) {
        throw new Error('Invalid response structure: missing type, createdText, questions, or answers');
      }

      // Сохраняем упражнение в БД (в отличие от других типов упражнений, 
      // которые сохраняются при загрузке PDF, True/False упражнения генерируются 
      // отдельно и требуют явного сохранения)
      await ExerciseSaver.saveExerciseWithContext(data, {
        source: 'api-generation',
        metadata: {
          generatedAt: new Date().toISOString(),
          exerciseType: 'True/False'
        }
      });
      
      onExerciseLoaded?.(data);
    } catch (error) {
      console.error('Fetch error:', error);
      if ((error as Error).name === 'AbortError') {
        setError('Request timed out after 40 seconds');
      } else {
        setError((error as Error).message || 'Failed to load exercise');
      }
    } finally {
      setLoading(false);
      hasFetched.current = false; // Сбрасываем флаг после завершения
    }
  };

  useEffect(() => {
    if (!exercise && onExerciseLoaded && !loading && !hasFetched.current) {
      fetchExerciseData();
    }
  }, [exercise, onExerciseLoaded]); // Зависимости без loading

  const handleManualRetry = () => {
    fetchExerciseData();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto"></div>
        <div className="text-lg mt-4 text-gray-700">Creating True/False Exercise... Please wait</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={handleManualRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!exercise || !exercise.questions) {
    return null;
  }

  const checkAnswers = () => {
    const newFeedback: Record<number, boolean> = {};
    exercise.questions.forEach((_, idx) => {
      newFeedback[idx] = userAnswers[idx] === exercise.answers[idx];
    });
    setFeedback(newFeedback);
    setShowFeedback(true);
  };

  const resetExercise = () => {
    setUserAnswers({});
    setFeedback({});
    setShowFeedback(false);
    onReset();
  };

  const allQuestionsAnswered = Object.keys(userAnswers).length === exercise.questions.length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">True/False</h2>
        <p className="mb-6 whitespace-pre-line">{exercise.createdText}</p>
        <div className="space-y-6">
          {exercise.questions.map((question, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <span className="font-medium">{idx + 1}.</span>
              <span className="flex-1">{question}</span>
              <div className="flex gap-2">
                {['TRUE', 'FALSE'].map(option => (
                  <button
                    key={option}
                    className={`px-4 py-2 rounded-lg border transition-all duration-200
                      ${userAnswers[idx] === option
                        ? 'bg-blue-100 border-blue-400 text-blue-800'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-400'}
                      ${showFeedback
                        ? (exercise.answers[idx] === option
                            ? 'border-green-400 bg-green-50 text-green-800'
                            : userAnswers[idx] === option
                              ? 'border-red-400 bg-red-50 text-red-800'
                              : '')
                        : ''}
                    `}
                    onClick={() => setUserAnswers(a => ({ ...a, [idx]: option as 'TRUE' | 'FALSE' }))}
                    disabled={showFeedback}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {showFeedback && (
                <span className={`ml-4 font-bold ${feedback[idx] ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback[idx] ? '✔' : '✘'}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-4">
          {!showFeedback && (
            <button
              onClick={checkAnswers}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={!allQuestionsAnswered}
            >
              Проверить
            </button>
          )}
          <button
            onClick={resetExercise}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
}