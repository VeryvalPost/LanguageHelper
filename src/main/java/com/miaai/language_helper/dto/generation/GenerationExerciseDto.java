package com.miaai.language_helper.dto.generation;  // Твой пакет

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.miaai.language_helper.dto.ExerciseDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class GenerationExerciseDto extends ExerciseDto {
    private String type;
    private String createdText;
    private List<String> questions;
    private List<String> answers;
    private List<DictionaryEntry> dictionary;  // ← Общий тип
    private Map<String, Object> metadata;

    @Override
    public String getExerciseType() {
        return "Creation";
    }

    // DictionaryEntry — общий для всех generation-DTO
    @Data
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DictionaryEntry {
        private String question;
        private String answer;
    }
}
