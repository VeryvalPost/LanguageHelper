# --- Стадия сборки ---
FROM node:20-alpine AS build

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json отдельно — это кешируется
COPY package*.json ./

# Устанавливаем зависимости (с использованием lock-файла)
RUN npm ci --omit=dev

# Копируем весь исходный код
COPY . .

# Собираем Vite
RUN npm run build

# --- Стадия продакшена ---
FROM nginx:alpine

# Копируем свой nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем результат сборки
COPY --from=build /app/dist /usr/share/nginx/html

# Не нужно копировать public отдельно — Vite уже включает public в dist
# COPY --from=build /app/public /usr/share/nginx/html  ❌  можно убрать

# Открываем порт
EXPOSE 80

# Старт nginx
CMD ["nginx", "-g", "daemon off;"]