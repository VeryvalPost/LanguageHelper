package com.miaai.language_helper.dto;

import lombok.Data;

@Data
public class Message {
    private String role;
    private String content;
    private String refusal;
    private String reasoning;
}
