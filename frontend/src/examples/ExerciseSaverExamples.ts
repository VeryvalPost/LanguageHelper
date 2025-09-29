/**
 * Примеры использования ExerciseSaver для различных типов упражнений
 * Этот файл служит документацией и примером для разработчиков
 */

import { ExerciseSaver } from '../utils/ExerciseSaver';
import { createAndSaveExercise, generateAndSaveExercise } from '../utils/exerciseHelpers';
import type { Exercise } from '../types/Exercise';

// Пример 1: Создание и сохранение простого упражнения
export async function createSimpleExercise() {
  const exercise: Exercise = {
    type: 'Multiple Choice',
    questions: ['What is the capital of France?', 'Which planet is closest to the Sun?'],
    answers: ['Paris', 'Mercury', 'London', 'Venus'],
    dictionary: [
      { question: 0, answer: 0 },
      { question: 1, answer: 1 }
    ],
    createdText: 'Geography quiz'
  };

  const success = await ExerciseSaver.saveExercise(exercise);
  console.log('Simple exercise saved:', success);
  return success;
}

// Пример 2: Создание упражнения с контекстом
export async function createExerciseWithContext() {
  const exercise: Exercise = {
    type: 'Fill The Gaps',
    questions: ['The _____ is blue.', 'I _____ to school every day.'],
    answers: ['sky', 'go', 'ocean', 'walk'],
    dictionary: [
      { question: 0, answer: 0 },
      { question: 1, answer: 1 }
    ],
    createdText: 'Grammar exercise'
  };

  const success = await ExerciseSaver.saveExerciseWithContext(exercise, {
    source: 'manual-creation',
    userId: 'user123',
    metadata: {
      difficulty: 'beginner',
      topic: 'grammar',
      language: 'english'
    }
  });

  console.log('Exercise with context saved:', success);
  return success;
}

// Пример 3: Массовое создание упражнений
export async function createMultipleExercises() {
  const exercises: Exercise[] = [
    {
      type: 'True/False',
      questions: ['The Earth is round.', 'Water boils at 100°C.'],
      answers: ['TRUE', 'TRUE'],
      dictionary: [
        { question: 0, answer: 0 },
        { question: 1, answer: 1 }
      ],
      createdText: 'Science facts'
    },
    {
      type: 'Match The Sentence',
      questions: ['The capital of France', 'The largest planet'],
      answers: ['Paris', 'Jupiter'],
      dictionary: [
        { question: 0, answer: 0 },
        { question: 1, answer: 1 }
      ],
      createdText: 'Geography matching'
    }
  ];

  const results = await ExerciseSaver.saveMultipleExercises(exercises, {
    useFallback: true,
    logErrors: true
  });

  console.log('Multiple exercises saved:', results);
  return results;
}

// Пример 4: Создание упражнения с обработкой ошибок
export async function createExerciseWithErrorHandling() {
  const exercise: Exercise = {
    type: 'Custom Type',
    questions: ['Custom question'],
    answers: ['Custom answer'],
    dictionary: [{ question: 0, answer: 0 }],
    createdText: 'Custom exercise'
  };

  try {
    const success = await ExerciseSaver.saveExercise(exercise, {
      throwOnError: true,
      useFallback: true
    });
    
    console.log('Exercise saved successfully:', success);
    return { success: true, exercise };
  } catch (error) {
    console.error('Failed to save exercise:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Пример 5: Использование helper функций
export async function createExerciseWithHelpers() {
  const exercise: Exercise = {
    type: 'Reading Comprehension',
    questions: ['What is the main idea?', 'Who is the author?'],
    answers: ['The main idea is...', 'The author is...'],
    dictionary: [
      { question: 0, answer: 0 },
      { question: 1, answer: 1 }
    ],
    createdText: 'Reading passage about climate change'
  };

  const success = await createAndSaveExercise(exercise, 'manual-creation', {
    topic: 'environment',
    difficulty: 'intermediate',
    readingTime: '5 minutes'
  });

  console.log('Exercise created with helpers:', success);
  return success;
}

// Пример 6: Создание нового типа упражнения (например, Drag & Drop)
export async function createDragDropExercise() {
  const exercise: Exercise = {
    type: 'Drag & Drop',
    questions: ['Arrange the words to form a sentence:'],
    answers: ['The', 'cat', 'is', 'sleeping'],
    dictionary: [
      { question: 0, answer: 0 },
      { question: 0, answer: 1 },
      { question: 0, answer: 2 },
      { question: 0, answer: 3 }
    ],
    createdText: 'Word order exercise'
  };

  const success = await ExerciseSaver.saveExerciseWithContext(exercise, {
    source: 'manual-creation',
    metadata: {
      exerciseType: 'Drag & Drop',
      interactionType: 'drag-drop',
      difficulty: 'beginner',
      language: 'english'
    }
  });

  console.log('Drag & Drop exercise saved:', success);
  return success;
}

// Пример 7: Создание упражнения с API генерацией
export async function createAPIExercise() {
  try {
    const exercise = await generateAndSaveExercise(
      '/api/exercise/generate',
      'Crossword',
      {
        topic: 'animals',
        difficulty: 'medium',
        size: '10x10'
      }
    );

    if (exercise) {
      console.log('API exercise generated and saved:', exercise);
      return exercise;
    } else {
      console.log('Failed to generate API exercise');
      return null;
    }
  } catch (error) {
    console.error('Error generating API exercise:', error);
    return null;
  }
}
