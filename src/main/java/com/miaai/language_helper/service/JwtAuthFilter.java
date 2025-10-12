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

        final String requestURI = request.getRequestURI();
        final String method = request.getMethod();

        log.info("=== JWT FILTER START: {} {} ===", method, requestURI);

        // Пропускаем OPTIONS-запросы для CORS
        if ("OPTIONS".equalsIgnoreCase(method)) {
            log.info("Skipping OPTIONS request");
            filterChain.doFilter(request, response);
            return;
        }

        // Публичные endpoint'ы - пропускаем без проверки JWT
        if (isPublicEndpoint(requestURI)) {
            log.info("Public endpoint - skipping JWT check");
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        log.info("Authorization header present: {}", authHeader != null);

        // Если endpoint требует аутентификации, но токена нет - возвращаем ошибку
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("No Bearer token found for protected endpoint: {}", requestURI);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return;
        }

        try {
            String token = authHeader.substring(7);
            log.info("Token length: {}", token.length());

            String email = jwtService.extractEmail(token);
            log.info("Extracted email: {}", email);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                log.info("Loading user details for: {}", email);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                log.info("User found: {}", userDetails.getUsername());

                if (jwtService.isTokenValid(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("Authentication SUCCESS for: {}", email);
                } else {
                    log.error("Token INVALID for: {}", email);
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid JWT token");
                    return;
                }
            } else {
                if (email == null) {
                    log.error("Unable to extract email from token");
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Unable to extract email from token");
                    return;
                }
                log.info("User already authenticated");
            }
        } catch (Exception e) {
            log.error("JWT processing error: {}", e.getMessage(), e);
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "JWT processing error: " + e.getMessage());
            return;
        }

        log.info("=== JWT FILTER END ===");
        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestURI) {
        return requestURI.startsWith("/api/public/") ||
                requestURI.equals("/api/authenticate") ||
                requestURI.equals("/api/register") ||
                requestURI.startsWith("/api/health") ||
                requestURI.startsWith("/api/ready") ||
                requestURI.startsWith("/api/debug/") ||
                // ВРЕМЕННО разрешаем все exercise endpoints без JWT
                requestURI.startsWith("/api/exercise/");
    }
}