package com.miaai.language_helper.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseSaveRequest {
    private String type;
    private String createdText;
    private List<String> questions;
    private List<String> answers;
    private List<DictionaryEntry> dictionary;
    private Map<String, Object> metadata;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DictionaryEntry {
        private String question;
        private String answer;
        private Integer questionIndex;
        private Integer answerIndex;
    }
}