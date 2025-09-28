import { fetchWithAuth } from './fetchWithAuth';
import type { Exercise } from '../types/Exercise';
import { DatabaseExerciseUtils } from '../types/DatabaseExercise';

/**
 * Класс для управления сохранением упражнений в базу данных
 * Поддерживает различные стратегии сохранения и fallback механизмы
 */
export class ExerciseSaver {
  private static readonly PRIMARY_SAVE_ENDPOINT = '/api/exercise/save';
  private static readonly FALLBACK_SAVE_ENDPOINT = '/api/pdf/upload';
  private static readonly BASE_URL = 'http://localhost:8080';
  
  // Отслеживание уже сохраненных упражнений для предотвращения дублирования
  private static savedExercises = new Set<string>();

  /**
   * Создает уникальный ключ для упражнения на основе его содержимого
   */
  private static createExerciseKey(exercise: Exercise): string {
    const content = JSON.stringify({
      type: exercise.type,
      questions: exercise.questions,
      answers: exercise.answers,
      createdText: exercise.createdText
    });
    
    // Создаем хеш из содержимого
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `${exercise.type}-${Math.abs(hash)}`;
  }

  /**
   * Сохраняет упражнение в базу данных
   * @param exercise - объект упражнения для сохранения
   * @param options - дополнительные опции сохранения
   * @returns Promise<boolean> - true если сохранение успешно, false в противном случае
   */
  static async saveExercise(
    exercise: Exercise, 
    options: SaveOptions = {},
    metadata?: Record<string, any>,
    isPublic?: boolean
  ): Promise<boolean> {
    const { 
      useFallback = true, 
      logErrors = true,
      throwOnError = false,
      skipDuplicateCheck = false
    } = options;

    // Проверяем, не сохраняли ли мы уже это упражнение
    if (!skipDuplicateCheck) {
      const exerciseKey = this.createExerciseKey(exercise);
      if (this.savedExercises.has(exerciseKey)) {
        console.log('Exercise already saved, skipping duplicate save');
        return true;
      }
    }

    try {
      // Пробуем основной endpoint для сохранения
      const success = await this.tryPrimarySave(exercise, metadata, isPublic);
      if (success) {
        console.log('Exercise saved successfully via primary endpoint');
        if (!skipDuplicateCheck) {
          const exerciseKey = this.createExerciseKey(exercise);
          this.savedExercises.add(exerciseKey);
        }
        return true;
      }

      // Если основной endpoint не сработал и разрешен fallback
      if (useFallback) {
        console.log('Primary save endpoint failed, trying fallback approach...');
        const fallbackSuccess = await this.tryFallbackSave(exercise, metadata, isPublic);
        if (fallbackSuccess) {
          console.log('Exercise saved successfully via fallback endpoint');
          if (!skipDuplicateCheck) {
            const exerciseKey = this.createExerciseKey(exercise);
            this.savedExercises.add(exerciseKey);
          }
          return true;
        }
      }

      if (logErrors) {
        console.warn('Failed to save exercise to database via all available methods');
      }

      if (throwOnError) {
        throw new Error('Failed to save exercise to database');
      }

      return false;
    } catch (error) {
      if (logErrors) {
        console.error('Error saving exercise to database:', error);
      }

      if (throwOnError) {
        throw error;
      }

      return false;
    }
  }

