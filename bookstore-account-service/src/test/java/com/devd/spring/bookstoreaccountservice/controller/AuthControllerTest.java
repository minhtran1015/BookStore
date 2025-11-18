package com.devd.spring.bookstoreaccountservice.controller;

import com.devd.spring.bookstoreaccountservice.service.AuthService;
import com.devd.spring.bookstoreaccountservice.web.CreateOAuthClientRequest;
import com.devd.spring.bookstoreaccountservice.web.CreateOAuthClientResponse;
import com.devd.spring.bookstoreaccountservice.web.CreateUserResponse;
import com.devd.spring.bookstoreaccountservice.web.SignUpRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AuthController
 * 
 * @author: Test Author
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        authController = new AuthController();
        ReflectionTestUtils.setField(authController, "authService", authService);
    }

    @Test
    @DisplayName("Should create OAuth client successfully")
    void shouldCreateOAuthClientSuccessfully() {
        // Given
        CreateOAuthClientRequest request = new CreateOAuthClientRequest();
        request.setAuthorities(Arrays.asList("ADMIN_USER", "STANDARD_USER"));
        request.setAuthorized_grant_types(Arrays.asList("authorization_code", "password"));
        request.setScope(Arrays.asList("read", "write"));
        request.setResource_ids(Arrays.asList("bookstore"));

        String clientId = UUID.randomUUID().toString();
        String clientSecret = "generated-secret";
        CreateOAuthClientResponse mockResponse = new CreateOAuthClientResponse();
        mockResponse.setClient_id(clientId);
        mockResponse.setClient_secret(clientSecret);

        when(authService.createOAuthClient(any(CreateOAuthClientRequest.class)))
                .thenReturn(mockResponse);

        // When
        ResponseEntity<CreateOAuthClientResponse> response = authController.createOAuthClient(request);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getClient_id()).isEqualTo(clientId);
        assertThat(response.getBody().getClient_secret()).isEqualTo(clientSecret);
    }

    @Test
    @DisplayName("Should register user successfully with valid signup request")
    void shouldRegisterUserSuccessfully() {
        // Given
        SignUpRequest signUpRequest = new SignUpRequest();
        signUpRequest.setUserName("testuser");
        signUpRequest.setPassword("password123");
        signUpRequest.setFirstName("Test");
        signUpRequest.setLastName("User");
        signUpRequest.setEmail("test@example.com");

        String userId = UUID.randomUUID().toString();
        CreateUserResponse mockResponse = new CreateUserResponse();
        mockResponse.setUserId(userId);
        mockResponse.setUserName("testuser");

        when(authService.registerUser(any(SignUpRequest.class)))
                .thenReturn(mockResponse);

        // When
        ResponseEntity<?> response = authController.registerUser(signUpRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(CreateUserResponse.class);
        CreateUserResponse userResponse = (CreateUserResponse) response.getBody();
        assertThat(userResponse.getUserId()).isEqualTo(userId);
        assertThat(userResponse.getUserName()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("Should handle service exception during OAuth client creation")
    void shouldHandleServiceExceptionDuringOAuthClientCreation() {
        // Given
        CreateOAuthClientRequest request = new CreateOAuthClientRequest();
        request.setAuthorities(Arrays.asList("ADMIN_USER"));
        
        when(authService.createOAuthClient(any(CreateOAuthClientRequest.class)))
                .thenThrow(new RuntimeException("Service error"));

        // When & Then
        assertThatThrownBy(() -> authController.createOAuthClient(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Service error");
    }

    @Test
    @DisplayName("Should handle service exception during user registration")
    void shouldHandleServiceExceptionDuringUserRegistration() {
        // Given
        SignUpRequest signUpRequest = new SignUpRequest();
        signUpRequest.setUserName("testuser");
        signUpRequest.setPassword("password123");
        signUpRequest.setEmail("test@example.com");
        
        when(authService.registerUser(any(SignUpRequest.class)))
                .thenThrow(new RuntimeException("Registration failed"));

        // When & Then
        assertThatThrownBy(() -> authController.registerUser(signUpRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Registration failed");
    }

    @Test
    @DisplayName("Should handle null request parameters gracefully")
    void shouldHandleNullRequestParameters() {
        // Given
        CreateOAuthClientRequest nullRequest = null;
        
        when(authService.createOAuthClient(any()))
                .thenThrow(new IllegalArgumentException("Request cannot be null"));

        // When & Then
        assertThatThrownBy(() -> authController.createOAuthClient(nullRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Request cannot be null");
    }
}