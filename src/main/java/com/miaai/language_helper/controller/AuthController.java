package com.miaai.language_helper.controller;

import com.miaai.language_helper.config.auth.AuthRequest;
import com.miaai.language_helper.config.auth.AuthResponse;
import com.miaai.language_helper.config.auth.UserInfoDto;
import com.miaai.language_helper.model.User;
import com.miaai.language_helper.repository.UserRepository;
import com.miaai.language_helper.service.JwtService;
import com.miaai.language_helper.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    @PostMapping("/authenticate")
    public ResponseEntity<AuthResponse> authenticate(@RequestBody AuthRequest authRequest) {
        log.info("Authenticating user with email: {}", authRequest.getEmail());

        try {
            // Аутентификация через AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getEmail(),
                            authRequest.getPassword()
                    )
            );

            // После успешной аутентификации получаем пользователя
            User authUser = userService.findUserByEmail(authRequest.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            String token = jwtService.generateToken(authentication);

            return ResponseEntity.ok(AuthResponse.builder()
                    .id(authUser.getId())
                    .email(authUser.getEmail())
                    .username(authUser.getUsername())
                    .token(token)
                    .build());

        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                            .error("Неверные учетные данные")
                            .build());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest authRequest) {
        log.info("Registering new user with email: {}", authRequest);

        try {
            User user = userService.registerUser(authRequest.getUsername(), authRequest.getEmail(), authRequest.getPassword());
            String token = jwtService.generateToken(user.getEmail());
            log.info(String.valueOf(user));
            User registredUser = userRepository.findByEmail(authRequest.getEmail()).get();
            log.info(String.valueOf(registredUser));

            return ResponseEntity.ok(AuthResponse.builder()
                    .id(registredUser.getId())
                    .email(registredUser.getEmail())
                    .token(token)
                    .build());

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(AuthResponse.builder()
                            .error(e.getMessage())
                            .build());
        }



    }
    private boolean checkPassword(String rawPassword, String encodedPassword) {

        log.info(passwordEncoder.encode(rawPassword));
        log.info(encodedPassword);
        return rawPassword.equals(encodedPassword);
    }
    @GetMapping("/me")
    public ResponseEntity<UserInfoDto> getCurrentUser(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findUserByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            UserInfoDto userInfo = UserInfoDto.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .build();

            return ResponseEntity.ok(userInfo);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}