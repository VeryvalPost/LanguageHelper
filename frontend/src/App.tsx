import { useState, useEffect } from 'react';
import PDFUpload from './components/PDFUpload';
import FillTheGapsExercise from './components/FillTheGapsExercise';
import MatchTheSentenceExercise from './components/MatchTheSentenceExercise';
import TrueFalseExercise from './components/TrueFalseExercise';
import AuthPage from './components/AuthPage';
import Header from './components/Header';
import type { Exercise } from './types/Exercise';
import type { User } from './components/AuthPage';
import type { DatabaseExercise, ExerciseTableRow } from './types/DatabaseExercise';
import { DatabaseExerciseUtils } from './types/DatabaseExercise';
import { getCurrentUser, logoutUser, isAuthenticated } from './utils/api';
import { FileText, ListChecks, HelpCircle, Copy, CheckCircle, Lock, Unlock } from 'lucide-react';
import { fetchWithAuth } from './utils/fetchWithAuth';
import { API_CONFIG, getApiUrl } from './config/api';


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [showTrueFalse, setShowTrueFalse] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [tableRows, setTableRows] = useState<ExerciseTableRow[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
    setExercise(null);
    setShowTrueFalse(false);
    logoutUser();
  };

  const handleExerciseLoaded = (loadedExercise: Exercise) => {
    setExercise(loadedExercise);
    setShowTrueFalse(false);
  };

  const handleReset = () => {
    setExercise(null);
    setShowTrueFalse(false);
  };

  const handleCreateTrueFalseExercise = () => {
    setShowTrueFalse(true);
  };

  // Функции для работы с публичными ссылками
  const handleCopyPublicLink = async (uuid: string) => {
    const publicUrl = DatabaseExerciseUtils.generatePublicUrl(uuid);
    const success = await DatabaseExerciseUtils.copyToClipboard(publicUrl);
    
    if (success) {
      setCopySuccess(prev => ({ ...prev, [uuid]: true }));
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [uuid]: false }));
      }, 2000);
    }
  };

  const handleTogglePublic = async (uuid: string, currentIsPublic: boolean | null) => {
    console.log('Toggle:', { uuid, currentIsPublic });
    try {
      const newIsPublic = !(currentIsPublic ?? false);
  
      // Оптимистичный апдейт: Измени локально сразу
      const url = getApiUrl(API_CONFIG.ENDPOINTS.TOGGLE_EXERCISE_PUBLIC(uuid));

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newIsPublic }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed:', response.status, errorText);
        // Откат оптимистичного апдейта
        setTableRows(prev => prev.map(row => 
          row.uuid === uuid ? { ...row, isPublic: !newIsPublic } : row
        ));
        throw new Error('Не удалось');
      }
  
      // Refetch для синха (если бэк изменил updatedAt или др.)
      await fetchAssignments();
      console.log('Success');
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка: ' + (error as Error).message);
      await fetchAssignments();  // Refetch anyway
    }
  };

 // 1. Загрузка списка заданий
const fetchAssignments = async () => {
  setIsAssignmentsLoading(true);
  setAssignmentsError(null);
  try {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.GET_TASKS_HISTORY);
    const response = await fetchWithAuth(url, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Ошибка загрузки истории');
    const data: DatabaseExercise[] = await response.json();
    
    // Конвертируем данные для отображения в таблице
    const rows = data
      .map(dbExercise => DatabaseExerciseUtils.convertToTableRow(dbExercise))
      .filter((row): row is ExerciseTableRow => row !== null);
    setTableRows(rows);
  } catch (e: any) {
    setAssignmentsError(e.message || 'Ошибка загрузки');
  } finally {
    setIsAssignmentsLoading(false);
  }
};

// Добавить функции для открытия/закрытия модального окна
const handleOpenAssignmentModal = () => {
  setShowAssignmentModal(true);
  fetchAssignments();
};
const handleCloseAssignmentModal = () => {
  setShowAssignmentModal(false);
};

