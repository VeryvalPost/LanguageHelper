package com.miaai.language_helper.controller;  // Твой пакет

import com.miaai.language_helper.dto.ExerciseDto;
import com.miaai.language_helper.dto.ExerciseSaveRequest;
import com.miaai.language_helper.dto.ExerciseType;
import com.miaai.language_helper.dto.generation.GenerationExerciseDto;
import com.miaai.language_helper.dto.generation.TrueFalseGenerationDto;
import com.miaai.language_helper.dto.ocr.FillTheGapsResponseDto;
import com.miaai.language_helper.dto.ocr.MatchTheSentenceResponseDto;
import com.miaai.language_helper.model.ExerciseTableRecord;
import com.miaai.language_helper.model.User;
import com.miaai.language_helper.repository.ExerciseRepository;
import com.miaai.language_helper.repository.UserRepository;
import com.miaai.language_helper.service.GptRequestService;
import com.miaai.language_helper.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/exercise")
@RequiredArgsConstructor
public class ExerciseController {
    private final GptRequestService gptRequestService;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    @PostMapping("/save")
    public ResponseEntity<?> saveExercise(
            @RequestBody ExerciseSaveRequest exerciseRequest,
            Authentication authentication) {
        if (exerciseRequest == null) {
            log.warn("Null exercise request received");
            return ResponseEntity.badRequest().body(Map.of("error", "Request body is required"));
        }

        try {
            String email = authentication.getName();
            User user = userService.findUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ExerciseDto exerciseDto = convertToExerciseDto(exerciseRequest);

            ExerciseTableRecord exerciseRecord = ExerciseTableRecord.fromDto(exerciseDto, user);

            exerciseRepository.save(exerciseRecord);

            log.info("Exercise saved successfully for user {} with UUID {}", user.getEmail(), exerciseRecord.getUuidAsString());

            return ResponseEntity.ok(Map.of(
                    "message", "Exercise saved successfully",
                    "uuid", exerciseRecord.getUuidAsString()  // ← Используем transient геттер для строки
            ));

        } catch (Exception e) {
            log.error("Error saving exercise", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save exercise: " + e.getMessage()));
        }
    }

    private ExerciseDto convertToExerciseDto(ExerciseSaveRequest request) {
        switch (request.getType()) {
            case "True/False":
                TrueFalseGenerationDto trueFalseDto = TrueFalseGenerationDto.builder()
                        .type("True/False")  // ← Добавил: для JSON и схемы БД
                        .createdText(request.getCreatedText())
                        .questions(request.getQuestions())
                        .answers(request.getAnswers())
                        .dictionary(convertCreationDictionary(request.getDictionary()))
                        .metadata(request.getMetadata())  // Если есть в request
                        .build();
                return trueFalseDto;  // Автоматически полиморфно в ExerciseDto

            case "Fill The Gaps":
                return FillTheGapsResponseDto.builder()
                        .type("Fill The Gaps")  // ← Добавил, если нужно для JSON (но в DTO убрано, чтобы избежать дубля)
                        .questions(request.getQuestions())
                        .answers(request.getAnswers())
                        .dictionary(convertFillTheGapsDictionary(request.getDictionary()))
                        .createdText(request.getCreatedText())
                        .metadata(request.getMetadata())
                        .build();

            case "Match The Sentence":
                return MatchTheSentenceResponseDto.builder()
                        .type("Match The Sentence")  // ← Аналогично
                        .questions(request.getQuestions())
                        .answers(request.getAnswers())
                        .dictionary(convertMatchTheSentenceDictionary(request.getDictionary()))
                        .createdText(request.getCreatedText())
                        .metadata(request.getMetadata())
                        .build();

            default:
                throw new IllegalArgumentException("Unknown exercise type: " + request.getType());
        }
    }

    private List<GenerationExerciseDto.DictionaryEntry> convertCreationDictionary(List<ExerciseSaveRequest.DictionaryEntry> dictionary) {
        if (dictionary == null) return Collections.emptyList();
        return dictionary.stream().map(entry -> {
            GenerationExerciseDto.DictionaryEntry dictEntry = new GenerationExerciseDto.DictionaryEntry();
            dictEntry.setQuestion(entry.getQuestionIndex() != null ? entry.getQuestionIndex().toString() : entry.getQuestion());
            dictEntry.setAnswer(entry.getAnswerIndex() != null ? entry.getAnswerIndex().toString() : entry.getAnswer());
            return dictEntry;
        }).collect(Collectors.toList());
    }

    private List<FillTheGapsResponseDto.DictionaryEntry> convertFillTheGapsDictionary(List<ExerciseSaveRequest.DictionaryEntry> dictionary) {
        if (dictionary == null) return Collections.emptyList();
        return dictionary.stream().map(entry -> {
            FillTheGapsResponseDto.DictionaryEntry dictEntry = new FillTheGapsResponseDto.DictionaryEntry();
            if (entry.getQuestionIndex() != null) {
                dictEntry.setQuestion(entry.getQuestionIndex());
            } else if (entry.getQuestion() != null) {
                dictEntry.setQuestion(Integer.parseInt(entry.getQuestion()));
            }
            if (entry.getAnswerIndex() != null) {
                dictEntry.setAnswer(entry.getAnswerIndex());
            } else if (entry.getAnswer() != null) {
                dictEntry.setAnswer(Integer.parseInt(entry.getAnswer()));
            }
            return dictEntry;
        }).collect(Collectors.toList());
    }

    private List<MatchTheSentenceResponseDto.DictionaryEntry> convertMatchTheSentenceDictionary(List<ExerciseSaveRequest.DictionaryEntry> dictionary) {
        if (dictionary == null) return Collections.emptyList();
        return dictionary.stream().map(entry -> {
            MatchTheSentenceResponseDto.DictionaryEntry dictEntry = new MatchTheSentenceResponseDto.DictionaryEntry();
            if (entry.getQuestionIndex() != null) {
                dictEntry.setQuestion(entry.getQuestionIndex());
            } else if (entry.getQuestion() != null) {
                dictEntry.setQuestion(Integer.parseInt(entry.getQuestion()));
            }
            if (entry.getAnswerIndex() != null) {
                dictEntry.setAnswer(entry.getAnswerIndex());
            } else if (entry.getAnswer() != null) {
                dictEntry.setAnswer(Integer.parseInt(entry.getAnswer()));
            }
            return dictEntry;
        }).collect(Collectors.toList());
    }

    @GetMapping("/truefalse")
    public ResponseEntity<?> createTrueFalseText(
            @RequestParam String level,
            @RequestParam String age,
            @RequestParam String topic,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("Creating True/False exercise for user email: {}, level: {}, age: {}, topic: {}",
                    email, level, age, topic);
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                log.warn("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            User user = userOpt.get();

            // Передаем параметры в сервис
            GenerationExerciseDto createdText = gptRequestService.createTrueFalseWithParams(
                    ExerciseType.TRUEFALSE, user, level, age, topic);

            log.info("Created True/False exercise text for user {}: {}", user.getEmail(), createdText);
            return ResponseEntity.ok(createdText);
        } catch (Exception e) {
            log.error("Error creating True/False exercise", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create exercise: " + e.getMessage()));
        }
    }
}

