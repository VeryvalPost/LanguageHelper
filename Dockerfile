# Базовый образ с Java 17
FROM eclipse-temurin:17-jdk-alpine

# Устанавливаем Tesseract с поддержкой русского и английского языков
# В Alpine Linux пакеты называются по-другому
RUN apk update && apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-rus \
    curl

# Устанавливаем переменную окружения для Tesseract
ENV TESSDATA_PREFIX=/usr/share/tessdata

# Создаем отдельного пользователя и группу для безопасности
RUN addgroup -S spring && adduser -S spring -G spring

# Переключаемся на созданного пользователя
USER spring

# Рабочая директория
WORKDIR /app

# Копируем JAR файл с правильными правами
COPY --chown=spring:spring target/*.jar app.jar

# Открываем порт приложения
EXPOSE 8080

# Простой healthcheck (проверяет, что порт слушается)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Оптимизированные параметры запуска JVM в контейнере
ENTRYPOINT ["java", "-jar", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Dspring.profiles.active=docker", \
    "app.jar"]