// 2. Загрузка конкретного задания
const handleOpenAssignment = async (uuid: string) => {
  try {
    setIsLoading(true);
    const url = getApiUrl(API_CONFIG.ENDPOINTS.GET_TASK_BY_UUID(uuid));
    const response = await fetchWithAuth(url, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Ошибка загрузки задания');
    const data = await response.json();  
    console.log('Full exercise data:', data);  

    const exercise = DatabaseExerciseUtils.convertToExercise(data);  
    if (exercise) {
      setExercise(exercise);
      setShowAssignmentModal(false);
    } else {
      console.error('Failed to parse:', data);
      alert('Ошибка парсинга данных упражнения');
    }
  } catch (e: any) {
    console.error('Error loading assignment:', e);
    alert(e.message || 'Ошибка загрузки задания');
  } finally {
    setIsLoading(false);
  }
};

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке аутентификации:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Показываем загрузку пока проверяем аутентификацию
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем страницу входа
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Функция для рендера строки таблицы
  const renderAssignmentRow = (row: ExerciseTableRow) => {
    const typeIcon = row.type === 'Fill The Gaps'
      ? <FileText className="inline w-5 h-5 text-blue-500 mr-1" />
      : row.type === 'Match The Sentence'
      ? <ListChecks className="inline w-5 h-5 text-green-500 mr-1" />
      : row.type === 'True/False'
      ? <HelpCircle className="inline w-5 h-5 text-yellow-500 mr-1" />
      : <FileText className="inline w-5 h-5 text-gray-400 mr-1" />;
    const typeColor = row.type === 'Fill The Gaps'
      ? 'text-blue-700 bg-blue-50'
      : row.type === 'Match The Sentence'
      ? 'text-green-700 bg-green-50'
      : row.type === 'True/False'
      ? 'text-yellow-700 bg-yellow-50'
      : 'text-gray-700 bg-gray-50';
    const effectiveIsPublic = row.isPublic ?? false;
    return (
      <tr key={row.uuid} className="hover:bg-gray-50 transition">
        <td className={`border px-4 py-2 font-medium whitespace-nowrap`}>
          <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold ${typeColor}`}>{typeIcon}{row.type}</span>
        </td>
        <td className="border px-4 py-2 max-w-xs truncate text-gray-600" title={row.createdText}>
          {row.createdText.slice(0, 60) + (row.createdText.length > 60 ? '…' : '')}
        </td>
        <td className="border px-4 py-2 text-center">{row.questionsCount}</td>
        <td className="border px-4 py-2 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
        <td className="border px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            {effectiveIsPublic ? (
              <div className="flex items-center gap-1 text-green-600">
                <Unlock className="h-4 w-4" />
                <span className="text-sm font-medium">Публичное</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Приватное</span>
              </div>
            )}
          </div>
        </td>
        <td className="border px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" 
              onClick={() => handleOpenAssignment(row.uuid)}
            >
              Открыть
            </button>
            
            {/* Кнопка переключения публичности */}
            <button
              onClick={() => handleTogglePublic(row.uuid, row.isPublic)}
              className={`p-2 rounded transition-colors ${
                effectiveIsPublic
                  ? 'text-green-600 hover:bg-green-100'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={effectiveIsPublic ? 'Сделать приватным' : 'Сделать публичным'}
            >
              {effectiveIsPublic ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
            
            {/* Кнопка копирования ссылки (только для публичных) */}
            {effectiveIsPublic && (
              <button
                onClick={() => handleCopyPublicLink(row.uuid)}
                className={`p-2 rounded transition-colors ${
                  copySuccess[row.uuid]
                    ? 'text-green-600 bg-green-100'
                    : 'text-blue-600 hover:bg-blue-100'
                }`}
                title="Копировать публичную ссылку"
              >
                {copySuccess[row.uuid] ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Если пользователь авторизован, показываем основное приложение
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header user={user} onLogout={handleLogout} />
      {/* Кнопка для открытия истории заданий (кроме demo) */}
      {user.id !== 'demo' && (
        <div className="container mx-auto px-4 mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={handleOpenAssignmentModal}
          >
            Мои задания
          </button>
        </div>
      )}
      {/* Модальное окно с таблицей заданий */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={handleCloseAssignmentModal}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Мои задания</h2>
            {isAssignmentsLoading ? (
              <div>Загрузка...</div>
            ) : assignmentsError ? (
              <div className="text-red-600">{assignmentsError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-xl overflow-hidden shadow-sm bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2">Тип</th>
                      <th className="border px-4 py-2">Описание</th>
                      <th className="border px-4 py-2">Вопросов</th>
                      <th className="border px-4 py-2">Дата</th>
                      <th className="border px-4 py-2">Публичность</th>
                      <th className="border px-4 py-2">Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4">Нет заданий</td></tr>
                    ) : tableRows.map(renderAssignmentRow)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {!exercise && !showTrueFalse ? (
          <PDFUpload onExerciseLoaded={handleExerciseLoaded} onCreateTrueFalseExercise={handleCreateTrueFalseExercise} />
        ) : exercise ? (
          exercise.type === "Fill The Gaps" ? (
            <FillTheGapsExercise exercise={exercise} onReset={handleReset} />
          ) : exercise.type === "Match The Sentence" ? (
            <MatchTheSentenceExercise exercise={exercise} onReset={handleReset} />
          ) : exercise.type === "True/False" ? (
            <TrueFalseExercise exercise={exercise} onReset={handleReset} />
          ) : (
            <div className="text-center text-red-600 font-bold">
              Неизвестный тип упражнения: {exercise.type}
            </div>
          )
        ) : showTrueFalse ? (
          <TrueFalseExercise onExerciseLoaded={handleExerciseLoaded} onReset={handleReset} />
        ) : null}
      </div>
    </div>
  );
}

export default App;