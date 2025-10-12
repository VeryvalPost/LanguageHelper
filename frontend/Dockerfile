# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Копируем только background.png из public папки
COPY --from=build /app/public/background.png /usr/share/nginx/html/background.png
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]