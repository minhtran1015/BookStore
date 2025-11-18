package com.devd.spring.bookstorebillingservice.integration;

import com.devd.spring.bookstorebillingservice.BookstoreBillingServiceApplication;
import com.devd.spring.bookstorebillingservice.web.CreateAddressRequest;
import com.devd.spring.bookstorebillingservice.web.UpdateAddressRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Billing Service using Testcontainers
 * Tests address management, billing operations, and database interactions
 * with real database using MySQL container
 */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = {BookstoreBillingServiceApplication.class, TestSecurityConfig.class}
)
@ActiveProfiles("integration-test")
@AutoConfigureMockMvc
@Testcontainers
@Transactional
@DisplayName("Billing Service Integration Tests")
class BillingServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("bookstore_billing_test")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.MySQL8Dialect");
    }

    @BeforeEach
    void setUp() {
        // Any additional setup if needed
    }

    @Test
    @DisplayName("Should verify MySQL container database connectivity")
    void shouldVerifyDatabaseConnectivity() {
        System.out.println("MySQL container is running: " + mysql.isRunning());
        System.out.println("MySQL JDBC URL: " + mysql.getJdbcUrl());
        
        assertThat(mysql.isRunning()).isTrue();
        assertThat(jdbcTemplate).isNotNull();
    }

    @Test
    @DisplayName("Should create address successfully")
    void shouldCreateAddressSuccessfully() throws Exception {
        CreateAddressRequest addressRequest = CreateAddressRequest.builder()
                .addressLine1("123 Main St")
                .addressLine2("Apt 4B")
                .city("New York")
                .state("NY")
                .postalCode("10001")
                .country("US")
                .phone("+1-555-123-4567")
                .build();

        mockMvc.perform(post("/address")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(addressRequest)))
                .andDo(print())
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Should update address successfully")
    void shouldUpdateAddressSuccessfully() throws Exception {
        // First create an address
        CreateAddressRequest createRequest = CreateAddressRequest.builder()
                .addressLine1("456 Oak Ave")
                .city("Los Angeles")
                .state("CA")
                .postalCode("90210")
                .country("US")
                .phone("+1-555-987-6543")
                .build();

        mockMvc.perform(post("/address")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated());

        // Then update the address (using a mock address ID)
        UpdateAddressRequest updateRequest = UpdateAddressRequest.builder()
                .addressId("addr-123")
                .addressLine1("789 Pine St")
                .city("San Francisco")
                .state("CA")
                .postalCode("94102")
                .country("US")
                .phone("+1-555-111-2222")
                .build();

        mockMvc.perform(put("/address")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andDo(print())
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Should get all addresses successfully")
    void shouldGetAllAddressesSuccessfully() throws Exception {
        mockMvc.perform(get("/address")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Should get address by ID successfully")
    void shouldGetAddressByIdSuccessfully() throws Exception {
        String mockAddressId = "addr-456";
        
        mockMvc.perform(get("/address/{addressId}", mockAddressId)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should delete address by ID successfully")
    void shouldDeleteAddressByIdSuccessfully() throws Exception {
        String mockAddressId = "addr-789";
        
        mockMvc.perform(delete("/address/{addressId}", mockAddressId)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should validate create address request fields")
    void shouldValidateCreateAddressRequestFields() throws Exception {
        // Test with invalid address request (missing required fields)
        CreateAddressRequest invalidRequest = CreateAddressRequest.builder()
                .addressLine1("123 Test St")
                .city("TestCity")
                // Missing state, postalCode, country, phone
                .build();

        mockMvc.perform(post("/address")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should validate country code format")
    void shouldValidateCountryCodeFormat() throws Exception {
        // Test with invalid country code (should be 2-letter ISO code)
        CreateAddressRequest invalidRequest = CreateAddressRequest.builder()
                .addressLine1("123 Test St")
                .city("TestCity")
                .state("TS")
                .postalCode("12345")
                .country("USA") // Should be "US" (2-letter code)
                .phone("+1-555-123-4567")
                .build();

        mockMvc.perform(post("/address")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle missing request body gracefully")
    void shouldHandleMissingRequestBodyGracefully() throws Exception {
        mockMvc.perform(post("/address")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should create address with valid minimum required fields")
    void shouldCreateAddressWithMinimumFields() throws Exception {
        CreateAddressRequest minimalRequest = CreateAddressRequest.builder()
                .addressLine1("987 Elm St")
                .city("Chicago")
                .state("IL")
                .postalCode("60601")
                .country("US")
                .phone("+1-312-555-9876")
                .build();

        mockMvc.perform(post("/address")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(minimalRequest)))
                .andDo(print())
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Should create address with all fields populated")
    void shouldCreateAddressWithAllFields() throws Exception {
        CreateAddressRequest completeRequest = CreateAddressRequest.builder()
                .addressLine1("555 Broadway")
                .addressLine2("Suite 200")
                .city("Seattle")
                .state("WA")
                .postalCode("98101")
                .country("US")
                .phone("+1-206-555-0123")
                .build();

        mockMvc.perform(post("/address")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completeRequest)))
                .andDo(print())
                .andExpect(status().isCreated());
    }
}