import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.tsx';
import PublicExerciseView from './components/PublicExerciseView.tsx'; 
import './index.css';

const backgroundUrl = '/background.png';

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