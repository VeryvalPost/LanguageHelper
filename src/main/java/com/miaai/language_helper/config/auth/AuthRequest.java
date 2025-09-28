package com.miaai.language_helper.config.auth;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String email;
    private String password;

}