package com.miaai.language_helper.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miaai.language_helper.dto.ExerciseDto;
import com.miaai.language_helper.dto.ExerciseSummaryDto;
import com.miaai.language_helper.model.ExerciseTableRecord;
import com.miaai.language_helper.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final ExerciseRepository exerciseRepository;
    private final ObjectMapper objectMapper;  // ← Для сериализации exerciseData

    // 1. Список заданий (summary)
    @GetMapping("/getTasks")
    public ResponseEntity<List<ExerciseSummaryDto>> getUserExercises(Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("Fetching exercises for user email: {}", email);

            List<ExerciseTableRecord> exercises = exerciseRepository.findByUser_Email(email);
            log.info("Found {} exercises for user {}", exercises.size(), email);

            List<ExerciseSummaryDto> summaryList = exercises.stream()
                    .map(exercise -> {
                        ExerciseDto exerciseDto = exercise.getExercise();
                        String type = "Unknown";
                        String contentPreview = "";

                        if (exerciseDto != null) {
                            type = exerciseDto.getExerciseType();
                            contentPreview = getContentPreview(
                                    exerciseDto.getCreatedText() != null
                                            ? exerciseDto.getCreatedText()
                                            : (exerciseDto.getQuestions() != null ? exerciseDto.getQuestions().toString() : "")
                            );
                        }

                        String exerciseDataJson = "{}";  // Fallback
                        if (exerciseDto != null) {
                            try {
                                exerciseDataJson = objectMapper.writeValueAsString(exerciseDto);
                            } catch (JsonProcessingException e) {
                                log.error("Error serializing DTO for exercise {}: {}", exercise.getId(), e.getMessage());
                            }
                        }

                        return ExerciseSummaryDto.builder()
                                .uuid(exercise.getUuid().toString())
                                .type(type)
                                .timestamp(exercise.getCreatedAt())
                                .contentPreview(contentPreview)
                                .exerciseData(exerciseDataJson)
                                .createdText(exercise.getCreatedText())
                                .questionsCount(exercise.getQuestionsCount())
                                .isPublic(exercise.isPublic())
                                .isCompleted(exercise.isCompleted())
                                .updatedAt(exercise.getUpdatedAt())
                                .metadata(exercise.getMetadata())
                                .build(); // Остальные поля null для summary
                    })
                    .collect(Collectors.toList());

            log.info("Returning {} summaries", summaryList.size());
            return ResponseEntity.ok(summaryList);

        } catch (Exception e) {
            log.error("Error fetching user exercises", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 2. Детали задания (full, но тот же DTO)
    @GetMapping("/getTask/{uuid}")
    public ResponseEntity<ExerciseSummaryDto> getExerciseByUuid(@PathVariable String uuid, Authentication authentication) {
        try {
            String email = authentication.getName();
            UUID uuidFromString = UUID.fromString(uuid);
            log.info("Fetching full exercise for UUID: {} by user: {}", uuidFromString, email);

            Optional<ExerciseTableRecord> exerciseOpt = exerciseRepository.findByUuid(uuidFromString);

            if (exerciseOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            ExerciseTableRecord exercise = exerciseOpt.get();

            if (!exercise.getUser().getEmail().equals(email)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            ExerciseDto exerciseDto = exercise.getExercise();
            if (exerciseDto == null) {
                log.warn("Null ExerciseDto for UUID: {}", uuid);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
            }

            String exerciseDataJson;
            try {
                exerciseDataJson = objectMapper.writeValueAsString(exerciseDto);
            } catch (JsonProcessingException e) {
                log.error("Error serializing DTO for {}: {}", uuid, e.getMessage());
                exerciseDataJson = "{}";
            }

            ExerciseSummaryDto response = ExerciseSummaryDto.builder()
                    .uuid(exercise.getUuid().toString())
                    .type(exercise.getType())
                    .timestamp(exercise.getCreatedAt())
                    .contentPreview(getContentPreview(exercise.getCreatedText()))  // Или из DTO
                    .exerciseData(exerciseDataJson)  // Полный JSON
                    .createdText(exercise.getCreatedText())
                    .questionsCount(exercise.getQuestionsCount())
                    .isPublic(exercise.isPublic())
                    .isCompleted(exercise.isCompleted())
                    .updatedAt(exercise.getUpdatedAt())
                    .metadata(exercise.getMetadata())
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching exercise by UUID: {}", uuid, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String getContentPreview(String content) {
        if (content == null || content.length() <= 100) {
            return content;
        }
        return content.substring(0, 100) + "...";
    }
}
