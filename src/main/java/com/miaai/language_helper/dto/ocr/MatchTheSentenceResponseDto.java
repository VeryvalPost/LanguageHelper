package com.miaai.language_helper.dto.ocr;

import com.miaai.language_helper.dto.ExerciseDto;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class MatchTheSentenceResponseDto extends ExerciseDto {
    private String type = "Match The Sentence";
    private List<String> questions;
    private List<String> answers;
    private List<DictionaryEntry> dictionary;
    private String createdText;
    private Map<String, Object> metadata;

    @Override
    public String getExerciseType() {
        return "Match The Sentence";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @SuperBuilder
    public static class DictionaryEntry {
        private int question;
        private int answer;
    }
}