package com.miaai.language_helper.dto.generation;  // Твой пакет

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class TrueFalseGenerationDto extends GenerationExerciseDto {
    private String type = "True/False";
    private Map<String, Object> metadata;  // Если нужно переопределить — ок, но можно убрать

    @Override
    public String getExerciseType() {
        return "True/False";
    }

    @Override
    public Map<String, Object> getMetadata() {
        return this.metadata;
    }
}
