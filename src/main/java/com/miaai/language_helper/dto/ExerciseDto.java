package com.miaai.language_helper.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = com.miaai.language_helper.dto.generation.GenerationExerciseDto.class, name = "Creation"),
        @JsonSubTypes.Type(value = com.miaai.language_helper.dto.generation.TrueFalseGenerationDto.class, name = "True/False"),
        @JsonSubTypes.Type(value = com.miaai.language_helper.dto.generation.ABCDGenerationDto.class, name = "ABCD"),
        @JsonSubTypes.Type(value = com.miaai.language_helper.dto.generation.OpenQuestionsGenerationDto.class, name = "Open Questions"),
        @JsonSubTypes.Type(value = com.miaai.language_helper.dto.generation.DialogueGenerationDto.class, name = "Dialogue"),
        @JsonSubTypes.Type(value = com.miaai.language_helper.dto.ocr.FillTheGapsResponseDto.class, name = "Fill The Gaps"),
        @JsonSubTypes.Type(value = com.miaai.language_helper.dto.ocr.MatchTheSentenceResponseDto.class, name = "Match The Sentence")
})
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@SuperBuilder
@NoArgsConstructor
public abstract class ExerciseDto {
    public abstract String getExerciseType();
    public abstract String getCreatedText();
    public abstract List<String> getQuestions();
    public abstract Map<String, Object> getMetadata();
}