  /**
   * Пробует сохранить упражнение через основной endpoint
   */
  private static async tryPrimarySave(exercise: Exercise, metadata?: Record<string, any>, isPublic?: boolean): Promise<boolean> {
    try {
      // Создаем правильную структуру данных для бэкенда
      const exerciseData = {
        type: exercise.type,
        questions: exercise.questions,
        answers: exercise.answers,
        dictionary: exercise.dictionary,
        createdText: exercise.createdText || '',
        // Добавляем метаданные и публичность, если они есть
        ...(metadata && { metadata }),
        ...(isPublic !== undefined && { isPublic })
      };

      const response = await fetchWithAuth(
        `${this.BASE_URL}${this.PRIMARY_SAVE_ENDPOINT}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exerciseData),
        }
      );

      return response.ok;
    } catch (error) {
      console.debug('Primary save failed:', error);
      return false;
    }
  }

  /**
   * Пробуем сохранить упражнение через fallback endpoint (PDF upload)
   */
  private static async tryFallbackSave(exercise: Exercise, metadata?: Record<string, any>, isPublic?: boolean): Promise<boolean> {
    try {
      // Создаем фиктивный PDF blob для использования существующего endpoint
      const pdfBlob = new Blob([''], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', pdfBlob, `${exercise.type.toLowerCase().replace(/\s+/g, '-')}-exercise.pdf`);
      
      // Создаем правильную структуру данных для бэкенда
      const exerciseData = {
        type: exercise.type,
        questions: exercise.questions,
        answers: exercise.answers,
        dictionary: exercise.dictionary,
        createdText: exercise.createdText || '',
        // Добавляем метаданные и публичность, если они есть
        ...(metadata && { metadata }),
        ...(isPublic !== undefined && { isPublic })
      };
      
      formData.append('exerciseData', JSON.stringify(exerciseData));

      const response = await fetchWithAuth(
        `${this.BASE_URL}${this.FALLBACK_SAVE_ENDPOINT}`, 
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      return response.ok;
    } catch (error) {
      console.debug('Fallback save failed:', error);
      return false;
    }
  }

  /**
   * Сохраняет упражнение с дополнительной информацией о контексте
   * @param exercise - объект упражнения
   * @param context - контекстная информация (например, источник создания)
   */
  static async saveExerciseWithContext(
    exercise: Exercise, 
    context: ExerciseContext = {}
  ): Promise<boolean> {
    // Валидируем упражнение перед сохранением
    const validation = DatabaseExerciseUtils.validateExercise(exercise);
    if (!validation.isValid) {
      console.error('Exercise validation failed:', validation.errors);
      return false;
    }

    // Создаем метаданные
    const metadata = {
      createdAt: new Date().toISOString(),
      source: context.source || 'unknown',
      userId: context.userId,
      ...context.metadata
    };

    // Сохраняем упражнение с метаданными и публичностью
    return this.saveExercise(exercise, {}, metadata, context.isPublic);
  }

  /**
   * Массовое сохранение упражнений
   * @param exercises - массив упражнений для сохранения
   * @param options - опции сохранения
   * @returns Promise<SaveResult[]> - результаты сохранения для каждого упражнения
   */
  static async saveMultipleExercises(
    exercises: Exercise[], 
    options: SaveOptions = {}
  ): Promise<SaveResult[]> {
    const results: SaveResult[] = [];

    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      try {
        const success = await this.saveExercise(exercise, options);
        results.push({
          index: i,
          exerciseType: exercise.type,
          success,
          error: null
        });
      } catch (error) {
        results.push({
          index: i,
          exerciseType: exercise.type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Очищает кэш сохраненных упражнений
   * Полезно для сброса состояния при необходимости
   */
  static clearSavedCache(): void {
    this.savedExercises.clear();
    console.log('Exercise save cache cleared');
  }

  /**
   * Получает количество сохраненных упражнений в кэше
   */
  static getSavedCount(): number {
    return this.savedExercises.size;
  }

  /**
   * Проверяет, было ли упражнение уже сохранено
   */
  static isExerciseSaved(exercise: Exercise): boolean {
    const exerciseKey = this.createExerciseKey(exercise);
    return this.savedExercises.has(exerciseKey);
  }
}

/**
 * Опции для сохранения упражнения
 */
export interface SaveOptions {
  /** Использовать fallback метод если основной не сработал */
  useFallback?: boolean;
  /** Логировать ошибки в консоль */
  logErrors?: boolean;
  /** Выбрасывать исключение при ошибке */
  throwOnError?: boolean;
  /** Пропустить проверку на дублирование (для принудительного сохранения) */
  skipDuplicateCheck?: boolean;
}

/**
 * Контекстная информация для упражнения
 */
export interface ExerciseContext {
  /** Источник создания упражнения */
  source?: 'pdf-upload' | 'manual-creation' | 'api-generation' | 'import';
  /** ID пользователя */
  userId?: string;
  /** Публичное ли упражнение */
  isPublic?: boolean;
  /** Дополнительные метаданные */
  metadata?: Record<string, any>;
}

/**
 * Результат сохранения упражнения
 */
export interface SaveResult {
  /** Индекс упражнения в массиве */
  index: number;
  /** Тип упражнения */
  exerciseType: string;
  /** Успешность сохранения */
  success: boolean;
  /** Сообщение об ошибке (если есть) */
  error: string | null;
}
