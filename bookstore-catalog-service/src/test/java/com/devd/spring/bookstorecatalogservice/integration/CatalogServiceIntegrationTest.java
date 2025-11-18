package com.devd.spring.bookstorecatalogservice.integration;

import com.devd.spring.bookstorecatalogservice.BookstoreCatalogServiceApplication;
import com.devd.spring.bookstorecatalogservice.web.CreateProductCategoryRequest;
import com.devd.spring.bookstorecatalogservice.web.CreateProductRequest;
import com.devd.spring.bookstorecatalogservice.web.CreateOrUpdateReviewRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Catalog Service using Testcontainers
 * Tests product management, category operations, and review functionality
 * with real database interactions using MySQL container
 */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = {BookstoreCatalogServiceApplication.class, TestSecurityConfig.class}
)
@ActiveProfiles("integration-test")
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class CatalogServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("bookstore_catalog_test")
            .withUsername("test_user")
            .withPassword("test_password")
            .withReuse(true);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.MySQL8Dialect");
    }

    @BeforeEach
    void setUp() {
        System.out.println("MySQL container is running: " + mysql.isRunning());
        System.out.println("MySQL JDBC URL: " + mysql.getJdbcUrl());
    }

    @Test
    @DisplayName("Should create product category successfully")
    void shouldCreateProductCategorySuccessfully() throws Exception {
        // Given
        CreateProductCategoryRequest request = new CreateProductCategoryRequest();
        request.setProductCategoryName("Fiction Books");
        request.setDescription("Category for fiction books and novels");

        // When & Then
        mockMvc.perform(post("/productCategory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"));
    }

    @Test
    @DisplayName("Should get all product categories with pagination")
    void shouldGetAllProductCategoriesWithPagination() throws Exception {
        // Given - First create a category
        CreateProductCategoryRequest categoryRequest = new CreateProductCategoryRequest();
        categoryRequest.setProductCategoryName("Technology Books");
        categoryRequest.setDescription("Books about technology and programming");

        mockMvc.perform(post("/productCategory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated());

        // When & Then
        mockMvc.perform(get("/productCategories")
                .param("page", "0")
                .param("size", "10")
                .param("sort", "productCategoryName,asc"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.page").exists())
                .andExpect(jsonPath("$.page.content", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Should create product successfully")
    void shouldCreateProductSuccessfully() throws Exception {
        // Given - First create a category
        CreateProductCategoryRequest categoryRequest = new CreateProductCategoryRequest();
        categoryRequest.setProductCategoryName("Programming Books");
        categoryRequest.setDescription("Books about programming languages");

        String categoryResponse = mockMvc.perform(post("/productCategory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        String categoryId = categoryResponse.substring(categoryResponse.lastIndexOf("/") + 1);

        // Create product request
        CreateProductRequest productRequest = new CreateProductRequest();
        productRequest.setProductName("Clean Code");
        productRequest.setDescription("A handbook of agile software craftsmanship");
        productRequest.setPrice(45.99);
        productRequest.setProductCategoryId(categoryId);
        productRequest.setAvailableItemCount(100);

        // When & Then
        mockMvc.perform(post("/product")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(productRequest)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"));
    }

    @Test
    @DisplayName("Should get product by ID")
    void shouldGetProductById() throws Exception {
        // Given - Create category and product
        CreateProductCategoryRequest categoryRequest = new CreateProductCategoryRequest();
        categoryRequest.setProductCategoryName("Software Engineering");
        categoryRequest.setDescription("Books about software engineering");

        String categoryResponse = mockMvc.perform(post("/productCategory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        String categoryId = categoryResponse.substring(categoryResponse.lastIndexOf("/") + 1);

        CreateProductRequest productRequest = new CreateProductRequest();
        productRequest.setProductName("Design Patterns");
        productRequest.setDescription("Elements of reusable object-oriented software");
        productRequest.setPrice(59.99);
        productRequest.setProductCategoryId(categoryId);
        productRequest.setAvailableItemCount(50);

        String productResponse = mockMvc.perform(post("/product")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(productRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        String productId = productResponse.substring(productResponse.lastIndexOf("/") + 1);

        // When & Then
        mockMvc.perform(get("/product/{productId}", productId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.productName", is("Design Patterns")))
                .andExpect(jsonPath("$.description", is("Elements of reusable object-oriented software")))
                .andExpect(jsonPath("$.price", is(59.99)));
    }

    @Test
    @DisplayName("Should get all products with pagination")
    void shouldGetAllProductsWithPagination() throws Exception {
        // Given - Create category and multiple products
        CreateProductCategoryRequest categoryRequest = new CreateProductCategoryRequest();
        categoryRequest.setProductCategoryName("Technical Books");
        categoryRequest.setDescription("Technical programming books");

        String categoryResponse = mockMvc.perform(post("/productCategory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        String categoryId = categoryResponse.substring(categoryResponse.lastIndexOf("/") + 1);

        // Create first product
        CreateProductRequest product1 = new CreateProductRequest();
        product1.setProductName("Java: The Complete Reference");
        product1.setDescription("Comprehensive guide to Java programming");
        product1.setPrice(75.99);
        product1.setProductCategoryId(categoryId);
        product1.setAvailableItemCount(25);

        mockMvc.perform(post("/product")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(product1)))
                .andExpect(status().isCreated());

        // Create second product
        CreateProductRequest product2 = new CreateProductRequest();
        product2.setProductName("Spring Boot in Action");
        product2.setDescription("Learn Spring Boot framework");
        product2.setPrice(55.99);
        product2.setProductCategoryId(categoryId);
        product2.setAvailableItemCount(30);

        mockMvc.perform(post("/product")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(product2)))
                .andExpect(status().isCreated());

        // When & Then
        mockMvc.perform(get("/products")
                .param("page", "0")
                .param("size", "10")
                .param("sort", "productName,asc"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.page").exists())
                .andExpect(jsonPath("$.page.content", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("Should create product review successfully")
    void shouldCreateProductReviewSuccessfully() throws Exception {
        // Given - Create category and product first
        CreateProductCategoryRequest categoryRequest = new CreateProductCategoryRequest();
        categoryRequest.setProductCategoryName("Educational Books");
        categoryRequest.setDescription("Books for education");

        String categoryResponse = mockMvc.perform(post("/productCategory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        String categoryId = categoryResponse.substring(categoryResponse.lastIndexOf("/") + 1);

        CreateProductRequest productRequest = new CreateProductRequest();
        productRequest.setProductName("Effective Java");
        productRequest.setDescription("Best practices for Java programming");
        productRequest.setPrice(49.99);
        productRequest.setProductCategoryId(categoryId);
        productRequest.setAvailableItemCount(75);

        String productResponse = mockMvc.perform(post("/product")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(productRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        String productId = productResponse.substring(productResponse.lastIndexOf("/") + 1);

        // Create review request
        CreateOrUpdateReviewRequest reviewRequest = new CreateOrUpdateReviewRequest();
        reviewRequest.setProductId(productId);
        reviewRequest.setReviewMessage("Excellent book for Java developers!");
        reviewRequest.setRatingValue(5.0);

        // When & Then
        mockMvc.perform(post("/review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reviewRequest)))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should verify database connectivity and container status")
    void shouldVerifyDatabaseConnectivity() {
        // Given - MySQL container is running
        assertThat(mysql.isRunning()).isTrue();
        assertThat(mysql.getDatabaseName()).isEqualTo("bookstore_catalog_test");
        assertThat(mysql.getUsername()).isEqualTo("test_user");
        
        // Verify database connection
        String jdbcUrl = mysql.getJdbcUrl();
        assertThat(jdbcUrl).contains("bookstore_catalog_test");
        assertThat(jdbcUrl).contains("mysql");
    }
}