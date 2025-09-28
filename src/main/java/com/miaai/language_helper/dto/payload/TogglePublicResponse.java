package com.miaai.language_helper.dto.payload;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TogglePublicResponse {
    private boolean success;
    @JsonProperty("isPublic")
    private boolean isPublic;
    private String publicUrl;
}