package com.miaai.language_helper.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miaai.language_helper.dto.ExerciseDto;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Converter(autoApply = true)
public class ExerciseDtoConverter implements AttributeConverter<ExerciseDto, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(ExerciseDto attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            String json = objectMapper.writeValueAsString(attribute);
            log.debug("Serialized ExerciseDto ({}) to JSON: {}", attribute.getClass().getSimpleName(), json);
            return json;
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize ExerciseDto to JSON: {}", attribute.getClass().getSimpleName(), e);
            throw new RuntimeException("Error converting ExerciseDto to JSON", e);
        }
    }

    @Override
    public ExerciseDto convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            log.warn("Null or empty JSON in DB for ExerciseDto");
            return null;  // ← Простой fallback: null, чтобы не крашить запрос
        }
        try {
            // Сначала парсим в JsonNode для проверки и лога
            JsonNode node = objectMapper.readTree(dbData);
            String type = node.path("type").asText("Unknown");  // Fallback для лога
            log.debug("Deserializing ExerciseDto with type: {}", type);

            // Теперь в полиморфный ExerciseDto — Jackson выберет подкласс по "type"
            ExerciseDto dto = objectMapper.readValue(dbData, ExerciseDto.class);
            log.debug("Successfully deserialized to: {}", dto.getClass().getSimpleName());
            return dto;
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize JSON to ExerciseDto. Data: {}. Error: {}", dbData, e.getMessage());
            // ← Улучшенный fallback: Возвращаем null, чтобы список загружался (в HistoryController обработай null)
            // Если нужно "Unknown" — создай минимальный подкласс (см. ниже)
            return null;
        }
    }

    public static ExerciseDto convert(String dbData) {
        return new ExerciseDtoConverter().convertToEntityAttribute(dbData);
    }

    // ← Опционально: Фабрика для fallback-объекта с "Unknown"
    public static ExerciseDto createUnknownFallback() {
        return new ExerciseDto() {  // Анонимный подкласс
            private String type = "Unknown";

            @Override
            public String getExerciseType() {
                return type;
            }

            @Override
            public String getCreatedText() {
                return null;
            }

            @Override
            public List<String> getQuestions() {
                return Collections.emptyList();
            }

            @Override
            public Map<String, Object> getMetadata() {
                return Collections.emptyMap();
            }
        };
    }
}

