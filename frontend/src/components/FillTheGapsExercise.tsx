import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';
import type { Exercise, DroppedAnswer } from '../types/Exercise';
import DraggableAnswer from './DraggableAnswer';
import DropZone from './DropZone';

interface FillTheGapsExerciseProps {
  exercise: Exercise;
  onReset: () => void;
}

export default function FillTheGapsExercise({ exercise, onReset }: FillTheGapsExerciseProps) {
  const [droppedAnswers, setDroppedAnswers] = useState<DroppedAnswer[]>([]);
  const [feedback, setFeedback] = useState<Record<number, boolean>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
  const [usedAnswers, setUsedAnswers] = useState<Set<number>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const correctAnswers = exercise.dictionary.reduce((acc, item) => {
    acc[item.question] = item.answer;
    return acc;
  }, {} as Record<number, number>);

  const handleDrop = (questionIndex: number) => (answerIndex: number) => {
    const correctAnswerIndex = correctAnswers[questionIndex];
    const isCorrect = answerIndex === correctAnswerIndex;
    
    // Remove any existing answer for this question
    const existingAnswer = droppedAnswers.find(da => da.questionIndex === questionIndex);
    if (existingAnswer) {
      setUsedAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(existingAnswer.answerIndex);
        return newSet;
      });
    }

    // Add new answer
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

    // If incorrect, remove after animation
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {exercise.type}
          </h2>
          <p className="text-gray-600">
            Drag the answers to the correct positions in the sentences
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
          Complete the sentences:
        </h3>
        
        <div className="space-y-4">
          {exercise.questions.map((question, questionIndex) => {
            // Разбиваем вопрос на части по '_____' с сохранением пунктуации
            const gapRegex = /(_____)([.,!?:;…]*)/g;
            const parts = [];
            let lastIndex = 0;
            let match;
            let gapCount = 0;
            while ((match = gapRegex.exec(question)) !== null) {
              if (match.index > lastIndex) {
                parts.push({ text: question.slice(lastIndex, match.index) });
              }
              parts.push({ gap: true, punctuation: match[2], gapIndex: gapCount });
              gapCount++;
              lastIndex = gapRegex.lastIndex;
            }
            if (lastIndex < question.length) {
              parts.push({ text: question.slice(lastIndex) });
            }

            // Для совместимости с текущей логикой: один пропуск на вопрос, используем questionIndex
            const droppedAnswer = getAnswerForQuestion(questionIndex);
            const isCorrect = feedback[questionIndex];
            const shouldShowFeedback = showFeedback[questionIndex];
            
            return (
              <div key={questionIndex} className="flex items-center gap-2 text-lg leading-relaxed">
                <span className="text-gray-500 font-medium min-w-[2rem]">
                  {questionIndex + 1}.
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {parts.map((part, idx) =>
                    part.gap ? (
                      <React.Fragment key={idx}>
                        <DropZone
                          onDrop={handleDrop(questionIndex)}
                          droppedAnswer={droppedAnswer?.answerText || null}
                          isCorrect={isCorrect}
                          showFeedback={shouldShowFeedback}
                        />
                        {part.punctuation && <span>{part.punctuation}</span>}
                      </React.Fragment>
                    ) : (
                      <span key={idx}>{part.text}</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available answers:
        </h3>
        
        <div className="flex flex-wrap gap-3">
          {exercise.answers.map((answer, index) => (
            <DraggableAnswer
              key={index}
              answer={answer}
              index={index}
              isUsed={usedAnswers.has(index)}
              onDragStart={setDraggedIndex}
            />
          ))}
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