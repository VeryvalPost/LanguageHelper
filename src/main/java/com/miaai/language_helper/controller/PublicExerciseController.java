package com.miaai.language_helper.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miaai.language_helper.dto.ExerciseSummaryDto;
import com.miaai.language_helper.model.ExerciseTableRecord;
import com.miaai.language_helper.dto.payload.TogglePublicRequest;
import com.miaai.language_helper.dto.payload.TogglePublicResponse;
import com.miaai.language_helper.repository.ExerciseRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;


@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PublicExerciseController {

    private final ExerciseRepository exerciseRepository;
    private final ObjectMapper objectMapper;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @GetMapping("/public/exercise/{uuid}")
    public ResponseEntity<?> getPublicExercise(@PathVariable String uuid) {
        try {
            log.info("Public request for UUID: {}", uuid);  // ← Лог входящего запроса
            if (!isValidUUID(uuid)) {
                log.warn("Invalid UUID: {}", uuid);
                return ResponseEntity.badRequest().build();
            }
            UUID uuidObj = UUID.fromString(uuid);
            Optional<ExerciseTableRecord> exerciseOpt = exerciseRepository.findByUuidAndIsPublic(uuidObj, true);
            if (exerciseOpt.isEmpty()) {
                log.warn("Not found or not public: {}", uuid);
                return ResponseEntity.notFound().build();
            }
            ExerciseTableRecord exercise = exerciseOpt.get();
            log.info("Found public exercise {} (isPublic: {}, type: {})", uuid, exercise.isPublic(), exercise.getType());

            // Build response DTO
            String exerciseDataJson = objectMapper.writeValueAsString(exercise.getExercise());
            log.info("Serialized exerciseData (first 100 chars): {}", exerciseDataJson.substring(0, Math.min(100, exerciseDataJson.length())) + "...");  // ← Лог JSON

            ExerciseSummaryDto dto = ExerciseSummaryDto.builder()
                    .uuid(exercise.getUuid().toString())
                    .type(exercise.getType())
                    .isPublic(exercise.isPublic())
                    .exerciseData(exerciseDataJson)
                    .createdText(exercise.getCreatedText())
                    .updatedAt(exercise.getUpdatedAt())  // Или createdAt, если typo
                    .build();

            log.info("Returning DTO: {}", dto);  // ← Лог всего ответа (toString от @Data)
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Error in public get {}: {}", uuid, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/exercise/{uuid}/toggle-public")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TogglePublicResponse> togglePublic(@PathVariable String uuid,
                                                             @RequestBody TogglePublicRequest request,
                                                             Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("Toggle request for {} by {}: new isPublic={}", uuid, email, request.getIsPublic());

            Optional<ExerciseTableRecord> exerciseOpt = exerciseRepository.findByUuidAndUser_Email(UUID.fromString(uuid), email);
            if (exerciseOpt.isEmpty()) {
                log.error("Not found for {} / {}", uuid, email);
                return ResponseEntity.notFound().build();
            }
            ExerciseTableRecord exercise = exerciseOpt.get();
            exercise.setIsPublic(request.getIsPublic());
            exercise.setUpdatedAt(LocalDateTime.now());  // ← Принудительно dirty для UPDATE

            exerciseRepository.saveAndFlush(exercise);  // ← Flush: Сразу коммит в БД

            log.info("Toggled to {} for ID {} (updatedAt={})", exercise.isPublic(), exercise.getId(), exercise.getUpdatedAt());

            String publicUrl = request.getIsPublic() ? frontendUrl + "/public/exercise/" + uuid : null;
            return ResponseEntity.ok(new TogglePublicResponse(true, request.getIsPublic(), publicUrl));
        } catch (Exception e) {
            log.error("Toggle error: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }


    private boolean isValidUUID(String uuid) {
        try {
            UUID.fromString(uuid);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}
