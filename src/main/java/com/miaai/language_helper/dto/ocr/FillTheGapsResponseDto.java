package com.miaai.language_helper.dto.ocr;

import com.miaai.language_helper.dto.ExerciseDto;
import lombok.*;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FillTheGapsResponseDto extends ExerciseDto {
    private String type = "Fill The Gaps";
    private List<String> questions;
    private List<String> answers;
    private List<DictionaryEntry> dictionary;
    private String createdText;
    private Map<String, Object> metadata;
    @Override
    public String getExerciseType() {
        return "Fill The Gaps";
    }

    @Override
    public String getCreatedText() {
        return this.createdText;
    }

    @Override
    public List<String> getQuestions() {
        return this.questions;
    }

    @Override
    public Map<String, Object> getMetadata() {
        return this.metadata;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DictionaryEntry {
        private int question;
        private int answer;
    }
}