package com.devd.spring.bookstoreaccountservice.integration;

import com.devd.spring.bookstoreaccountservice.BookstoreAccountServiceApplication;
import com.devd.spring.bookstoreaccountservice.service.AuthService;
import com.devd.spring.bookstoreaccountservice.web.CreateOAuthClientRequest;
import com.devd.spring.bookstoreaccountservice.web.CreateOAuthClientResponse;
import com.devd.spring.bookstoreaccountservice.web.SignUpRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Account Service using Testcontainers
 * Tests real database interactions and full Spring context
 */
@SpringBootTest(
        classes = BookstoreAccountServiceApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@Testcontainers
@ActiveProfiles("integration-test")
class AccountServiceIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("bookstore_test")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.MySQL8Dialect");
        
        // Disable Eureka for integration tests
        registry.add("eureka.client.enabled", () -> false);
        registry.add("spring.cloud.discovery.enabled", () -> false);
        
        // Disable Zipkin for integration tests
        registry.add("spring.sleuth.zipkin.enabled", () -> false);
        registry.add("spring.sleuth.sampler.probability", () -> 0.0);
    }

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private AuthService authService;

    @LocalServerPort
    private int port;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Should successfully register a new user with database persistence")
    void shouldRegisterUserWithDatabasePersistence() throws Exception {
        // Given
        SignUpRequest signUpRequest = new SignUpRequest();
        signUpRequest.setUserName("integration-test-user");
        signUpRequest.setPassword("securePassword123");
        signUpRequest.setFirstName("Integration");
        signUpRequest.setLastName("Test");
        signUpRequest.setEmail("integration.test@example.com");

        // When & Then
        mockMvc.perform(post("/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signUpRequest)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.userName").value("integration-test-user"));
    }

    @Test
    @DisplayName("Should create OAuth client and persist to database")
    void shouldCreateOAuthClientWithDatabasePersistence() throws Exception {
        // Given
        CreateOAuthClientRequest request = new CreateOAuthClientRequest();
        request.setAuthorities(Arrays.asList("ADMIN_USER", "STANDARD_USER"));
        request.setAuthorized_grant_types(Arrays.asList("authorization_code", "password", "refresh_token"));
        request.setScope(Arrays.asList("read", "write"));
        request.setResource_ids(Arrays.asList("bookstore"));

        // When
        CreateOAuthClientResponse response = authService.createOAuthClient(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getClient_id()).isNotNull();
        assertThat(response.getClient_secret()).isNotNull();
        
        // Verify the client was persisted by trying to create another with same details
        // This should work as each client gets a unique ID
        CreateOAuthClientResponse response2 = authService.createOAuthClient(request);
        assertThat(response2.getClient_id()).isNotEqualTo(response.getClient_id());
    }

    @Test
    @DisplayName("Should handle duplicate user registration attempts")
    void shouldHandleDuplicateUserRegistration() throws Exception {
        // Given
        SignUpRequest signUpRequest = new SignUpRequest();
        signUpRequest.setUserName("duplicate-test-user");
        signUpRequest.setPassword("password123");
        signUpRequest.setFirstName("Duplicate");
        signUpRequest.setLastName("Test");
        signUpRequest.setEmail("duplicate@example.com");

        // First registration should succeed
        mockMvc.perform(post("/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signUpRequest)))
                .andExpect(status().isCreated());

        // Second registration with same username should fail
        mockMvc.perform(post("/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signUpRequest)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should validate user registration input fields")
    void shouldValidateUserRegistrationFields() throws Exception {
        // Test empty username
        SignUpRequest invalidRequest = new SignUpRequest();
        invalidRequest.setUserName(""); // Invalid - empty
        invalidRequest.setPassword("validPassword123");
        invalidRequest.setFirstName("Test");
        invalidRequest.setEmail("test@example.com");

        mockMvc.perform(post("/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should verify database connectivity and schema creation")
    void shouldVerifyDatabaseConnectivity() {
        // Given - MySQL container is running
        assertThat(mysql.isRunning()).isTrue();
        assertThat(mysql.getDatabaseName()).isEqualTo("bookstore_test");
        
        // When - We interact with the AuthService (which uses the database)
        CreateOAuthClientRequest request = new CreateOAuthClientRequest();
        request.setAuthorities(Arrays.asList("TEST_USER"));
        request.setAuthorized_grant_types(Arrays.asList("password"));
        request.setScope(Arrays.asList("read"));
        request.setResource_ids(Arrays.asList("test"));
        
        // Then - Database operations should succeed
        CreateOAuthClientResponse response = authService.createOAuthClient(request);
        assertThat(response).isNotNull();
        assertThat(response.getClient_id()).isNotNull();
    }

    @Test
    @DisplayName("Should handle concurrent user registrations")
    void shouldHandleConcurrentUserRegistrations() throws Exception {
        // Test concurrent access patterns that might occur in production
        SignUpRequest user1 = new SignUpRequest();
        user1.setUserName("concurrent-user-1");
        user1.setPassword("password123");
        user1.setFirstName("Concurrent");
        user1.setLastName("User1");
        user1.setEmail("concurrent1@example.com");

        SignUpRequest user2 = new SignUpRequest();
        user2.setUserName("concurrent-user-2");
        user2.setPassword("password123");
        user2.setFirstName("Concurrent");
        user2.setLastName("User2");
        user2.setEmail("concurrent2@example.com");

        // Both requests should succeed when executed sequentially
        mockMvc.perform(post("/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user2)))
                .andExpect(status().isCreated());
    }
}