import type { Exercise } from './Exercise';

/**
 * Интерфейс для упражнения в базе данных
 * Соответствует структуре таблицы в БД
 */
export interface DatabaseExercise {
  id: number;
  uuid: string;
  exerciseData: string; // JSON строка с данными упражнения
  timestamp: string; // ISO дата создания
  userId: number;
  isCompleted: boolean;
  isPublic: boolean; // Публичное ли упражнение
  is_public?: boolean; // поддержка snake_case
  public?: boolean; // поддержка поля public
}

/**
 * Интерфейс для парсинга JSON данных упражнения из БД
 */
export interface ParsedExerciseData {
  type: string;
  questions: string[];
  answers: string[];
  dictionary: Array<{
    question: number;
    answer: number;
  }>;
  createdText?: string;
  // Дополнительные метаданные
  metadata?: {
    source?: string;
    generatedAt?: string;
    exerciseType?: string;
    fileName?: string;
    fileSize?: number;
    uploadedAt?: string;
    [key: string]: any;
  };
}

/**
 * Интерфейс для отображения упражнения в таблице
 */
export interface ExerciseTableRow {
  id: number;
  uuid: string;
  type: string;
  createdText: string;
  questionsCount: number;
  timestamp: string;
  isCompleted: boolean;
  isPublic: boolean;
  // Дополнительные поля для отображения
  source?: string;
  fileName?: string;
  difficulty?: string;
  publicUrl?: string; // Публичная ссылка для копирования
}

/**
 * Утилиты для работы с упражнениями из БД
 */
export class DatabaseExerciseUtils {
  /**
   * Парсит JSON строку упражнения из БД
   */
  static parseExerciseData(jsonString: string): ParsedExerciseData | null {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Исправляем дублирование поля type
      if (parsed.type && Array.isArray(parsed.type)) {
        parsed.type = parsed.type[0]; // Берем первое значение
      }
      
      // Убеждаемся, что все обязательные поля присутствуют
      if (!parsed.type || !parsed.questions || !parsed.answers || !parsed.dictionary) {
        console.warn('Invalid exercise data structure:', parsed);
        return null;
      }
      
      return parsed as ParsedExerciseData;
    } catch (error) {
      console.error('Error parsing exercise data:', error);
      return null;
    }
  }

  /**
   * Конвертирует данные из БД в формат для отображения в таблице
   */
  static convertToTableRow(dbExercise: DatabaseExercise): ExerciseTableRow | null {
    if (!dbExercise) return null;
    
    // Safety check to prevent "Cannot read properties of undefined" error
    if (!this.parseExerciseData) {
      console.error('parseExerciseData method is not available');
      return null;
    }
    
    const parsedData = this.parseExerciseData(dbExercise.exerciseData);
    if (!parsedData) return null;
    const rawIsPublic = dbExercise.isPublic ?? dbExercise.is_public ?? dbExercise.public;
    const isPublic = typeof rawIsPublic === 'string'
      ? rawIsPublic === 'true'
      : typeof rawIsPublic === 'number'
        ? rawIsPublic === 1
        : !!rawIsPublic;
    return {
      id: dbExercise.id,
      uuid: dbExercise.uuid,
      type: parsedData.type,
      createdText: parsedData.createdText || 'No description',
      questionsCount: parsedData.questions?.length || 0,
      timestamp: dbExercise.timestamp,
      isCompleted: dbExercise.isCompleted,
      isPublic: isPublic, // универсально
      source: parsedData.metadata?.source,
      fileName: parsedData.metadata?.fileName,
      difficulty: parsedData.metadata?.difficulty,
      publicUrl: isPublic ? this.generatePublicUrl(dbExercise.uuid) : undefined
    };
  }

  /**
   * Конвертирует данные из БД в формат Exercise для компонентов
   */
  static convertToExercise(dbExercise?: DatabaseExercise | null): Exercise | null {
    if (!dbExercise || !dbExercise.exerciseData) {
      console.warn('convertToExercise: dbExercise or exerciseData is missing', dbExercise);
      return null;
    }
  
    // Safety check to prevent "Cannot read properties of undefined" error
    if (!this.parseExerciseData) {
      console.error('parseExerciseData method is not available');
      return null;
    }
  
    const parsedData = this.parseExerciseData(dbExercise.exerciseData);
    if (!parsedData) return null;
  
    return {
      type: parsedData.type,
      questions: parsedData.questions,
      answers: parsedData.answers,
      dictionary: parsedData.dictionary,
      createdText: parsedData.createdText
    };
  }

  /**
   * Создает JSON строку для сохранения в БД
   */
  static createExerciseDataString(exercise: Exercise, metadata?: Record<string, any>): string {
    const dataToSave = {
      type: exercise.type,
      questions: exercise.questions,
      answers: exercise.answers,
      dictionary: exercise.dictionary,
      createdText: exercise.createdText,
      metadata: metadata || {}
    };

    return JSON.stringify(dataToSave);
  }

  /**
   * Валидирует структуру упражнения перед сохранением
   */
  static validateExercise(exercise: Exercise): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!exercise.type) {
      errors.push('Type is required');
    }

    if (!exercise.questions || !Array.isArray(exercise.questions) || exercise.questions.length === 0) {
      errors.push('Questions array is required and must not be empty');
    }

    if (!exercise.answers || !Array.isArray(exercise.answers) || exercise.answers.length === 0) {
      errors.push('Answers array is required and must not be empty');
    }

    if (!exercise.dictionary || !Array.isArray(exercise.dictionary)) {
      errors.push('Dictionary array is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Генерирует публичную ссылку для упражнения
   */
  static generatePublicUrl(uuid: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/exercise/${uuid}`;
  }

  /**
   * Извлекает UUID из публичной ссылки
   */
  static extractUuidFromPublicUrl(url: string): string | null {
    const match = url.match(/\/public\/exercise\/([a-f0-9-]{36})/i);
    return match ? match[1] : null;
  }

  /**
   * Проверяет, является ли ссылка публичной
   */
  static isPublicUrl(url: string): boolean {
    return url.includes('/public/exercise/');
  }

  /**
   * Копирует ссылку в буфер обмена
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}
