import React, { useState } from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';
import type { Exercise, DroppedAnswer } from '../types/Exercise';

interface MatchTheSentenceExerciseProps {
  exercise: Exercise;
  onReset: () => void;
}

export default function MatchTheSentenceExercise({ exercise, onReset }: MatchTheSentenceExerciseProps) {
  const [droppedAnswers, setDroppedAnswers] = useState<DroppedAnswer[]>([]);
  const [feedback, setFeedback] = useState<Record<number, boolean>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
  const [usedAnswers, setUsedAnswers] = useState<Set<number>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Сопоставление: questionIndex -> правильный answerIndex
  const correctAnswers = exercise.dictionary.reduce((acc, item) => {
    acc[item.question] = item.answer;
    return acc;
  }, {} as Record<number, number>);

  const handleDrop = (questionIndex: number) => (answerIndex: number) => {
    const correctAnswerIndex = correctAnswers[questionIndex];
    const isCorrect = answerIndex === correctAnswerIndex;

    // Удаляем старый ответ для этого вопроса
    const existingAnswer = droppedAnswers.find(da => da.questionIndex === questionIndex);
    if (existingAnswer) {
      setUsedAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(existingAnswer.answerIndex);
        return newSet;
      });
    }

    // Добавляем новый ответ
    const newAnswer: DroppedAnswer = {
      questionIndex,
      answerIndex,
      answerText: exercise.answers[answerIndex]
    };

    setDroppedAnswers(prev =>
      prev.filter(da => da.questionIndex !== questionIndex).concat(newAnswer)
    );
    setUsedAnswers(prev => new Set([...prev, answerIndex]));
    setFeedback(prev => ({ ...prev, [questionIndex]: isCorrect }));
    setShowFeedback(prev => ({ ...prev, [questionIndex]: true }));

    // Если неверно — убираем через 1.5 сек
    if (!isCorrect) {
      setTimeout(() => {
        setDroppedAnswers(prev =>
          prev.filter(da => da.questionIndex !== questionIndex)
        );
        setUsedAnswers(prev => {
          const newSet = new Set(prev);
          newSet.delete(answerIndex);
          return newSet;
        });
        setShowFeedback(prev => ({ ...prev, [questionIndex]: false }));
      }, 1500);
    }
    return isCorrect;
  };

  const getAnswerForQuestion = (questionIndex: number) => {
    return droppedAnswers.find(da => da.questionIndex === questionIndex);
  };

  const isComplete = droppedAnswers.length === exercise.questions.length &&
    droppedAnswers.every(da => feedback[da.questionIndex]);

  const resetExercise = () => {
    setDroppedAnswers([]);
    setFeedback({});
    setShowFeedback({});
    setUsedAnswers(new Set());
  };

  // Drag & Drop для ответов
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {exercise.type}
          </h2>
          <p className="text-gray-600">
            Match each sentence with the correct answer
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isComplete && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Complete!</span>
            </div>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            New PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Match the sentences:
        </h3>
        <div className="space-y-4">
          {exercise.questions.map((question, questionIndex) => {
            const droppedAnswer = getAnswerForQuestion(questionIndex);
            const isCorrect = feedback[questionIndex];
            const shouldShowFeedback = showFeedback[questionIndex];
            return (
              <div key={questionIndex} className="flex items-center gap-4 text-lg leading-relaxed">
                <span className="text-gray-500 font-medium min-w-[2rem]">
                  {questionIndex + 1}.
                </span>
                <span className="flex-1">{question}</span>
                <span
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedIndex !== null && !usedAnswers.has(draggedIndex)) {
                      handleDrop(questionIndex)(draggedIndex);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-md border-2 min-w-[120px] min-h-[32px] text-sm font-medium transition-all duration-200
                    ${droppedAnswer
                      ? (shouldShowFeedback
                          ? (isCorrect
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : 'bg-red-100 border-red-300 text-red-800 animate-pulse')
                          : 'bg-blue-50 border-blue-300 text-blue-800')
                      : 'bg-gray-50 border-gray-300 border-dashed hover:border-gray-400'}
                  `}
                >
                  {droppedAnswer ? (
                    <>
                      {shouldShowFeedback && (
                        isCorrect ? (
                          <CheckCircle className="h-4 w-4 inline" />
                        ) : (
                          <span className="text-red-500 font-bold">×</span>
                        )
                      )}
                      {droppedAnswer.answerText}
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">Drop answer</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available answers:
          </h3>
          <div className="flex flex-wrap gap-3">
            {exercise.answers.map((answer, index) => (
              <div
                key={index}
                draggable={!usedAnswers.has(index)}
                onDragStart={() => handleDragStart(index)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 select-none
                  ${usedAnswers.has(index)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing hover:scale-105'}
                `}
              >
                {answer}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={resetExercise}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Reset Exercise
        </button>
      </div>
    </div>
  );
} 