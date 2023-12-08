package com.algolovers.newsletterconsole.config.security;

import com.algolovers.newsletterconsole.data.model.api.Result;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.PrintWriter;

@Component
public class AuthEntryPoint implements AuthenticationEntryPoint {

    final ObjectMapper objectMapper;

    public AuthEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        Result<String> result = Result.<String>builder()
                .success(false)
                .message("Unauthorised Request")
                .build();

        String jsonString = objectMapper.writeValueAsString(result);

        try (PrintWriter writer = response.getWriter()) {
            writer.write(jsonString);
            writer.flush();
        }
    }
}
