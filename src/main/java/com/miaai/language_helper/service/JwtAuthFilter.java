package com.miaai.language_helper.service;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Добавляем подробное логирование для диагностики
        log.info("=== JWT FILTER DEBUG ===");
        log.info("Request URI: {}", request.getRequestURI());
        log.info("Request Method: {}", request.getMethod());

        // Пропускаем OPTIONS-запросы для CORS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            log.info("Skipping OPTIONS request");
            filterChain.doFilter(request, response);
            return;
        }

        final String requestURI = request.getRequestURI();

        // Публичные endpoint'ы
        if (isPublicEndpoint(requestURI)) {
            log.info("Public endpoint - skipping JWT check: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        log.info("Authorization header: {}", authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("No Bearer token found for protected endpoint: {}", requestURI);
            filterChain.doFilter(request, response); // Spring Security сам вернёт 401/403 при необходимости
            return;
        }

        try {
            String token = authHeader.substring(7);
            log.info("JWT token length: {}", token.length());

            String email = jwtService.extractEmail(token);
            log.info("Extracted email from token: {}", email);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                log.info("Loading user details for: {}", email);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                log.info("User details loaded successfully: {}", userDetails.getUsername());

                if (jwtService.isTokenValid(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("Authentication SUCCESS for: {}", email);
                } else {
                    log.error("Token INVALID for: {}", email);
                }
            } else {
                log.warn("Email is null or user already authenticated");
            }
        } catch (Exception e) {
            log.error("JWT processing error for {}: {}", requestURI, e.getMessage(), e);
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid JWT");
            return;
        }

        log.info("=== END JWT FILTER DEBUG ===");
        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestURI) {
        return requestURI.startsWith("/api/public/") ||
                requestURI.startsWith("/api/authenticate") ||
                requestURI.startsWith("/api/register") ||
                requestURI.startsWith("/api/health") ||
                requestURI.startsWith("/api/ready") ||
                requestURI.startsWith("/api/debug/");
    }
}