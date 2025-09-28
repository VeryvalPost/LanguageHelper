package com.miaai.language_helper.dto;


import com.fasterxml.jackson.annotation.JsonValue;


public enum ExerciseType {
    FILLTHEGAP("Fill The Gaps"),
    TRUEFALSE("True/False"),
    MATCHTHESENTENCE("Match The Sentence");

    private final String name;

    ExerciseType(String name) {
        this.name = name;
    }

    @JsonValue
    public String getName() {
        return name;
    }
}