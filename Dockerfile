# Базовый образ с Java 17
FROM eclipse-temurin:17-jdk-alpine

# Устанавливаем Tesseract с поддержкой русского и английского языков
RUN apk update && apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-rus \
    tesseract-ocr-data-eng \
    curl

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
    CMD netstat -ltn | grep -c 8080 || exit 1

# Оптимизированные параметры запуска JVM в контейнере
ENTRYPOINT ["java", "-jar", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Dspring.profiles.active=prod", \
    "app.jar"]