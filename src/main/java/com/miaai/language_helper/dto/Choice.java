package com.miaai.language_helper.dto;

import lombok.Data;

@Data
public class Choice {
    private Object logprobs;
    private String finish_reason;
    private String native_finish_reason;
    private int index;
    private Message message;
}
