package com.miaai.language_helper.service;

import com.miaai.language_helper.model.User;
import com.miaai.language_helper.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService{

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public User registerUser(String username, String email, String password) {
        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .enabled(true)
                .build();

        // Сначала сохраняем пользователя
        User savedUser = userRepository.save(user);

        // Затем добавляем authority через JdbcTemplate
        String authoritySql = "INSERT INTO authorities (user_email, authority) VALUES (?, ?)";
        jdbcTemplate.update(authoritySql, email, "ROLE_USER");

        return savedUser;
    }

    public List<String> getAuthorities(String email) {
        String sql = "SELECT authority FROM authorities WHERE user_email = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("authority"), email);
    }


    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}