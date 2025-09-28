import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.tsx';
import PublicExerciseView from './components/PublicExerciseView.tsx'; 
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. Публичный маршрут для упражнений. Он не будет проходить через логику App.tsx */}
        <Route path="/public/exercise/:uuid" element={<PublicExerciseView />} />

        {/* 2. Все остальные маршруты (*) ведут на основной компонент App, который уже будет проверять авторизацию */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
