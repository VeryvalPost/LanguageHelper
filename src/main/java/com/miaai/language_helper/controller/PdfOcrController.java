package com.miaai.language_helper.controller;

import com.miaai.language_helper.dto.ExerciseDto;
import com.miaai.language_helper.model.User;
import com.miaai.language_helper.service.GptRequestService;
import com.miaai.language_helper.service.PdfOcrService;
import com.miaai.language_helper.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@Slf4j
@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfOcrController {

    private final PdfOcrService pdfOcrService;
    private final GptRequestService gptRequestService;
    private final UserService userService; // ← Добавьте UserService

    @PostMapping("/upload")
    public ResponseEntity<ExerciseDto> uploadPdf(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        try {
            // Получаем email из аутентификации
            String email = authentication.getName();

            // Находим пользователя через UserService
            User user = userService.findUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String recognizedText = pdfOcrService.extractText(file);
            ExerciseDto cleanedText = gptRequestService.createRecognizedExercise(recognizedText, user);
            log.info("Cleaned text from PDF for user {}: {}", user.getId(), cleanedText);

            return ResponseEntity.ok(cleanedText);

        } catch (Exception e) {
            log.error("Error processing PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}