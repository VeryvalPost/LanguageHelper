import { useState } from 'react';
import type { Exercise } from '../types/Exercise';

interface ABCDExerciseProps {
  exercise: Exercise;
  onReset: () => void;
}

const CHOICES = ['A', 'B', 'C', 'D'];

export default function ABCDExercise({ exercise, onReset }: ABCDExerciseProps) {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, boolean>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  if (!exercise || !exercise.questions) return null;
  const checkAnswers = () => {
    const newFeedback: Record<number, boolean> = {};
    exercise.questions.forEach((_, idx) => {
      newFeedback[idx] = userAnswers[idx]?.toUpperCase() === exercise.answers[idx]?.toUpperCase();
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ABCD</h2>
        <p className="mb-6 whitespace-pre-line">{exercise.createdText}</p>
        <div className="space-y-6">
          {exercise.questions.map((question, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <span className="font-medium">{idx + 1}. {question}</span>
              <div className="flex gap-4">
                {CHOICES.map(opt => (
                  <label key={opt} className={`cursor-pointer px-3 py-2 border rounded-lg transition-colors
                    ${userAnswers[idx] === opt ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
                    ${showFeedback && exercise.answers[idx]?.toUpperCase() === opt ? 'border-green-400 bg-green-50 text-green-800' : ''}
                  `}>
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={opt}
                      checked={userAnswers[idx] === opt}
                      disabled={showFeedback}
                      onChange={() => setUserAnswers(a => ({ ...a, [idx]: opt }))}
                      className="mr-1"
                    />
                    {opt}
                  </label>
                ))}
                {showFeedback && (
                  <span className={`ml-4 font-bold ${feedback[idx] ? 'text-green-600' : 'text-red-600'}`}>{feedback[idx] ? '✔' : '✘'}</span>
                )}
              </div>
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
