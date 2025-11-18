package com.devd.spring.bookstorecatalogservice.integration;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

/**
 * Test security configuration that disables OAuth2 authentication for integration tests
 * Uses Order(1) to override the main security configuration (Order(100))
 */
@Configuration
@Profile("integration-test")
@Order(1)
public class TestSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .anyRequest().permitAll()
            .and()
                .csrf().disable();
    }
}