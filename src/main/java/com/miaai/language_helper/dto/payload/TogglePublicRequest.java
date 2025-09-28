package com.miaai.language_helper.dto.payload;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TogglePublicRequest {
    @JsonProperty("isPublic")
    private Boolean isPublic;
}
