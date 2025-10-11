import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.tsx';
import PublicExerciseView from './components/PublicExerciseView.tsx'; 
import './index.css';

// Способ 1: Используем абсолютный путь для public файлов
const backgroundUrl = '/background.png';

// Способ 2: Или импортируем через new URL (более надежно)
// const backgroundUrl = new URL('../public/background.png', import.meta.url).href;

document.body.style.backgroundImage = `url(${backgroundUrl})`;
document.body.style.backgroundSize = 'cover';
document.body.style.backgroundRepeat = 'no-repeat';
document.body.style.backgroundPosition = 'center center';
document.body.style.backgroundAttachment = 'fixed';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/public/exercise/:uuid" element={<PublicExerciseView />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);