import type { Exercise } from '../types/Exercise';

interface DialogueExerciseProps {
  exercise: Exercise;
  onReset: () => void;
}

export default function DialogueExercise({ exercise, onReset }: DialogueExerciseProps) {
  // Здесь можно сделать вариант "ответь" или просто показать диалог целиком
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dialogue</h2>
        <p className="mb-6 whitespace-pre-line">{exercise.createdText}</p>
        {exercise.questions?.length > 0 && (
          <div className="mb-6">
            <span className="block font-semibold mb-2">Вопросы по диалогу:</span>
            <ul className="list-disc pl-6 space-y-1">
              {exercise.questions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-8 flex gap-4">
          <button
            onClick={onReset}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >Сбросить</button>
        </div>
      </div>
    </div>
  );
}
