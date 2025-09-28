/**
 * Тест для демонстрации работы ExerciseSaver без дублирования
 * Этот файл можно удалить после тестирования
 */

import { ExerciseSaver } from './ExerciseSaver';
import type { Exercise } from '../types/Exercise';

// Создаем тестовое упражнение
const testExercise: Exercise = {
  type: 'True/False',
  questions: ['The Earth is round.', 'Water boils at 100°C.'],
  answers: ['TRUE', 'TRUE'],
  dictionary: [
    { question: 0, answer: 0 },
    { question: 1, answer: 1 }
  ],
  createdText: 'Science facts test'
};

export async function testExerciseSaver() {
  console.log('=== Тестирование ExerciseSaver ===');
  
  // Очищаем кэш перед тестом
  ExerciseSaver.clearSavedCache();
  console.log('Кэш очищен. Количество сохраненных упражнений:', ExerciseSaver.getSavedCount());
  
  // Первое сохранение
  console.log('\n1. Первое сохранение упражнения...');
  const firstSave = await ExerciseSaver.saveExercise(testExercise);
  console.log('Результат первого сохранения:', firstSave);
  console.log('Количество сохраненных упражнений:', ExerciseSaver.getSavedCount());
  
  // Второе сохранение того же упражнения (должно быть пропущено)
  console.log('\n2. Попытка повторного сохранения того же упражнения...');
  const secondSave = await ExerciseSaver.saveExercise(testExercise);
  console.log('Результат второго сохранения:', secondSave);
  console.log('Количество сохраненных упражнений:', ExerciseSaver.getSavedCount());
  
  // Принудительное сохранение (пропуская проверку дублирования)
  console.log('\n3. Принудительное сохранение (skipDuplicateCheck: true)...');
  const forcedSave = await ExerciseSaver.saveExercise(testExercise, {
    skipDuplicateCheck: true
  });
  console.log('Результат принудительного сохранения:', forcedSave);
  console.log('Количество сохраненных упражнений:', ExerciseSaver.getSavedCount());
  
  // Проверка, было ли упражнение сохранено
  console.log('\n4. Проверка статуса сохранения...');
  const isSaved = ExerciseSaver.isExerciseSaved(testExercise);
  console.log('Упражнение сохранено:', isSaved);
  
  console.log('\n=== Тест завершен ===');
}

// Функция для тестирования в консоли браузера
if (typeof window !== 'undefined') {
  (window as any).testExerciseSaver = testExerciseSaver;
  console.log('Функция testExerciseSaver() доступна в консоли для тестирования');
}
