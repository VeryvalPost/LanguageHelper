import { useState } from 'react';
import type { Exercise } from '../types/Exercise';

interface Props {
  exercise: Exercise;
  onReset: () => void;
}

export default function OpenQuestionsExercise({ exercise, onReset }: Props) {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, boolean>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  if (!exercise || !exercise.questions) return null;
  const checkAnswers = () => {
    const newFeedback: Record<number, boolean> = {};
    exercise.answers.forEach((correct, idx) => {
      newFeedback[idx] = (userAnswers[idx] || '').trim().toLowerCase() === correct.trim().toLowerCase();
    });
    setFeedback(newFeedback);
    setShowFeedback(true);
  };
  const reset = () => {
    setUserAnswers({});
    setFeedback({});
    setShowFeedback(false);
    onReset();
  };
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Open Questions</h2>
        <p className="mb-6 whitespace-pre-line">{exercise.createdText}</p>
        <div className="space-y-6">
          {exercise.questions.map((question, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <span className="font-medium">{idx + 1}. {question}</span>
              <input
                value={userAnswers[idx] || ''}
                onChange={e => setUserAnswers(a => ({ ...a, [idx]: e.target.value }))}
                disabled={showFeedback}
                className={`px-3 py-2 rounded border ${showFeedback ? (feedback[idx] ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-200 bg-white'} mt-2`}
                placeholder="Введите ответ..."
              />
              {showFeedback && (
                <span className={`ml-1 font-bold ${feedback[idx] ? 'text-green-600' : 'text-red-600'}`}>{feedback[idx] ? '✔' : '✘'}</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-4">
          {!showFeedback && (
            <button
              onClick={checkAnswers}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={Object.keys(userAnswers).length !== exercise.questions.length}
            >Проверить</button>
          )}
          <button
            onClick={reset}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >Сбросить</button>
        </div>
      </div>
    </div>
  );
}
