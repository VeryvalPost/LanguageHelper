package com.miaai.language_helper.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miaai.language_helper.config.ApiSettings;
import com.miaai.language_helper.dto.ExerciseDto;
import com.miaai.language_helper.dto.ExerciseType;
import com.miaai.language_helper.dto.generation.*;
import com.miaai.language_helper.dto.ocr.FillTheGapsResponseDto;
import com.miaai.language_helper.dto.ocr.MatchTheSentenceResponseDto;
import com.miaai.language_helper.model.ExerciseTableRecord;
import com.miaai.language_helper.model.User;
import com.miaai.language_helper.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GptRequestService {
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final ApiSettings apiSettings;
    private final ExerciseRepository exerciseRepository;
    static final String MODEL = "gpt-4.1";

    @SneakyThrows
    private String createRequestBody(String prompt) {
        String body = objectMapper.writeValueAsString(Map.of(
                "model", MODEL,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", prompt
                ))
        ));
        log.info("Request body: {}", body);
        return body;
    }

    public Mono<String> sendRequest(String prompt) {
        String requestBody = createRequestBody(prompt);
        logRequestDetails();

        return webClient.post()
                .uri(apiSettings.getApiPath())
                .header("Authorization", "Bearer " + apiSettings.getApiKey())
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(this::isErrorResponse, this::handleErrorResponse)
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .doOnError(this::logError);
    }

    private void logRequestDetails() {
        log.info("API Path: {}", apiSettings.getApiPath());
        log.info("API Key: {}", apiSettings.getApiKey() != null ? "[PROVIDED]" : "[NOT SET]");
    }

    private boolean isErrorResponse(org.springframework.http.HttpStatusCode status) {
        return status.isError();
    }

    private Mono<Throwable> handleErrorResponse(ClientResponse response) {
        return response.bodyToMono(String.class)
                .defaultIfEmpty("No error body")
                .flatMap(body -> {
                    log.error("API error: status={}, headers={}, body={}",
                            response.statusCode(),
                            response.headers().asHttpHeaders(),
                            body);
                    return Mono.error(new WebClientResponseException(
                            response.statusCode().value(),
                            "API Error",
                            response.headers().asHttpHeaders(),
                            body.getBytes(),
                            StandardCharsets.UTF_8
                    ));
                });
    }

    private void logError(Throwable error) {
        if (error instanceof WebClientResponseException e) {
            log.error("API error: status={}, headers={}, body={}",
                    e.getRawStatusCode(),
                    e.getHeaders(),
                    e.getResponseBodyAsString());
        } else {
            log.error("Request failed", error);
        }
    }

    @Deprecated
    public String sendRequestBlocking(String prompt) {
        return sendRequest(prompt)
                .block(Duration.ofSeconds(30));
    }

    public ExerciseDto createRecognizedExercise(String recognizedText, User user) {
        String prompt = buildOcrPrompt(recognizedText);

        try {
            String result = sendRequest(prompt).block();
            ExerciseDto cleanResult = cleanJsonBody(result);

            ExerciseTableRecord exerciseRecord = ExerciseTableRecord.fromDto(cleanResult, user);
            exerciseRepository.save(exerciseRecord);

            return cleanResult;
        } catch (Exception e) {
            throw new RuntimeException("Ошибка при очистке текста", e);
        }
    }

    private String buildOcrPrompt(String recognizedText) {
        Map<String, String> exerciseTemplates = Map.of(
                "Fill The Gaps", """
            Если это упражнение "Fill The Gaps", то необходимо вернуть JSON с вопросами и ответами.
            Пробелы куда надо вставить всегда должны быть обозначены как "_____" (пять подчеркиваний).
            Пожалуйста перемешай правильные ответы, чтоб они шли не по порядку.
            Формат JSON:
            {
                "type": "Fill The Gaps",
                "questions": ["вопрос1", "вопрос2", ...],
                "answers": ["ответ1", "ответ2", ...],
                "dictionary": [ { "question": indexOfQuestions, "answer": indexOfanswers } ]
            }
            """,

                "Match The Sentence", """
            Если это упражнение Match the Sentences, то необходимо вернуть JSON с вопросами и ответами.
            Пожалуйста перемешай правильные ответы, чтоб они шли не по порядку.
            Формат JSON:
            {
              "type": "Match The Sentence",
              "questions": ["вопрос1", "вопрос2", ...],
              "answers": ["ответ1", "ответ2", ...],
              "dictionary": [
                { "question": indexOfQuestions, "answer": indexOfanswers }
              ]
            }
            """,

                "True/False", """
            Если это упражнение True/False, то необходимо вернуть JSON с текстом, вопросами и ответами.
            Формат JSON:
            {
              "type": "True/False",
              "createdText": "Сгенерированный текст",
              "questions": ["вопрос1 к тексту", "вопрос2 к тексту", ...],
              "answers": ["TRUE", "FALSE", ...],
              "dictionary": [
                { "question": "вопрос1 к тексту", "answer": "TRUE" }
              ]
            }
            """
        );

        StringBuilder prompt = new StringBuilder("""
        Очистить текст от артефактов распознавания.
        Определить тип упражнения. 
        Нужно найти логическое начало и конец упражнения. Тебя интересует исключительно упражнение определенного типа. 
        Всё что находится на странице помимо искомого упражнения - можно отбросить и не обращать внимание.
        Строго следуй структуре JSON файла. Не придумывай дополнительных полей. Используй названия полей как в примере.
        
        Доступные типы упражнений:
        """);

        // Динамически добавляем все шаблоны
        exerciseTemplates.forEach((type, template) -> {
            prompt.append("\n--- ").append(type).append(" ---\n");
            prompt.append(template).append("\n");
        });

        prompt.append("""
        \nОпредели тип упражнения автоматически на основе структуры распознанного текста. 
        Обязательно заполни поле type соответствующим типом.
        Не дублируй поля два раза. Проследи, чтоб JSON мог корректно сериализоваться.
        
        Распознанный текст:
        """).append(recognizedText);

        return prompt.toString();
    }

    public ExerciseDto cleanJsonBody(String result) {
        log.info("Starting cleanJsonBody with input text: {}", result);
        try {
            String jsonString = extractJsonFromContent(result);
            log.info("Extracted JSON: {}", jsonString);

            JsonNode node = objectMapper.readTree(jsonString);
            String type = node.path("type").asText();

            ExerciseDto response;
            switch (type) {
                case "Match The Sentence":
                    response = objectMapper.readValue(jsonString, MatchTheSentenceResponseDto.class);
                    break;
                case "Fill The Gaps":
                    response = objectMapper.readValue(jsonString, FillTheGapsResponseDto.class);
                    break;
                default:
                    response = objectMapper.readValue(jsonString, ExerciseDto.class);
            }

            log.info("Successfully parsed API response into GptResponseDto: {}", response);
            return response;
        } catch (Exception e) {
            log.error("Error parsing API response into GptResponseDto: {}", result, e);
            throw new RuntimeException("Ошибка при разборе JSON", e);
        }
    }

    public GenerationExerciseDto createExerciseWithParams(ExerciseType exerciseType, User user, String level, String age, String topic) {
        if (exerciseType == null) {
            throw new IllegalArgumentException("Exercise type must not be null");
        }

        String prompt;
        Class<? extends GenerationExerciseDto> dtoClass;

        switch (exerciseType) {
            case TRUEFALSE -> {
                prompt = """
                Создать текст для упражнения True/False. Текст должен быть на английском языке, не менее 100 слов.
                Текст должен быть интересным и содержать факты, которые могут быть как правдой, так и ложью.
                Так же потребуется задать вопросы к тексту, на которые можно ответить True или False.
                Строго следуй структуре JSON файла. Не придумывай дополнительных полей. Используй названия полей как в примере.
                Ответ должен быть в формате JSON:
                {
                  "type": "True/False",
                  "createdText": "Сгенерированный текст",
                  "questions": ["вопрос1 к тексту", "вопрос2 к тексту", ...],
                  "answers": ["TRUE", "FALSE", ...],
                  "dictionary": [
                    { "question": "вопрос1 к тексту", "answer": "TRUE" },
                    { "question": "вопрос2 к тексту", "answer": "FALSE" }
                  ]
                }
                """ + "Уровень знаний ученика должен соответствовать общепринятому уровню:" + level + ". Возраст ученика: "+ age + ".Тематика текста для создания: " + topic + ". Пожалуйста при создании ориентируйся на эти параметры.";
                dtoClass = TrueFalseGenerationDto.class;
            }
            case ABCD -> {
                prompt = """
                Создать текст и вопросы с вариантами ответов ABCD. Текст должен быть на английском языке, не менее 100 слов.
                После текста создай несколько вопросов с 4 вариантами ответов (A, B, C, D), где только один ответ правильный.
                Строго следуй структуре JSON файла. Не придумывай дополнительных полей. Используй названия полей как в примере.
                Ответ должен быть в формате JSON:
                {
                  "type": "ABCD",
                  "createdText": "Сгенерированный текст",
                  "questions": ["вопрос1", "вопрос2", ...],
                  "answers": ["A", "B", ...],
                  "dictionary": [
                    { "question": "вопрос1", "answer": "A" },
                    { "question": "вопрос2", "answer": "B" }
                  ]
                }
                """ + "Уровень знаний ученика: " + level + ". Возраст ученика: "+ age + ". Тематика: " + topic + ". Пожалуйста при создании ориентируйся на эти параметры.";
                dtoClass = ABCDGenerationDto.class;
            }
            case OPENQUESTIONS -> {
                prompt = """
                Создать текст и открытые вопросы к нему. Текст должен быть на английском языке, не менее 100 слов.
                После текста создай несколько открытых вопросов, на которые нужно дать развернутый ответ.
                Строго следуй структуре JSON файла. Не придумывай дополнительных полей. Используй названия полей как в примере.
                Ответ должен быть в формате JSON:
                {
                  "type": "Open Questions",
                  "createdText": "Сгенерированный текст",
                  "questions": ["открытый вопрос1", "открытый вопрос2", ...],
                  "answers": ["правильный ответ1", "правильный ответ2", ...],
                  "dictionary": [
                    { "question": "открытый вопрос1", "answer": "правильный ответ1" },
                    { "question": "открытый вопрос2", "answer": "правильный ответ2" }
                  ]
                }
                """ + "Уровень знаний ученика: " + level + ". Возраст ученика: "+ age + ". Тематика: " + topic + ". Пожалуйста при создании ориентируйся на эти параметры.";
                dtoClass = OpenQuestionsGenerationDto.class;
            }
            case DIALOGUE -> {
                prompt = """
                Создать диалог на английском языке между двумя или более персонажами.
                Диалог должен быть естественным, соответствующим уровню студента и теме.
                После диалога можно добавить вопросы для понимания (опционально).
                Строго следуй структуре JSON файла. Не придумывай дополнительных полей. Используй названия полей как в примере.
                Ответ должен быть в формате JSON:
                {
                  "type": "Dialogue",
                  "createdText": "Полный текст диалога",
                  "questions": ["вопрос по диалогу1", "вопрос по диалогу2", ...],
                  "answers": ["ответ1", "ответ2", ...],
                  "dictionary": [
                    { "question": "вопрос по диалогу1", "answer": "ответ1" },
                    { "question": "вопрос по диалогу2", "answer": "ответ2" }
                  ]
                }
                """ + "Уровень знаний ученика: " + level + ". Возраст ученика: "+ age + ". Тематика диалога: " + topic + ". Пожалуйста при создании ориентируйся на эти параметры.";
                dtoClass = DialogueGenerationDto.class;
            }
            default -> throw new UnsupportedOperationException("Unsupported exercise type: " + exerciseType);
        }

        String response;
        try {
            response = sendRequest(prompt).block();
            log.info("Response from GPT: {}", response);
        } catch (Exception e) {
            log.error("Failed to get response from GPT: {}", e.getMessage());
            throw new RuntimeException("Ошибка при запросе к GPT API", e);
        }

        String jsonString = extractJsonFromContent(response);
        log.info("Extracted JSON: {}", jsonString);

        try {
            GenerationExerciseDto generationExerciseDto = objectMapper.readValue(jsonString, dtoClass);
            log.info("Created {} exercise: {}", exerciseType.getName(), generationExerciseDto);

            ExerciseTableRecord exerciseRecord = ExerciseTableRecord.fromDto(generationExerciseDto, user);
            exerciseRepository.save(exerciseRecord);

            return generationExerciseDto;
        } catch (Exception e) {
            log.error("Error parsing JSON to {}: {}, error: {}", dtoClass.getSimpleName(), jsonString, e.getMessage());
            throw new RuntimeException("Ошибка при разборе ответа GPT", e);
        }
    }

    private String extractJsonFromContent(String response) {
        try {
            if (response != null && response.contains("\"type\"")) {
                String cleanedResponse = removeDuplicateKey(response, "type");
                objectMapper.readTree(cleanedResponse);
                return cleanedResponse.trim();
            }
            JsonNode jsonNode = objectMapper.readTree(response);
            String content = jsonNode.path("choices")
                    .path(0)
                    .path("message")
                    .path("content")
                    .asText();
            if (content == null || content.isBlank()) {
                throw new RuntimeException("Пустое поле content в ответе GPT");
            }
            String cleanedContent = content
                    .replace("```json\n", "")
                    .replace("\n```", "")
                    .trim();
            objectMapper.readTree(cleanedContent);
            return cleanedContent;
        } catch (Exception e) {
            log.error("Error extracting JSON from GPT response: {}, error: {}", response, e.getMessage());
            throw new RuntimeException("Ошибка при извлечении JSON из ответа GPT", e);
        }
    }

    private String removeDuplicateKey(String json, String key) {
        int firstIndex = json.indexOf("\"" + key + "\"");
        if (firstIndex < 0) {
            return json;
        }
        int secondIndex = json.indexOf("\"" + key + "\"", firstIndex + 1);
        if (secondIndex < 0) {
            return json;
        }
        return json.replaceFirst(",?\\s*\\\"" + key + "\\\"\\s*:\\s*\\\"[^\\\"]*\\\"", "");
    }
}