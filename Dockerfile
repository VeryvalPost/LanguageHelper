# Используем Ubuntu с Java 17
FROM ubuntu:22.04

# Устанавливаем Java 17 и Tesseract
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    software-properties-common

# Добавляем репозиторий Oracle Java
RUN wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add - && \
    echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list

# Устанавливаем Java 17 и Tesseract
RUN apt-get update && apt-get install -y \
    temurin-17-jdk \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-rus \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем переменную окружения для Tesseract
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata

# Создаем пользователя
RUN groupadd -r spring && useradd -r -g spring spring

USER spring

WORKDIR /app

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