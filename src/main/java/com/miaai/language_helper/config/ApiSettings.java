package com.miaai.language_helper.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class ApiSettings {
    @Value("${api.key}")
    private String apiKey;
    @Value("${api.path}")
    private String apiPath;
}
