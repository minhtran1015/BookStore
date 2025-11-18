package com.devd.spring.bookstoreorderservice.integration;

import com.devd.spring.bookstoreorderservice.BookstoreOrderServiceApplication;
import com.devd.spring.bookstoreorderservice.web.CartItemRequest;
import com.devd.spring.bookstoreorderservice.web.CreateOrderRequest;
import com.devd.spring.bookstoreorderservice.web.PreviewOrderRequest;
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
 * Integration tests for Order Service using Testcontainers
 * Tests cart management, order creation, order processing, and service-to-service communication
 * with real database interactions using MySQL container
 */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = {BookstoreOrderServiceApplication.class, TestSecurityConfig.class}
)
@ActiveProfiles("integration-test")
@AutoConfigureMockMvc
@Testcontainers
@Transactional
@DisplayName("Order Service Integration Tests")
class OrderServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Container
    static final MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("bookstore_order_test")
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
    @DisplayName("Should create cart successfully")
    void shouldCreateCartSuccessfully() throws Exception {
        mockMvc.perform(post("/cart")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cartId").exists())
                .andExpect(jsonPath("$.cartId").isNotEmpty());
    }

    @Test
    @DisplayName("Should get cart successfully")
    void shouldGetCartSuccessfully() throws Exception {
        // First create a cart
        mockMvc.perform(post("/cart")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        // Then get the cart
        mockMvc.perform(get("/cart")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should add cart item successfully")
    void shouldAddCartItemSuccessfully() throws Exception {
        // Create a cart item request
        CartItemRequest cartItemRequest = CartItemRequest.builder()
                .productId("product-123")
                .quantity(2)
                .build();

        mockMvc.perform(post("/cart/cartItem")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cartItemRequest)))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should remove cart item successfully")
    void shouldRemoveCartItemSuccessfully() throws Exception {
        // Create a cart item first
        CartItemRequest cartItemRequest = CartItemRequest.builder()
                .productId("product-456")
                .quantity(1)
                .build();

        mockMvc.perform(post("/cart/cartItem")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cartItemRequest)))
                .andExpect(status().isOk());

        // Remove the cart item (using a mock cart item ID)
        String mockCartItemId = "cartitem-123";
        mockMvc.perform(delete("/cart/cartItem/{cartItemId}", mockCartItemId)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should remove all cart items successfully")
    void shouldRemoveAllCartItemsSuccessfully() throws Exception {
        String mockCartId = "cart-123";
        mockMvc.perform(delete("/cart/cartItem")
                .param("cartId", mockCartId)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should create order successfully")
    void shouldCreateOrderSuccessfully() throws Exception {
        CreateOrderRequest orderRequest = CreateOrderRequest.builder()
                .billingAddressId("billing-addr-123")
                .shippingAddressId("shipping-addr-123")
                .paymentMethodId("payment-method-123")
                .build();

        mockMvc.perform(post("/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(orderRequest)))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should get order by ID")
    void shouldGetOrderById() throws Exception {
        // Create an order first
        CreateOrderRequest orderRequest = CreateOrderRequest.builder()
                .billingAddressId("billing-addr-456")
                .shippingAddressId("shipping-addr-456")
                .paymentMethodId("payment-method-456")
                .build();

        mockMvc.perform(post("/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isOk());

        // Test getting order by ID (using a mock order ID)
        String mockOrderId = "order-123";

        mockMvc.perform(get("/order/{orderId}", mockOrderId)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should get my orders")
    void shouldGetMyOrders() throws Exception {
        mockMvc.perform(get("/order/myorders")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Should get all orders (admin endpoint)")
    void shouldGetAllOrders() throws Exception {
        mockMvc.perform(get("/orders")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Should preview order successfully")
    void shouldPreviewOrderSuccessfully() throws Exception {
        PreviewOrderRequest previewRequest = PreviewOrderRequest.builder()
                .billingAddressId("billing-addr-789")
                .shippingAddressId("shipping-addr-789")
                .paymentMethodId("payment-method-789")
                .build();

        mockMvc.perform(post("/previewOrder")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(previewRequest)))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should validate cart item request fields")
    void shouldValidateCartItemRequestFields() throws Exception {
        // Test with invalid cart item request (missing productId)
        CartItemRequest invalidRequest = CartItemRequest.builder()
                .quantity(1)
                // productId is missing
                .build();

        mockMvc.perform(post("/cart/cartItem")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should validate order request fields")
    void shouldValidateOrderRequestFields() throws Exception {
        // Test with invalid order request (missing required fields)
        CreateOrderRequest invalidRequest = CreateOrderRequest.builder()
                .billingAddressId("billing-123")
                // shippingAddressId and paymentMethodId are missing
                .build();

        mockMvc.perform(post("/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }
}