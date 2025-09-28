package com.miaai.language_helper.config.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserInfoDto {
    private Long id;
    private String email;
    private String username;
}