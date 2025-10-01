# Используем официальный образ OpenJDK 17 с Ubuntu для лучшей совместимости
FROM openjdk:17-jdk-slim

# Устанавливаем Tesseract и необходимые зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-rus \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Создаем пользователя и рабочие директории
RUN groupadd -r spring && useradd -r -g spring spring

# Создаем директорию для tessdata
RUN mkdir -p /usr/share/tessdata && chown spring:spring /usr/share/tessdata

USER spring
WORKDIR /app

# Копируем JAR файл
COPY --chown=spring:spring target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["java", "-jar", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Dspring.profiles.active=docker", \
    "app.jar"]