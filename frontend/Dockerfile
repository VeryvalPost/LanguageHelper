FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# Удаляем дефолтную конфигурацию
RUN rm -rf /etc/nginx/conf.d/*
# Копируем нашу исправленную конфигурацию
COPY nginx.conf /etc/nginx/nginx.conf
# Копируем собранные файлы из dist
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]