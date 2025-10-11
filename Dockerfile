# Используем официальный образ OpenJDK 17 с Ubuntu
FROM openjdk:17-jdk-slim

# Устанавливаем Tesseract и curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr tesseract-ocr-eng tesseract-ocr-rus curl wget \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Создаём пользователя spring
RUN groupadd -r spring && useradd -r -g spring spring
RUN mkdir -p /usr/share/tessdata && chown spring:spring /usr/share/tessdata

USER spring
WORKDIR /app

# Копируем jar
COPY --chown=spring:spring target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Dspring.profiles.active=docker", \
    "app.jar"]