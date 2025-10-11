# --- Стадия сборки ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./

# Устанавливаем и обычные, и dev-зависимости (нужно для vite build)
RUN npm ci --include=dev

COPY . .

# Собираем фронтенд
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]