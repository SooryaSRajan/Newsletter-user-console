package com.algolovers.newsletterconsole.config.security.oauth;

import com.algolovers.newsletterconsole.service.JwtService;
import com.algolovers.newsletterconsole.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@AllArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    OAuth2StatelessAuthorizationRepository oAuth2StatelessAuthorizationRepository;
    JwtService jwtService;
    UserService userService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        if (response.isCommitted()) {
            logger.debug("Response has already been committed. Unable to redirect");
            return;
        }

        super.clearAuthenticationAttributes(request); //TODO: Clear all cookies
        userService.generateCookieForAuthenticatedUser(authentication, response);

        getRedirectStrategy().sendRedirect(request, response, "/api/user/authorizedUserDetails");
    }
}