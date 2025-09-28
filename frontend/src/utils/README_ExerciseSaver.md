# ExerciseSaver - Класс для управления сохранением упражнений

`ExerciseSaver` - это универсальный класс для сохранения упражнений в базу данных с поддержкой различных стратегий и fallback механизмов.

## Основные возможности

- ✅ **Универсальное сохранение** - работает с любыми типами упражнений
- ✅ **Fallback механизм** - автоматически переключается на альтернативные методы сохранения
- ✅ **Контекстная информация** - сохранение метаданных о создании упражнения
- ✅ **Массовое сохранение** - поддержка сохранения нескольких упражнений одновременно
- ✅ **Обработка ошибок** - гибкая настройка поведения при ошибках
- ✅ **TypeScript поддержка** - полная типизация для безопасности

## Быстрый старт

```typescript
import { ExerciseSaver } from './utils/ExerciseSaver';
import type { Exercise } from './types/Exercise';

// Простое сохранение
const exercise: Exercise = {
  type: 'True/False',
  questions: ['The Earth is round.'],
  answers: ['TRUE'],
  dictionary: [{ question: 0, answer: 0 }],
  createdText: 'Science facts'
};

const success = await ExerciseSaver.saveExercise(exercise);
```

## API Reference

### ExerciseSaver.saveExercise(exercise, options?)

Сохраняет упражнение в базу данных.

**Параметры:**
- `exercise: Exercise` - объект упражнения для сохранения
- `options?: SaveOptions` - дополнительные опции сохранения

**Возвращает:** `Promise<boolean>` - true если сохранение успешно

### ExerciseSaver.saveExerciseWithContext(exercise, context?)

Сохраняет упражнение с дополнительной контекстной информацией.

**Параметры:**
- `exercise: Exercise` - объект упражнения
- `context?: ExerciseContext` - контекстная информация

**Возвращает:** `Promise<boolean>` - true если сохранение успешно

### ExerciseSaver.saveMultipleExercises(exercises, options?)

Массовое сохранение упражнений.

**Параметры:**
- `exercises: Exercise[]` - массив упражнений
- `options?: SaveOptions` - опции сохранения

**Возвращает:** `Promise<SaveResult[]>` - результаты сохранения

## Опции сохранения (SaveOptions)

```typescript
interface SaveOptions {
  useFallback?: boolean;    // Использовать fallback метод (по умолчанию: true)
  logErrors?: boolean;      // Логировать ошибки (по умолчанию: true)
  throwOnError?: boolean;   // Выбрасывать исключение при ошибке (по умолчанию: false)
}
```

## Контекстная информация (ExerciseContext)

```typescript
interface ExerciseContext {
  source?: 'pdf-upload' | 'manual-creation' | 'api-generation' | 'import';
  userId?: string;
  metadata?: Record<string, any>;
}
```

## Примеры использования

### 1. Простое сохранение

```typescript
const exercise: Exercise = {
  type: 'Multiple Choice',
  questions: ['What is 2+2?'],
  answers: ['4', '3', '5', '6'],
  dictionary: [{ question: 0, answer: 0 }],
  createdText: 'Math quiz'
};

const saved = await ExerciseSaver.saveExercise(exercise);
```

### 2. Сохранение с контекстом

```typescript
const saved = await ExerciseSaver.saveExerciseWithContext(exercise, {
  source: 'manual-creation',
  userId: 'user123',
  metadata: {
    difficulty: 'easy',
    topic: 'mathematics',
    language: 'english'
  }
});
```

### 3. Массовое сохранение

```typescript
const exercises = [exercise1, exercise2, exercise3];
const results = await ExerciseSaver.saveMultipleExercises(exercises);

results.forEach(result => {
  console.log(`${result.exerciseType}: ${result.success ? 'saved' : 'failed'}`);
});
```

### 4. Сохранение с обработкой ошибок

```typescript
try {
  const saved = await ExerciseSaver.saveExercise(exercise, {
    throwOnError: true,
    useFallback: true
  });
  console.log('Exercise saved successfully');
} catch (error) {
  console.error('Failed to save exercise:', error);
}
```

## Стратегии сохранения

### 1. Основной метод
Пытается сохранить через endpoint `/api/exercise/save`

### 2. Fallback метод
Если основной не работает, использует `/api/pdf/upload` с модификацией

## Интеграция с компонентами

### TrueFalseExercise
```typescript
await ExerciseSaver.saveExerciseWithContext(data, {
  source: 'api-generation',
  metadata: {
    generatedAt: new Date().toISOString(),
    exerciseType: 'True/False'
  }
});
```

### PDFUpload
```typescript
await ExerciseSaver.saveExerciseWithContext(exercise, {
  source: 'pdf-upload',
  metadata: {
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString()
  }
});
```

## Расширение для новых типов упражнений

Для добавления поддержки нового типа упражнения:

1. Создайте компонент упражнения
2. Импортируйте `ExerciseSaver`
3. Используйте `saveExerciseWithContext` с соответствующим контекстом

```typescript
// Пример для нового типа "Crossword"
await ExerciseSaver.saveExerciseWithContext(crosswordExercise, {
  source: 'manual-creation',
  metadata: {
    exerciseType: 'Crossword',
    gridSize: '15x15',
    difficulty: 'hard'
  }
});
```

## Логирование и отладка

Класс автоматически логирует:
- Успешные сохранения
- Ошибки (если `logErrors: true`)
- Переключения на fallback методы

Для отключения логирования:
```typescript
await ExerciseSaver.saveExercise(exercise, { logErrors: false });
```

## Обработка ошибок

По умолчанию класс не выбрасывает исключения при ошибках сохранения, чтобы не прерывать работу приложения. Для строгой обработки ошибок:

```typescript
await ExerciseSaver.saveExercise(exercise, { throwOnError: true });
```
