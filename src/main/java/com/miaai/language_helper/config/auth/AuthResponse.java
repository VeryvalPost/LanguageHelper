package com.miaai.language_helper.config.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private Long id;
    private String email;
    private String username;
    private String token;
    private String error;
}