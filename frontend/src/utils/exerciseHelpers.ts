import { ExerciseSaver } from './ExerciseSaver';
import type { Exercise } from '../types/Exercise';
import type { ExerciseContext } from './ExerciseSaver';

/**
 * Вспомогательные функции для работы с упражнениями
 */

/**
 * Создает и сохраняет упражнение с автоматическим определением контекста
 * @param exercise - объект упражнения
 * @param source - источник создания упражнения
 * @param additionalMetadata - дополнительные метаданные
 */
export async function createAndSaveExercise(
  exercise: Exercise,
  source: ExerciseContext['source'] = 'manual-creation',
  additionalMetadata: Record<string, any> = {}
): Promise<boolean> {
  const context: ExerciseContext = {
    source,
    metadata: {
      createdBy: 'user', // Можно получить из контекста приложения
      ...additionalMetadata
    }
  };

  return ExerciseSaver.saveExerciseWithContext(exercise, context);
}

/**
 * Создает упражнение из API и сохраняет его
 * @param apiEndpoint - endpoint для генерации упражнения
 * @param exerciseType - тип упражнения
 * @param additionalData - дополнительные данные для API
 */
export async function generateAndSaveExercise(
  apiEndpoint: string,
  exerciseType: string,
  additionalData: Record<string, any> = {}
): Promise<Exercise | null> {
  try {
    // Здесь должна быть логика вызова API для генерации упражнения
    // Это пример, который нужно адаптировать под конкретные API
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(additionalData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const exercise: Exercise = await response.json();
    
    // Сохраняем упражнение
    const saved = await createAndSaveExercise(exercise, 'api-generation', {
      exerciseType,
      generatedAt: new Date().toISOString(),
      apiEndpoint
    });

    if (!saved) {
      console.warn('Exercise generated but not saved to database');
    }

    return exercise;
  } catch (error) {
    console.error('Error generating exercise:', error);
    return null;
  }
}

/**
 * Массовое создание упражнений разных типов
 * @param exerciseConfigs - конфигурации для создания упражнений
 */
export async function createMultipleExercises(
  exerciseConfigs: Array<{
    type: string;
    data: any;
    source: ExerciseContext['source'];
  }>
): Promise<Array<{ type: string; success: boolean; exercise?: Exercise }>> {
  const results = [];

  for (const config of exerciseConfigs) {
    try {
      // Здесь должна быть логика создания упражнения по типу
      // Это пример, который нужно адаптировать
      const exercise: Exercise = {
        type: config.type,
        questions: [],
        answers: [],
        dictionary: [],
        createdText: `Generated ${config.type} exercise`
      };

      const saved = await createAndSaveExercise(exercise, config.source, {
        exerciseType: config.type
      });

      results.push({
        type: config.type,
        success: saved,
        exercise: saved ? exercise : undefined
      });
    } catch (error) {
      results.push({
        type: config.type,
        success: false
      });
    }
  }

  return results;
}

/**
 * Получает статистику по сохраненным упражнениям
 * @param exercises - массив упражнений
 */
export function getExerciseStats(exercises: Exercise[]): {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
} {
  const stats = {
    total: exercises.length,
    byType: {} as Record<string, number>,
    bySource: {} as Record<string, number>
  };

  exercises.forEach(exercise => {
    // Подсчет по типам
    stats.byType[exercise.type] = (stats.byType[exercise.type] || 0) + 1;
    
    // Подсчет по источникам (если есть метаданные)
    const source = (exercise as any).metadata?.source || 'unknown';
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;
  });

  return stats;
}
