package com.miaai.language_helper.dto.generation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;


@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class DialogueGenerationDto extends GenerationExerciseDto {
    private String type = "Dialogue";

    @Override
    public String getExerciseType() {
        return "Dialogue";
    }
}